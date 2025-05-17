'use strict';
const utils = require("../../utils")

delete require.cache[require.resolve('./robotLink')]; //Delete require() cache
const Robotlink = require('./robotLink');

module.exports = class Arm {
    constructor(app) {
        this.app = app;
        this.address = 6;
        this.positionSupported = null;
        this.position = null;
        this.lastSendTime=0;
        this.lastActuatorSendTime=0;
        this.actuators = {};
        this.link = new Robotlink(app, "Actuators2023");
    }
    
    async init(){
        await this.link.init().catch((e)=>{
            this.link.close();
            this.link = null;
        })
        if(this.link && this.link.connected){
            this.app.logger.log("Arm link OK");
        }
        else{
            this.app.logger.log("==> ERROR: Arm link not connected");
        }
        //this.send();
    }
    

    getDescription(){
        return {
            functions:{
                /*setPose6:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"first", type:"range", min:0, max:360, value:180, step:1 },
                    a2:{ legend:"second", type:"range", min:0, max:360, value:180, step:1 },
                    a3:{ legend:"third", type:"range", min:0, max:360, value:180, step:1 },
                    a4:{ legend:"fourth", type:"range", min:0, max:360, value:180, step:1 },
                    a5:{ legend:"fifth", type:"range", min:0, max:360, value:180, step:1 },
                    a6:{ legend:"sixth", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:300, step:1 }
                },
                setPose5:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"first", type:"range", min:0, max:360, value:180, step:1 },
                    a2:{ legend:"second", type:"range", min:0, max:360, value:180, step:1 },
                    a3:{ legend:"third", type:"range", min:0, max:360, value:180, step:1 },
                    a4:{ legend:"fourth", type:"range", min:0, max:360, value:180, step:1 },
                    a5:{ legend:"fifth", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:360, step:1 }
                },
                setPose4:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"first", type:"range", min:0, max:360, value:180, step:1 },
                    a2:{ legend:"second", type:"range", min:0, max:360, value:180, step:1 },
                    a3:{ legend:"third", type:"range", min:0, max:360, value:180, step:1 },
                    a4:{ legend:"fourth", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:300, step:1 }
                },
                setPose3:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"first", type:"range", min:0, max:360, value:180, step:1 },
                    a2:{ legend:"second", type:"range", min:0, max:360, value:180, step:1 },
                    a3:{ legend:"third", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:300, step:1 }
                },
                setPose2:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"first", type:"range", min:0, max:360, value:180, step:1 },
                    a2:{ legend:"second", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:300, step:1 }
                },
                setPose1:{
                    name:{ legend:"name", type:"text" },
                    a1:{ legend:"angle", type:"range", min:0, max:360, value:180, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:300, step:1 }
                },*/
                setServo: { name:{ legend:"name", type:"text" },
                            angle:{ legend:"angle", type:"range", min:0, max:360, value:180, step:1 },
                            duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setLed: {   brightness:{ legend:"brightness", type:"range", min:0, max:255, value:150, step:1 },
                            color:{ type:"range", min:0, max:255, value:0, step:1 }
                },
                getTelemeter:{ name:{ legend:"name", type:"text" } },
                getServo:{ name:{ legend:"name", type:"text" } },
                getPosition:{}
            }
        }
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 250) return;//send max every 250ms
        this.lastSendTime = now;
        let payload = {
            x: this.position.x,
            y: this.position.y,
            angle: this.position.angle
        }
        this.app.mqttServer.publish({
            topic: '/lidar/localisation',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    sendActuators(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastActuatorSendTime < 250) return;//send max every 250ms
        this.lastActuatorSendTime = now;
        let payload = {
            actuators: this.actuators
        };
        this.app.mqttServer.publish({
            topic: '/actuators',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }
    
    async setPose6(params){
        //this.app.logger.log("set pose6");
        return this.setPose(params);
    }
    
    async setPose5(params){
        //this.app.logger.log("set pose5");
        return this.setPose(params);
    }
    
    async setPose4(params){
        //this.app.logger.log("set pose4");
        return this.setPose(params);
    }
    
    async setPose3(params){
        //this.app.logger.log("set pose3");
        return this.setPose(params);
    }
    
    async setPose2(params){
        //this.app.logger.log("set pose2");
        return this.setPose(params);
    }
    
    async setPose1(params){
        //this.app.logger.log("set pose1");
        return this.setPose(params);
    }

    async setPose(params){
        this.app.logger.log("set pose", params);
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
        //console.log("Arm pose", msg)
        let result = true;
        if(this.link)
            result = await this.link.sendMessage(this.address, msg);
        if(params.wait) await utils.sleep(params.duration);
        return result;
    }

    async setEnableGroup(params){
        //this.app.logger.log("setEnableGroup", params);
        if(!("name" in params)) return "ERROR";
        let msg = "ZE "+params.name;
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
        //console.log("Arm enable", msg)
        let result = true;
        if(this.link)
            result = await this.link.sendMessage(this.address, msg);
        if(params.wait) await utils.sleep(params.duration);
        return result;
    }

    async setEnableServo(params){
        //this.app.logger.log("servo set enable");
        if(!("name" in params)) return "ERROR";
        if(!("enable" in params)) return "ERROR";
        let msg = "SE "+params.name+" "+params.enable;
        let result = true;
        if(this.link)
            result =  await this.link.sendMessage(this.address, msg);
        return result;
    }

    async setServo(params){
        //this.app.logger.log("servo set");
        let wait = true;
        if(!("duration" in params)) params.duration = 0;
        if(("wait" in params)) wait = params.wait;
        if(!("name" in params)) return "ERROR";
        let msg = "S "+params.name+" "+params.angle+" "+params.duration;
        let result = true;
        if(this.link)
            result =  await this.link.sendMessage(this.address, msg);
        if(wait) await utils.sleep(params.duration);
        return result;
    }

    async getServo(params){
        if(!("name" in params)) return "ERROR";
        let msg = "G "+params.name;
        let result = true;
        if(this.link){
            let response =  await this.link.sendMessage(this.address, msg);
            this.app.logger.log("getServo", params.name, response);
            if(!response) return false;
            let resArray = response.split(" ");
            if(resArray.length != 4) return false;
            let resName = resArray[1];
            if(resName != params.name) return false;
            let resPosition = resArray[2];
            let resLoad = resArray[3];
            return {name: resName, position: resPosition, load: resLoad};
        }
        return result;
    }

    async getTelemeter(params){
        //this.app.logger.log("servo get");
        if(!("name" in params)) return "ERROR";
        let msg = "T "+params.name;
        let result = {name: '', measures: []};
        if(this.link){
            let response =  await this.link.sendMessage(this.address, msg);
            if(!response) return false;
            let arr = response.split(" ");
            if(arr.length<2) return false;
            if(arr[1] != params.name) return false;
            result.name = arr[1]
            for(let i=2;i<arr.length;i++){
                result.measures.push(parseFloat(arr[i]))
            }
        }
        return result;
    }
    
    async telemeterTo2D(telem, width, rotationCount){
        let array2D = []
        let currArray = []
        let i = 0;
        for(let dist of telem.measures){
            currArray.push(dist);
            if(i%width == width-1) {
                array2D.push(currArray)
                currArray = []
            }
            i++;   
        }
        
        for(i=0; i<rotationCount;i++){
            array2D = array2D[0].map((x,i) => array2D.map(row => row[i]).reverse());
        }
        
        return array2D;
    }
    
    async waitServo(params){
        //this.app.logger.log("servo get");
        if(!("name" in params)) return "ERROR";
        if(!("position" in params)) return "ERROR";
        let timeout = params.timeout || 2500;//ms
        while(timeout>0){
            let current = await this.getServo({name:params.name});
            //console.log(params.name, params.position, current)
            if(current && current.position != undefined){
                let precision = params.precision || 10;
                if(Math.abs(current.position - params.position) < precision) return true;
            }
            await utils.sleep(25);
            timeout -= 25;
        }
        return false;
    }

    async setLed(params){
        //this.app.logger.log("set led");
        const ledCount = 24;
        let colors = [];
        if(!("brightness" in params)) params.brightness = 255;
        if("colors" in params && Array.isArray(params.colors)){
            for(let i=0;i<ledCount && i<params.colors.length;i++){
                colors.push(params.colors[i]);
            }
        }
        if("color" in params){
            for(let i=0;i<ledCount;i++)
                colors.push(params.color);
        }
        let msg = "p "+params.brightness;
        for(let i=0;i<colors.length;i++){
            msg += " "+colors[i];
        }
        let result = true;
        if(this.link)
            result =  await this.link.sendMessage(this.address, msg);
        return result;
    }

    async supportPosition(){
        let result = false;
        if(this.positionSupported !== null) return this.positionSupported;
        if(this.link){
            let support = await this.link.sendMessage(this.address, "support pos");
            console.log("support", support)
            if(support && support.includes("1")) result = true;
            this.positionSupported = result;
        }
        return result;
    }

    async setPosition(params){
        let msg = "Y "+Math.round(params.x)+" "+Math.round(params.y)+" "+Math.round(params.angle*100);
        this.position = {x: params.x, y: params.y, angle: params.angle};
        this.send(true);
        if(this.link)
            return await this.link.sendMessage(this.address, msg);
    }
    
    async getPosition(){
        if(this.link){
            let response = await this.link.sendMessage(this.address, "X");
            //console.log("getPosition", response)
            if(!response) return false;
            let posArray = response.split(" ");
            if(posArray.length == 4 && posArray[0]=="X"){
                let newPosition = {x: parseInt(posArray[1]), y: parseInt(posArray[2]), angle: parseInt(posArray[3])/100, isNew: true};
                if(this.position && this.position.x == newPosition.x && this.position.y == newPosition.y){
                    newPosition.isNew = false;
                }
                this.position = newPosition;
                this.send();
                return this.position;
            }
            return response;
        }
    }
    
    async getActuators(){
        if(this.link){
            let response = await this.link.sendMessage(this.address, "groups");
            if(!response) return false;
            let groupArray = response.split(" ");
            if(groupArray.length > 1 && groupArray[0]=="groups"){
                this.actuators = {};
                for(let i=1;i<groupArray.length;i++){
                    let actuatorArray = groupArray[i].split(":");
                    if(actuatorArray.length < 2) continue;
                    let groupName = actuatorArray[0];
                    this.actuators[groupName] = {};
                    for(let j=1;j<actuatorArray.length;j++){
                        let valueArray = actuatorArray[j].split("=");
                        if(valueArray.length != 2) continue;
                        let actuatorName = valueArray[0];
                        let actuatorValue = parseInt(valueArray[1]);
                        this.actuators[groupName][actuatorName] = actuatorValue;
                    }
                }
                this.sendActuators();
                return this.actuators;
            }
            return false;
        }
    }

    async close(){
        if(this.link) await this.link.close()
    }
}