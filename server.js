'use strict';
const express = require('express');
const http = require('http');
const fs = require ('fs')
const path = require('path')

module.exports = class Server {
    constructor(app) {
        this.app = app;
    }

    async init(){
        //Create webserver
        var expressApp = express();
        expressApp.use(express.static('./www'));
        expressApp.listen(8080);
        http.createServer(expressApp);
    
        //Create mqtt server
        var mosca = require('mosca');
        var settings = {
            http:{
                port: 8081,
                bundle: true
            }
        };
        var mqttServer = new mosca.Server(settings);
        mqttServer.on('ready', () => this.onReady());
        mqttServer.on('error', () => this.onError());
        mqttServer.on('published', (packet, client) => this.onPublish(packet, client));
        this.app.mqttServer = mqttServer;
    }

    onReady(){
        console.log('Server is up and running on port 8080')
    }

    onError(){
        console.log('Mosca server error')
    }

    onPublish(packet, client){
        if(!client) return;
        //Parse input message
        let msg = null;
        try{
            msg = JSON.parse(packet.payload);
        } catch(e){
            console.log("Failed to parse control message", ""+packet.payload)
            msg = null;
        }
        if(msg === null) return;

        //Select command
        if(packet.topic == "/control" && "command" in msg){
            if(msg.command == "reloadAI"){
                this.app.intelligence.stopMatch();
                this.app.reloadAI(msg.parameters?msg.parameters:{});
            }
            if(msg.command == "stopMatch"){
                this.app.intelligence.stopMatch();
            }
            if(msg.command == "runMatch"){
                this.app.intelligence.runMatch();
            }
            if(msg.command == "runGoal"){
                this.app.intelligence.stopMatchTimer();
                this.app.intelligence.runGoal(msg.goal);
            }
            if(msg.command == "runAction"){
                this.app.intelligence.stopMatchTimer();
                this.app.intelligence.runAction(msg.action);
            }
            //console.log(msg)
            if(msg.command == "runModuleFunction"){
                //console.log("func ", msg.moduleName, msg.funcName)
                if(msg.moduleName in this.app.robot.modules)
                    this.app.robot.modules[msg.moduleName][msg.funcName](msg.params);
                else if(msg.moduleName=="robot") this.app.robot[msg.funcName](msg.params);
            }
        }

        if(packet.topic == "/files" && "command" in msg){
            if(msg.command == "listFiles"){
                this.sendFileList();
            }
            if(msg.command == "getFile" && msg.file){
                this.sendFileContent(msg.file);
            }
            if(msg.command == "saveFile" && msg.file && msg.content){
                this.saveFileContent(msg.file, msg.content);
            }
        }
        
    }

    async sendFileList(){
        let root = "./";
        var fileList = []
        const walkSync = (dir, filelist = []) => {
            fs.readdirSync(dir).forEach(file => {
                if(file && file.endsWith("node_modules")) return;
                if(file && file.startsWith(".")) return;
                if(file && file.startsWith("backup")) return;
                if(fs.statSync(path.join(dir, file)).isDirectory())
                    walkSync(path.join(dir, file), filelist)
                else if(file.endsWith(".js") || file.endsWith(".html") || file.endsWith(".css"))
                    filelist.push(path.join(dir, file));
          
            });
          return filelist;
        }
        walkSync(root, fileList);
        let payload = {type:"list", files: []}
        for(let file of fileList) payload.files.push({name:file})
        this.app.mqttServer.publish({topic: '/files', payload: JSON.stringify(payload), qos: 0, retain: false});
    }

    async sendFileContent(file){
        try{
        let content = await fs.promises.readFile(file);
        let payload = {type:"content", file: file, content:""+content}
        this.app.mqttServer.publish({topic: '/files', payload: JSON.stringify(payload), qos: 0, retain: false});
        }catch(e){console.log("err",e)}
    }

    async saveFileContent(file, content){
        try{
            //Save current file backup
            let currentContent = await fs.promises.readFile(file);
            if(this.app.logger) this.app.logger.log("Saving " + file)
            await fs.promises.mkdir("backups").catch((e)=>{})
            await fs.promises.writeFile("backups/"+file.replace(/\//g,"_"), currentContent);
            await fs.promises.writeFile(file, content);
        }catch(e){console.log("err",e)}
    }
}