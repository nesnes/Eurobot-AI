'use strict';
const utils = require("../../utils")
const spawn = require('child_process').spawn


module.exports = class ControlPanel {
    constructor(app) {
        this.app = app;
        this.worker = null;
        this.address = 9;
        this.color = 0;
        this.start = 0;
        this.pendingColorStart = null;
        this.score = 0;
    }
    
    async init(){
        var w = spawn("node",["./robots/modules/controlPanelWorker.js"], {detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
        process.on("exit",()=>{w.kill();})
        this.worker = w;
        this.worker.on("message",msg=>{ this.onWorkerMessage(msg); })
        this.worker.on("error",(e)=>{console.log("controlPanelWorker error", e)});
        setTimeout(()=>{this.setColors();}, 1000);
        //this.send();
    }

    async close(){
        console.log("close control panel");
        if(this.worker) this.worker.kill();
        this.worker = null;
    }

    getDescription(){
        return {
            functions:{
                getColorStart: {},
                setScore: { score:{ legend:"score", type:"number", min:0, max:999, value:0, step:1 } }
            }
        }
    }
    
    onWorkerMessage(msg){
        try{
            if(msg.type=="colorStart"){
                this.color = msg.color;
                this.start = msg.start;
                if(this.pendingColorStart) this.pendingColorStart();
            }
        }catch(e){console.log(e)}
    }
    
    async setColors() {
        if(this.worker && this.app.map && this.app.map.teams) 
            this.worker.send({action:"setColors", colors:this.app.map.teams});
    }

    async getColorStart(){
        if(this.worker) this.worker.send({action:"getColorStart"});
        await new Promise(resolve=>{
            this.pendingColorStart = resolve;
            setTimeout(resolve, 250);
        })
        this.pendingColorStart = null;
        return {color:this.color, start:this.start};
    }

    async setScore(params){
        this.app.logger.log("score set "+params.score);
        if(this.worker) this.worker.send({action:"setScore", score:params.score});
    }
}
