'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);

        this.list = [            
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