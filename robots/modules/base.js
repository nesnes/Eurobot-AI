'use strict';
const utils = require("../../utils")

delete require.cache[require.resolve('./robotLink')]; //Delete require() cache
const Robotlink = require('./robotLink');

module.exports = class Base {
    constructor(app) {
        this.app = app;
        this.address = 7;
        this.xySupported = null;
        this.pathSupported = null;
        this.link = new Robotlink(app, "MovingBaseTDS");
    }
    
    async init(){
        await this.link.init().catch((e)=>{
            this.link.close();
            this.link = null;
        })
        if(this.link && this.link.connected){
            this.app.logger.log("Base link OK");
        }
        else{
            this.app.logger.log("==> ERROR: Base link not connected");
        }
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
                    x:{ legend:"x (mm)", type:"number", min:0, max:3000, value:1500 },
                    y:{ legend:"y (mm)", type:"number", min:0, max:2000, value:1000 },
                    angle:{ legend:"angle (°)", type:"number", min:-180, max:180, value:0 },
                    speed:{ legend:"speed (m/s)", type:"range", min: 0, max: 2.5, value:0.5, step:0.1 },
                    nearDist:{ legend:"near distance (mm)", type:"number", min: 0, max: 1000, value:0 },
                    nearAngle:{ legend:"near angle (°)", type:"number", min:0, max:180, value:0 }
                },
                getSpeed: {},
                setSpeedLimit:{
                    speed:{ legend:"speed (m/s)", type:"range", min: 0, max: 2.5, value:0.3, step:0.1 }
                },
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
        if(this.link)
            return await this.link.sendMessage(this.address, "move enable");
    }

    async disableMove(){
        if(this.link)
            return await this.link.sendMessage(this.address, "move disable");
    }

    async setPosition(params){
        let resetTarget = 1;
        if("resetTarget" in params && !params.resetTarget) resetTarget = 0;
        let msg = "pos set "+Math.round(params.x)+" "+Math.round(params.y)+" "+Math.round(params.angle)+" "+resetTarget;
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }

    async setSpeedLimit(params){
        if(!("speed" in params)) return false;
        let msg = "speed limit "+Math.round(parseFloat(""+params.speed)*10);
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }

    async getStatus(){
        if(this.link){
            let response = await this.link.sendMessage(this.address, "status get");
            if(!response) return false;
            let posArray = response.split(" ");
            if(posArray.length == 6 && ["run","near","end"].includes(posArray[0])){
                return {status: posArray[0], x: parseInt(posArray[1]), y: parseInt(posArray[2]), angle: parseInt(posArray[3]), speed: parseInt(posArray[4])/10, pathIndex: parseInt(posArray[5])}
            }
            return response;
        }
    }

    async moveXY(params){
        let nearDist = params.nearDist||0;//mm
        let nearAngle = params.nearAngle||0;//°
        let msg = "move XY "
            +Math.round(params.x)
            +" "+Math.round(params.y)
            +" "+Math.round(params.angle)
            +" "+Math.round(parseFloat(""+params.speed)*10)
            +" "+Math.round(nearDist)
            +" "+Math.round(nearAngle);
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }

    async getMoveStatus(){
        if(this.link)
            return await this.link.sendMessage(this.address, "move status");
    }

    async getSpeed(){
        if(this.link)
            return await this.link.sendMessage(this.address, "speed get");
    }

    async break(){
        if(this.linkk)
            return await this.link.sendMessage(this.address, "move break");
    }

    async touchBorder(params){
        let msg = "move RM "+Math.round(params.distance)+" "+Math.round(parseFloat(""+params.speed)*10);
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }

    async supportXY(){
        if(this.xySupported !== null) return this.xySupported;
        if(this.link){
            var support = await this.link.sendMessage(this.address, "support XY");
            if(support.includes("1")) result = true;
            this.xySupported = result;
        }
        return result;
    }

    async supportPath(){
        return false;
        let result = false;
        if(this.pathSupported !== null) return this.pathSupported;
        if(this.link){
            var support = await this.link.sendMessage(this.address, "support Path");
            if(support.includes("1")) result = true;
            this.pathSupported = result;
        }
        return result;
    }

    async movePath(params){ //{path:[{x:0,y:0,angle:0,speed:0,nearDist:0,nearAngle:0}]}
        if(!params.path) return false;
        let result = true;
        for(let i=0;result && i<params.path.length;i++){
            let point = params.path[i];
            let action = i==0?0:1;
            if(i==params.path.length-1) action=2;
            if(i==0 && action==2) action=3;
            let msg = "path set "+action
            +" "+Math.round(point.x)
            +" "+Math.round(point.y)
            +" "+Math.round(point.angle)
            +" "+Math.round(parseFloat(""+point.speed)*10)
            //+" "+Math.round(point.nearDist||0)
            //+" "+Math.round(point.nearAngle||0); // need to be implemented in base firmware for paths
            if(this.link){
                result = await this.link.sendMessage(this.address, msg);
                console.log(msg, result)
            }
        }
        return result;
    }

    async enableManual(){
        if(this.link)
            return await this.link.sendMessage(this.address, "manual enable");
    }

    async disableManual(){
        if(this.link)
            return await this.link.sendMessage(this.address, "manual disable");
    }

    async moveManual(params){
        let msg = "manual set "+Math.floor(params.moveAngle)+" "+Math.floor(parseFloat(""+params.moveSpeed)*10)+" "+Math.floor(params.angleSpeed);
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }


    async close(){
        await this.break()
        if(this.link) await this.link.close()
    }
}