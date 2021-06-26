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
                enablePump: {},
                disablePump: {},
                setPose:{
                    a1:{ legend:"height", type:"range", min:0, max:180, value:90, step:1 },
                    a2:{ legend:"rotation", type:"range", min:0, max:180, value:90, step:1 },
                    a3:{ legend:"shoulder", type:"range", min:0, max:180, value:90, step:1 },
                    a4:{ legend:"elbow", type:"range", min:0, max:180, value:90, step:1 },
                    a5:{ legend:"wrist", type:"range", min:0, max:180, value:90, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setServo: { name:{ legend:"name", type:"text" },
                            angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 },
                            duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setFlag:{ angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 } }
            }
        }
    }

    async enablePump(){
        this.app.logger.log("enabling pump");
        let result = true;
        if(this.app.robot.modules.robotLink)
            result = await this.app.robot.modules.robotLink.sendMessage(this.address, "pump on");
        await utils.sleep(200);
        return result;
    }

    async disablePump(){
        this.app.logger.log("disabling pump");
        let result = true;
        if(this.app.robot.modules.robotLink)
            result = await this.app.robot.modules.robotLink.sendMessage(this.address, "pump off");
        await utils.sleep(200);
        return result;
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

    async setServo(params){
        this.app.logger.log("set servo");
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
    async openFlag(params){ return await this.setFlag({angle:5}); }
    async closeFlag(params){ return await this.setFlag({angle:25}); }

    async close(){
        
    }
}