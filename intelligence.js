'use strict';

module.exports = class Intelligence {
    constructor(app) {
        this.app = app;
    }

    init(){
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
        this.app.robot.init();
        this.app.logger.log("Robot loaded");
    }

    async runMatch(){
        //Resolve the goals
        for(const goal of this.app.goals.list){
            await this.runGoal(goal);
        }
    }

    async runGoal(goal){
        this.app.logger.log("Running"+goal.name);
        goal.status = "running"
        let success = true;
        for(const action of goal.actions){
            success &= await this.runAction(action) 
        }
        goal.status = success?"done":"failed";
        this.app.goals.send(); //Notify UI
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