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
                setLeft: { angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 } },
                setRight:{ angle:{ legend:"angle", type:"range", min:0, max:180, value:90, step:1 } }
            }
        }
    }

    async enablePump(){
        this.app.logger.log("enabling pump");
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "pump on");
    }

    async disablePump(){
        this.app.logger.log("disabling pump");
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "pump off");
    }

    async setPose(params){
        this.app.logger.log("set pose");
        let msg = "Z "+params.a1+" "+params.a2+" "+params.a3+" "+params.a4+" "+params.a5+" "+params.duration;
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async setLeft(params){
        this.app.logger.log("set left");
        let msg = "setLeft "+params.angle;
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async setRight(params){
        this.app.logger.log("set right");
        let msg = "setRight "+params.angle;
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async close(){
        
    }
}