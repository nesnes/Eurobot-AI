'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);

        this.list = [

            
            // Wait for start
            /*{
                name: "Wait for start",
                condition: ()=>{return true;}, 
                executionCount: 1,
                actions: [
                    {
                        name: "Wait for start",
                        method: "waitForStart"
                    }
                ]
            },*/
            
            // dance start
            {
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "dance",
                        method: "dance",
                        parameters:{}
                    }
                ]
            }
        ]
    }
}