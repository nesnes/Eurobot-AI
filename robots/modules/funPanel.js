'use strict';
const utils = require("../../utils")
var ws281x = require('rpi-ws281x');


module.exports = class FunPanel {
    constructor(app) {
        this.app = app;
        this.worker = null;
        this.address = 9;
        this.pixelInterval = null;
        this.config = {leds:12};
        this.pixels = new Uint32Array(this.config.leds);
    }
    
    async init(){
        try{ ws281x.configure(this.config); }catch(e){}
        this.pixelInterval = setInterval(()=>{ws281x.render(this.pixels);}, 100);
    }

    async close(){
         try{ ws281x.reset(); }catch(e){}
        if(this.pixelInterval) clearInterval(this.pixelInterval);
        this.pixelInterval = null;
        console.log("close fun panel");
        this.worker = null;
    }

    getDescription(){
        return {
            functions:{
                setPattern: { name:{ legend:"name", type:"text" } },
                setColor: { 
                    r:{ legend:"r", type:"range", min:0, max:255, step:1 },
                    g:{ legend:"g", type:"range", min:0, max:255, step:1 },
                    b:{ legend:"b", type:"range", min:0, max:255, step:1 }
                }
            }
        }
    }
    
    onWorkerMessage(msg){
        /*try{
            if(msg.type=="colorStart"){
                this.color = msg.color;
                this.start = msg.start;
                if(this.pendingColorStart) this.pendingColorStart();
            }
        }catch(e){console.log(e)}*/
    }
    
    async setColor(params){
        if(this.worker) this.worker.send({action:"setColor", color:[params.r, params.g, params.b]});
    }
    
    async setPattern(params){
        this.app.logger.log("pattern set "+params.name);
        if(this.worker) this.worker.send({action:"setPattern", name:params.name});
    }
}
