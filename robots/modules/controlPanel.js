'use strict';
const utils = require("../../utils")


module.exports = class ControlPanel {
    constructor(app) {
        this.app = app;
        this.address = 9;
    }
    
    async init(){
        //this.send();
    }

    getDescription(){
        return {
            functions:{
                getColorStart: {},
                setScore: { score:{ legend:"score", type:"number", min:0, max:999, value:0, step:1 } }
            }
        }
    }

    async getColorStart(){
        //this.app.logger.log("get color and start");
        if(this.app.robot.modules.robotLink){
            let result = await this.app.robot.modules.robotLink.sendMessage(this.address, "get");
            if(!result) return false;
            let tab = result.split(" ");
            if(tab.length != 4) return;
            return {start: tab[3]=="1", color: tab[1]=="1"?1:0}
        }
    }

    async setScore(params){
        this.app.logger.log("score set "+params.score);
        if(this.app.robot.modules.robotLink)
            return await this.app.robot.modules.robotLink.sendMessage(this.address, "score set "+params.score);
    }

    async close(){
        
    }
}