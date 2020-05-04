'use strict';
const utils = require("../utils")

module.exports = class Robot {
    constructor(app) {
        this.app = app;
        this.name = "";
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.variables = {};
        this.color = "";
        this.radius = 0;
    }
    
    init(){
        this.send();
    }

    send(){
        let payload = {
            name: this.name,
            x: this.x,
            y: this.y,
            angle: this.angle,
            variables: this.variables,
            color: this.color,
            radius: this.radius
        }
        this.app.mqttServer.publish({
            topic: '/robot',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    async run(action) {
        this.app.logger.log(" ->" + action.name);
        if(action.method in this)
            return await this[action.method](action.parameters)
        else{
            this.app.logger.log("  -> No method found");
            return false;
        }
    }

    async moveToComponent(parameters){

        let component = null;
        for(const item of this.app.map.components){
            if(item.type == parameters.component){
                component = item;
                break;
            }
        }
        if(component === null){
            this.app.logger.log("  -> Component not found "+parameters.component);
            return false
        }
        this.app.logger.log("  -> moving to "+component.name);
        this.x = Math.floor(Math.random() * 3000);
        this.y = Math.floor(Math.random() * 2000);
        this.angle = Math.floor(Math.random() * 360);
        this.send();
        await utils.sleep(500);
        return true
    }
}
