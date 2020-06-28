'use strict';
const utils = require("../../utils")


module.exports = class Base {
    constructor(app) {
        this.app = app;
        this.address = 7;
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
                    x:{ legend:"x (m)", type:"number", min:0, max:3000, value:1500 },
                    y:{ legend:"y (m)", type:"number", min:0, max:2000, value:1000 },
                    angle:{ legend:"angle (°)", type:"number", min:-180, max:180, value:0 }
                },
                getPosition: {},
                moveXY:{
                    x:{ legend:"x (m)", type:"number", min:0, max:3000, value:1500 },
                    y:{ legend:"y (m)", type:"number", min:0, max:2000, value:1000 },
                    angle:{ legend:"angle (°)", type:"number", min:-180, max:180, value:0 },
                    speed:{ legend:"speed (m/s)", type:"range", min: 0, max: 1.5, value:0.5, step:0.1 }
                },
                getMoveStatus: {},
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
        let msg = "pos set "+params.x+" "+params.y+" "+params.angle;
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async getPosition(){
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "pos getXY");
    }

    async moveXY(params){
        let msg = "move XY "+params.x+" "+params.y+" "+params.angle+" "+(parseFloat(""+params.speed)*10);
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
        let msg = "move RM "+params.distance+" "+(parseFloat(""+params.speed)*10);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }

    async supportXY(){
        if(this.app.robot.modules.robotLink){
            var support = await this.app.robot.modules.robotLink.sendMessage(this.address, "support XY");
            if(support.includes("1")) return true;
        }
        return false;
    }

    async supportPath(){
        if(this.app.robot.modules.robotLink){
            var support = await this.app.robot.modules.robotLink.sendMessage(this.address, "support Path");
            if(support.includes("1")) return true;
        }
        return false;
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
        let msg = "manual set "+params.moveAngle+" "+(parseFloat(""+params.moveSpeed)*10)+" "+params.angleSpeed;
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, msg);
    }


    async close(){
        await this.break()
    }
}