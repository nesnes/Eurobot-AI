'use strict';
const utils = require("../../utils")


module.exports = class Base {
    constructor(app) {
        this.app = app;
        this.address = 7;
        this.xySupported = null;
        this.pathSupported = null;
    }
    
    async init(){
        //this.send();
    }

    getDescription(){
        return {
            functions:{
                enableMove: {},
                disableMove: {},
                setPosition:{
                    x:{ legend:"x (m)", type:"number", min:0, max:3000, value:1000 },
                    y:{ legend:"y (m)", type:"number", min:0, max:2000, value:1000 },
                    angle:{ legend:"angle (°)", type:"number", min:-180, max:180, value:0 }
                },
                getStatus: {},
                moveXY:{
                    x:{ legend:"x (m)", type:"number", min:0, max:3000, value:1500 },
                    y:{ legend:"y (m)", type:"number", min:0, max:2000, value:1000 },
                    angle:{ legend:"angle (°)", type:"number", min:-180, max:180, value:0 },
                    speed:{ legend:"speed (m/s)", type:"range", min: 0, max: 1.5, value:0.5, step:0.1 }
                },
                getSpeed: {},
                break: {},
                touchBorder:{
                    distance:{ legend:"distance (m)", type:"number", min:-1000, max:1000, value:150 },
                    speed:{ legend:"speed (m/s)", type:"range", min: -1.5, max: 1.5, value:0.5, step:0.1 }
                },
                enableManual: {},
                disableManual: {},
                moveManual:{
                    moveAngle:{ legend:"moveAngle (°)", type:"range", min:-180, max:180, value:0, step:1 },
                    moveSpeed:{ legend:"moveSpeed (m/s)", type:"range", min: -1.5, max: 1.5, value:0.5, step:0.1 },
                    angleSpeed:{ legend:"angleSpeed (°/s)", type:"range", min: -360, max: 360, value:0, step:1 }
                },
            }
        }
    }

    async enableMove(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "move enable");
    }

    async disableMove(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "move disable");
    }

    async setPosition(params){
        let msg = "pos set "+Math.round(params.x)+" "+Math.round(params.y)+" "+Math.round(params.angle);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async getStatus(){
        if(this.app.robot.modules.robotLink){
            let response = await this.app.robot.modules.robotLink.sendMessage(this.address, "status get");
            if(!response) return false;
            let posArray = response.split(" ");
            if(posArray.length == 5 && ["run","end"].includes(posArray[0])){
                return {status: posArray[0], x: parseInt(posArray[1]), y: parseInt(posArray[2]), angle: parseInt(posArray[3]), speed: parseInt(posArray[4])/10}
            }
            console.log(response);
            return response;
        }
    }

    async moveXY(params){
        let msg = "move XY "+Math.round(params.x)+" "+Math.round(params.y)+" "+Math.round(params.angle)+" "+Math.round(parseFloat(""+params.speed)*10);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async getMoveStatus(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "move status");
    }

    async getSpeed(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "speed get");
    }

    async break(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "move break");
    }

    async touchBorder(params){
        let msg = "move RM "+Math.round(params.distance)+" "+Math.round(parseFloat(""+params.speed)*10);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async supportXY(){
        let result = false;
        if(this.xySupported !== null) return this.xySupported;
        if(this.app.robot.modules.robotLink){
            var support = await this.app.robot.modules.robotLink.sendMessage(this.address, "support XY");
            if(support.includes("1")) result = true;
            this.xySupported = result;
        }
        return result;
    }

    async supportPath(){
        let result = false;
        if(this.pathSupported !== null) return this.pathSupported;
        if(this.app.robot.modules.robotLink){
            var support = await this.app.robot.modules.robotLink.sendMessage(this.address, "support Path");
            if(support.includes("1")) result = true;
            this.pathSupported = result;
        }
        return result;
    }

    async movePath(params){ //{path:[{x:0,y:0,angle:0,speed:0}]}
        if(!params.path) return false;
        let result = true;
        for(let i=0;result && i<params.path.length;i++){
            let point = params.path[i];
            let action = i==0?0:1;
            if(i==params.path.length-1) action=2;
            let msg = "path set "+action+" "+Math.round(point.x)+" "+Math.round(point.y)+" "+Math.round(point.angle)+" "+Math.round(parseFloat(""+point.speed)*10);
            console.log(msg)
            if(this.app.robot.modules.robotLink)
                result = await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
            console.log(msg,result)
        }
        return result;
    }

    async enableManual(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "manual enable");
    }

    async disableManual(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "manual disable");
    }

    async moveManual(params){
        let msg = "manual set "+Math.floor(params.moveAngle)+" "+Math.floor(parseFloat(""+params.moveSpeed)*10)+" "+Math.floor(params.angleSpeed);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }


    async close(){
        await this.break()
    }
}