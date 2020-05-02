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

        //Select action
        if(packet.topic == "/control"){
            if("action" in msg && msg.action == "run"){
                if("intelligence" in this.app) this.app.intelligence.start();
            }
        }
        
    }
}