'use strict';
const utils = require("./utils")

module.exports = class Intelligence {
    constructor(app) {
        this.app = app;
        this.startTime = 0;
        this.currentTime = 0;
        this.matchDuration = 100*1000; // 100 second
        this.stopExecution = false;
    }

    async init(){
        //Load the map
        delete require.cache[require.resolve('./maps/map_2020')]; //Delete require() cache
        const Map = require('./maps/map_2020');
        this.app.map = new Map(this.app);
        this.app.map.init();
        this.app.logger.log("Map loaded");

        //Read the goals
        delete require.cache[require.resolve('./goals/goals_2020')]; //Delete require() cache
        const Goals = require('./goals/goals_2020');
        this.app.goals = new Goals(this.app);
        this.app.goals.init();
        this.app.logger.log("Goals loaded");

        //Create robot
        delete require.cache[require.resolve('./robots/robot_2020')]; //Delete require() cache
        const Robot = require('./robots/robot_2020');
        this.app.robot = new Robot(this.app);
        await this.app.robot.init();
        this.app.logger.log("Robot loaded");

        this.send();
        this.updateInterval = setInterval(()=>this.updateMatchTime(),100);
    }

    send(){
        let payload = {
            currentTime: this.currentTime/1000,
        }
        this.app.mqttServer.publish({
            topic: '/intelligence',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    async close(){
        if(this.updateInterval) clearInterval(this.updateInterval);
        if(this.app.robot) await this.app.robot.close();
    }

    stopMatch(){
        this.stopExecution = true;
        this.stopMatchTimer();
    }

    startMatchTimer(){
        this.startTime = new Date().getTime();
        this.currentTime = 0;
        this.send();
    }

    stopMatchTimer(){
        this.startTime = 0;
        this.currentTime = 0;
        this.send();
    }

    isMatchFinished(){
        return this.stopExecution || (this.startTime!=0 && this.currentTime >= this.matchDuration);
    }

    updateMatchTime(){
        if(this.startTime!=0 && this.currentTime < this.matchDuration)
            this.currentTime=new Date().getTime() - this.startTime;
        this.send();
    }

    async runMatch(){
        this.startMatchTimer()
        while(!this.stopExecution && this.currentTime < this.matchDuration){
            await utils.sleep(10);//Required to avoid loop burst when no goal can be acheived
            for(const goal of this.app.goals.list){
                if(this.stopExecution) break;
                //Ignore goals already done
                if(goal.status == "done" && goal.executionCount == 0) continue;
                //Run goal
                if(goal.condition())
                    await this.runGoal(goal);
            }
        }
        this.app.logger.log("End of match, score:"+this.app.robot.score);
    }

    async runGoal(goal){
        this.app.logger.log("Running"+goal.name);
        goal.status = "running"
        let success = true;
        for(const action of goal.actions){
            if("team" in action && action.team != this.app.robot.team) continue;
            success &= await this.runAction(action);
            if(!success) break;
        }
        goal.status = success?"done":"failed";
        if(success) goal.executionCount--;
        this.app.goals.send(); //Notify UI
        
        await utils.sleep(1000);
        return success;
    }

    async runAction(action){
        //Run on robot
        action.status = "running"
        this.app.goals.send(); //Notify UI
        let success = await this.app.robot.run(action);
        action.status = success?"done":"failed";
        this.app.logger.log(action.status);
        return success;
    }
}