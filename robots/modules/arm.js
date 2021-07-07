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
                setPose:{
                    a1:{ legend:"height", type:"range", min:0, max:180, value:90, step:1 },
                    a2:{ legend:"rotation", type:"range", min:0, max:180, value:90, step:1 },
                    a3:{ legend:"shoulder", type:"range", min:0, max:180, value:90, step:1 },
                    a4:{ legend:"elbow", type:"range", min:0, max:180, value:90, step:1 },
                    a5:{ legend:"wrist", type:"range", min:0, max:180, value:90, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                enablePump:  {  name:{ legend:"name", type:"text" } },
                disablePump: {  name:{ legend:"name", type:"text" } },
                setPump: {  name:{ legend:"name", type:"text" },
                            value:{ legend:"value", type:"range", min:0, max:1, value:0, step:1 }
                },
                setServo: { name:{ legend:"name", type:"text" },
                            angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 },
                            duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setFlag:{ angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 } }
            }
        }
    }

    async setPose(params){
        this.app.logger.log("set pose");
        let msg = "Z "+parseInt(""+params.a1)+" "+parseInt(""+params.a2)+" "+parseInt(""+params.a3)+" "+parseInt(""+params.a4)+" "+parseInt(""+params.a5)+" "+parseInt(""+params.duration);
        console.log("Arm pose", msg)
        let result = true;
        if(this.app.robot.modules.robotLink)
            result = await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
        await utils.sleep(params.duration);
        return result;
    }

    async setPump(params){
        this.app.logger.log("pump set");
        if(!("value" in params)) return "ERROR";
        if(!("name" in params)) return "ERROR";
        let msg = "pump set "+params.name+" "+params.value;
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
        if(!("duration" in params)) params.duration = 0;
        if(!("name" in params)) return "ERROR";
        let msg = "servo set "+params.name+" "+params.angle+" "+params.duration;
        let result = true;
        if(this.app.robot.modules.robotLink)
            result =  await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
        await utils.sleep(params.duration);
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