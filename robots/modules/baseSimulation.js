'use strict';
const utils = require("../../utils")


module.exports = class Base {
    constructor(app) {
        this.app = app;
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.movementAngle = 0;
        this.lastPositionUpdateTime = 0;
        this.moveEnabled = false;
        this.moveStatus = "end"
        this.speed = 0.2;
        this.angleSpeed = 0.2;
        this.moveBreak = false;
        this.speedLimit = 0;
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
        this.moveEnabled = true;
        return true;
    }

    async disableMove(){
        this.moveEnabled = false;
        return true;
    }

    async setPosition(params){
        this.x = Math.round(params.x)
        this.y = Math.round(params.y)
        this.angle = Math.round(params.angle);
        return true;
    }
    

    async setSpeedLimit(params){
        if(!("speed" in params)) return false;
        this.speedLimit = Math.abs(params.speed);
    }

    async getStatus(){
        return {status: this.moveStatus, x: parseInt(""+this.x), y: parseInt(""+this.y), angle: parseInt(""+this.angle), speed: parseInt(""+this.speed)}
    }

    async moveXY(params){
        this.moveStatus = "run";
        let move = async (params) => {
            let startX = this.x;
            let startY = this.y;
            let startAngle = this.angle;
            let dx = startX-params.x;
            let dy = startY-params.y;
            let dangle = startAngle-params.angle;
            let distance = Math.sqrt(dx*dx + dy*dy);
            let moveSpeed = params.speed;
            let sleep = 100;
            let distanceDone = 0;
            while(distanceDone<distance){
                if(this.app.intelligence.hasBeenRun && this.app.intelligence.isMatchFinished()) return false;
                moveSpeed = params.speed;
                if(this.speedLimit>0.01){
                    if(params.speed>0) moveSpeed = Math.min(this.speedLimit, params.speed);
                    else moveSpeed = Math.max(this.speedLimit, params.speed);
                }
                distanceDone += (sleep/1000)*moveSpeed*1000
                let ratio = distanceDone/distance;
                if(ratio>1) ratio = 1;
                let x = startX-(dx*ratio);
                let y = startY-(dy*ratio);
                if(this.moveBreak)
                    return false;
                let angle = startAngle-(dangle*ratio);
                this._updatePosition(x,y,angle);
                await utils.sleep(sleep);
            }
            this._updatePosition(params.x,params.y,params.angle, true);
        };
        move(params).then(()=>{this.moveStatus="end";}); // async
        return true;
    }

    async break(){
        this.moveBreak = true;
    }

    async touchBorder(params){
        return true;
    }

    async supportXY(){
        return true;
    }

    async supportPath(){
        return false;
    }

    async enableManual(){
        return true;
    }

    async disableManual(){
        return true;
    }

    async moveManual(params){
        return true;
    }


    async close(){
        await this.break()
    }

    _updatePosition(x,y,angle,reset=false){
        let now = new Date().getTime();
        if(this.lastPositionUpdateTime!=0 && !reset){
            let dt = now - this.lastPositionUpdateTime;
            let dx = this.x-x;
            let dy = this.y-y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            this.speed = (distance/1000) / (dt/1000); // m/s
            let da = (this.angle+360) - (angle+360);
            this.angleSpeed = da / (dt/1000); // deg/s
            if(dx!=0 || dy!=0)
                this._updateMovementAngle(x,y);
        }
        else{
            this.speed = 0;
            this.angleSpeed = 0;
        }
        this.x = x;
        this.y = y;
        this.angle =  utils.normAngle(angle);
        this.lastPositionUpdateTime = now;
    }

    _updateMovementAngle(x,y){
        let dx = this.x-x;
        let dy = this.y-y;
        this.movementAngle =  utils.normAngle(Math.atan2(dy,dx)*(180/Math.PI)+180);
    }
}