'use strict';

module.exports = class Intelligence {
    constructor(app) {
        this.app = app;
    }

    start(){
        //Load the map
        delete require.cache[require.resolve('./maps/map_2020')]; //Delete require() cache
        const Map = require('./maps/map_2020');
        this.app.map = new Map(this.app);
        this.app.map.init();
        this.app.logger.log("Map loaded");

        //Read the goals
        delete require.cache[require.resolve('./goals/goals_2020')]; //Delete require() cache
        this.app.goals = require("./goals/goals_2020").goals;
        this.app.logger.log("Goals loaded");

        //Create robot
        delete require.cache[require.resolve('./robots/robot_2020')]; //Delete require() cache
        const Robot = require('./robots/robot_2020');
        let robot = new Robot(this.app);
        this.app.logger.log("Robot loaded");

        //Resolve the goals
        for(const goal of this.app.goals){
            this.app.logger.log("Running"+goal.name);
            //Send to robot
            for(const action of goal.actions){
                let success = robot.run(action)
                this.app.logger.log(success?"Done":"Failed");
            }
        }
    }
}