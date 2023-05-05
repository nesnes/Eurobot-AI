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
        this.pendingStart = null;
        this.score = 0;
    }
    
    async init(){
        var w = spawn("node",["./robots/modules/controlPanelWorker.js"], {detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
        process.on("exit",()=>{w.kill();})
        this.worker = w;
        this.worker.on("message",msg=>{ this.onWorkerMessage(msg); })
        this.worker.on("error",(e)=>{console.log("controlPanelWorker process reported an error. Could happen if simulation a robot, not blocking.", e)});
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
            if(msg.type=="start"){
                this.start = msg.start;
                if(this.pendingStart) this.pendingStart();
            }
        }catch(e){console.log(e)}
    }
    

    async getStart(){
        if(this.worker) this.worker.send({action:"getStart"});
        await new Promise(resolve=>{
            this.pendingStart = resolve;
            setTimeout(resolve, 250);
        })
        this.pendingStart = null;
        return {start:this.start};
    }

    async setScore(params){
        /*this.app.logger.log("score set "+params.score);
        if(this.worker) this.worker.send({action:"setScore", score:params.score});*/
    }
}
