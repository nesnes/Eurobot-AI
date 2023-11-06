'use strict';
const utils = require("../../utils")
const spawn = require('child_process').spawn

module.exports = class Camera {
    constructor(app) {
        this.app = app;
        this.worker = null;
        this.arucos = [];
        this.detections = [];
        this.orientation = null;
        this.pendingArucos = null;
        this.pendingDetection = null;
        this.pendingOrientation = null;
    }
    
    async init(){
        console.log("init")
        var w = spawn("node",["./robots/modules/cameraWorker2.js"], {detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
        process.on("exit",()=>{w.kill();})
        this.worker = w;
        this.worker.on("message",msg=>{ this.onWorkerMessage(msg); })
        this.worker.on("error",(e)=>{console.log("cameraWorker error", e)});
        this.send();
    }

    getDescription(){
        return {
            functions:{
                detectArucos: {},
                setPreviewFPS: {fps:{ type:"range", min:0, max:1, value:0, step:1 }},
               // detectBuoys: {},
               // detectWeathervane: {},
            }
        }
    }

    async close(){
        console.log("close cam");
        if(this.worker) this.worker.kill();
        this.worker = null;
    }

    async detectArucos(){
        this.arucos = [];
        if(this.worker) this.worker.send({action:"detectArucos"});
        await new Promise(resolve=>{
            this.pendingArucos = resolve;
            setTimeout(resolve, 2000)
        })
        this.pendingArucos = null;
        console.log(this.arucos)
        if(this.arucos.length>0) console.log(this.arucos[0].corners)
        return this.arucos
    }

    async setPreviewFPS(parameters){
        if(this.worker) this.worker.send({action:"previewFPS", fps: parameters.fps|0});
        return true
    }

    onWorkerMessage(msg){
        try{
            if(msg.type=="arucos"){
                this.arucos = msg.arucos;
                if(this.pendingArucos) this.pendingArucos();
            }
            if(msg.type=="image") this.sendImage(msg);
        }catch(e){console.log(e)}
    }

    async sendImage(obj){
        this.app.mqttServer.publish({
            topic: '/images',
            payload: JSON.stringify(obj),
            qos: 0, retain: false
        });
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 100) return;//send max every 100ms
        this.lastSendTime = now;
        /*let payload = {
            measures: this.measures
        }
        //console.log(this.measures)
        this.app.mqttServer.publish({
            topic: '/lidar',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });*/
    }
}