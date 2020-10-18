'use strict';
const express = require('express');
const http = require('http');

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
        console.log('Mosca server is up and running')
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
        
    }
}