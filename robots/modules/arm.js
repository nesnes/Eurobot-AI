'use strict';
const utils = require("../../utils")


module.exports = class Arm {
    constructor(app) {
        this.app = app;
        this.address = 6;
    }
    
    async init(){
        //this.send();
    }

    getDescription(){
        return {
            functions:{
                openFlag: {},
                closeFlag: {},
                setPose3:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"shoulder", type:"range", min:0, max:180, value:90, step:1 },
                    a2:{ legend:"elbow", type:"range", min:0, max:180, value:90, step:1 },
                    a3:{ legend:"wrist", type:"range", min:0, max:180, value:90, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                enablePump:  {  name:{ legend:"name", type:"text" } },
                disablePump: {  name:{ legend:"name", type:"text" } },
                setPump: {  name:{ legend:"name", type:"text" },
                            value:{ legend:"value", type:"range", min:0, max:255, value:0, step:1 }
                },
                setMotor: {  name:{ legend:"name", type:"text" },
                            value:{ legend:"value", type:"range", min:0, max:255, value:0, step:1 }
                },
                setServo: { name:{ legend:"name", type:"text" },
                            angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 },
                            duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setFlag:{ angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 } }
            }
        }
    }
    
    async setPose3(params){
        this.app.logger.log("set pose3");
        return this.setPose(params);
    }

    async setPose(params){
        this.app.logger.log("set pose");
        if(!("name" in params)) return "ERROR";
        if(!("duration" in params)) params.duration = 0;
        if(!("wait" in params)) params.wait = true;
        let msg = "Z "+params.name+" "+parseInt(""+params.duration);
        if("a1" in params) msg += " "+parseInt(""+params.a1);
        if("a2" in params) msg += " "+parseInt(""+params.a2);
        if("a3" in params) msg += " "+parseInt(""+params.a3);
        if("a4" in params) msg += " "+parseInt(""+params.a4);
        if("a5" in params) msg += " "+parseInt(""+params.a5);
        if("a6" in params) msg += " "+parseInt(""+params.a6);
        if("a7" in params) msg += " "+parseInt(""+params.a7);
        if("a8" in params) msg += " "+parseInt(""+params.a8);
        if("a9" in params) msg += " "+parseInt(""+params.a9);
        if("a10" in params) msg += " "+parseInt(""+params.a10);
        console.log("Arm pose", msg)
        let result = true;
        if(this.app.robot.modules.robotLink)
            result = await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
        if(params.wait) await utils.sleep(params.duration);
        return result;
    }
    
    async setPump(params){
        this.setMotor(params);
    }

    async setMotor(params){
        this.app.logger.log("pump set");
        if(!("duration" in params)) params.duration = 0;
        if(!("value" in params)) return "ERROR";
        if(!("name" in params)) return "ERROR";
        let msg = "S "+params.name+" "+params.value+" "+params.duration;
        let result = true;
        if(this.app.robot.modules.robotLink)
            result =  await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
        await utils.sleep(10);
        return result;
    }

    async enablePump(params){
        params.value = 1;
        return await this.setPump(params);
    }

    async disablePump(params){
        params.value = 0;
        return await this.setPump(params);
    }

    async setServo(params){
        this.app.logger.log("servo set");
        let wait = true;
        if(!("duration" in params)) params.duration = 0;
        if(("wait" in params)) wait = params.wait;
        if(!("name" in params)) return "ERROR";
        let msg = "S "+params.name+" "+params.angle+" "+params.duration;
        let result = true;
        if(this.app.robot.modules.robotLink)
            result =  await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
        if(wait) await utils.sleep(params.duration);
        return result;
    }

    async setFlag(params){
        this.app.logger.log("set flag");
        params.name = "FLA";
        params.duration = 0;
        return await this.setServo(params);
    }
    async openFlag(params){ return await this.setFlag({angle:146}); }
    async closeFlag(params){ return await this.setFlag({angle:25}); }

    async close(){
        
    }
}