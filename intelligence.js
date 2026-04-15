'use strict';
const utils = require("./utils")

module.exports = class Intelligence {
    constructor(app) {
        this.app = app;
        this.runId = new Date().getTime();
        this.startTime = 0;
        this.matchStarted = false;
        this.currentTime = 0;
        this.matchDuration = 99*1000; // 100 second but DO need to reduce to ensure stop
                                      // minus 10 senconds for PAMI avoidance
        this.hasBeenRun = false;
        this.stopExecution = true;
        this.lastSend = 0;
    }

    async init(){

        this.app.logger.log("Parameters: "+JSON.stringify(this.app.parameters));
        
        this.matchDuration = 99*1000;
        // Remove 10s for PAMI, unless specified no PAMI
        if("PAMIOnTable" in this.app.parameters && !this.app.parameters.PAMIOnTable){
            //Nothing
        }
        else{
            //this.matchDuration -= 10*1000;
        }
        this.app.logger.log("Match duration: "+(this.matchDuration/1000)+"s");

        //Load the map
        //let mapFile = './maps/map_lidar_test';
        let mapFile = './maps/map_2026';
        delete require.cache[require.resolve(mapFile)]; //Delete require() cache
        const Map = require(mapFile);
        this.app.map = new Map(this.app);
        this.app.map.init();
        this.app.logger.log("Map loaded");
        
        //Create robot
        //let robotFile = './robots/robot_test_lidar';
        let robotFile = './robots/robot_2026';
        delete require.cache[require.resolve(robotFile)]; //Delete require() cache
        const Robot = require(robotFile);
        this.app.robot = new Robot(this.app);
        await this.app.robot.init();
        this.app.logger.log("Robot loaded");

        //Read the goals
        //let goalsFile='./goals/goals_homologation';
        //let goalsFile='./goals/goals_test';
        let goalsFile='./goals/goals_2025';
        delete require.cache[require.resolve(goalsFile)]; //Delete require() cache
        const Goals = require(goalsFile);
        this.app.goals = new Goals(this.app);
        this.app.goals.init();
        this.app.logger.log("Goals loaded");
        
        //Load multicast
        let multicastFile='./multicast';
        delete require.cache[require.resolve(multicastFile)]; //Delete require() cache
        const Multicast = require(multicastFile);
        this.app.multicast = new Multicast(this.app);
        this.app.multicast.init();
        this.app.logger.log("Multicast loaded");
        

        this.send();
        this.updateInterval = setInterval(()=>this.updateMatchTime(),150);
        this.broadcastTimeInterval = setInterval(()=>this.broadcastTime(),1000);
        
        this.app.map.sendGrid(this.app.map.createGrid(1500,1000,1500,1000));

        if("start" in this.app.parameters && this.app.parameters.start) {
            this.runMatch();
        }
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSend < 500) return;
        this.lastSend = now;

        let payload = {
            currentTime: this.currentTime/1000,
            running: !this.stopExecution,
            hasBeenRun: this.hasBeenRun
        }
        this.app.mqttServer.publish({
            topic: '/intelligence',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });

        if(utils.teleplotEnabled){
            utils.sendTeleplot("currentTime", this.currentTime/1000, "s");
        }
    }

    async close(){
        if(this.updateInterval) clearInterval(this.updateInterval);
        if(this.broadcastTimeInterval) clearInterval(this.broadcastTimeInterval);
        if(this.app.robot) await this.app.robot.close();
        if(this.app.multicast) await this.app.multicast.close();
    }

    stopMatch(){
        this.stopExecution = true;
        this.matchStarted = false;
        this.stopMatchTimer();
    }
    
    startMatchTimer(){
        this.runId =  new Date().getTime();
        this.startTime = new Date().getTime();
        this.currentTime = 0;
        this.send();
    }
    
    stopMatchTimer(){
        //this.startTime = 0;
        //this.currentTime = 0;
        if(this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = null;
        if(this.broadcastTimeInterval) clearInterval(this.broadcastTimeInterval);
        this.broadcastTimeInterval = null;
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

    broadcastTime(){
        if(this.matchStarted && this.currentTime < this.matchDuration){
            this.app.multicast.udpBroadcastTime({time:this.currentTime});
        }
    }
    
    async runMatch(){
        this.hasBeenRun = true;
        this.stopExecution = false;
        this.matchStarted = false;
        this.startMatchTimer();
        while(!this.stopExecution && this.currentTime < this.matchDuration){
            let goalFound = false;
            for(const goal of this.app.goals.list){
                if(this.stopExecution) break;
                //Ignore goals already done
                if(goal.status == "done" && goal.executionCount == 0) continue;
                //Run goal
                if(goal.condition()){
                    goalFound = true;
                    utils.sendTeleplot("Goal", goal.name, "_", "txt");
                    await this.runGoal(goal);
                    await utils.sleep(10);
                }
            }
            if(!goalFound) await utils.sleep(100);//Required to avoid loop burst when no goal can be acheived
        }
        this.app.logger.log("End of match, score:"+this.app.robot.score);
        this.app.robot.endMatch();
    }

    async runGoal(goal){
        this.app.logger.log("Running"+goal.name);
        goal.status = "running"
        utils.sendTeleplot("goal.status", goal.status, "_", "txt");
        let success = true;
        for(const action of goal.actions){
            if("team" in action && action.team != this.app.robot.team) continue;
            success &= await this.runAction(action);
            if(!success) break;
        }
        goal.status = success?"done":"failed";
        utils.sendTeleplot("goal.status", goal.status, "_", "txt");
        if(success) goal.executionCount--;
        else await utils.sleep(50); // avoid error burst on locked action list
        this.app.goals.send(); //Notify UI
        //Run on-error actions
        if(!success && goal.onError && goal.onError.length){
            for(const action of goal.onError){
                if("team" in action && action.team != this.app.robot.team) continue;
                console.log("onError", action.name)
                await this.runAction(action);
            }
        }
        
        //await utils.sleep(1000);
        return success;
    }

    async runAction(action){
        //Run on robot
        action.status = "running"
        this.app.goals.send(); //Notify UI
        utils.sendTeleplot("action", action.name, "_", "txt");
        let success = await this.app.robot.run(action);
        action.status = success?"done":"failed";
        this.app.logger.log(action.status);
        return success;
    }
}
