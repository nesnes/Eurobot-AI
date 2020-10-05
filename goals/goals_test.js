'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);

        this.list = [

            
            // Wait for start
            {
                name: "Wait for start",
                condition: ()=>{return true;}, 
                executionCount: 1,
                actions: [
                    {
                        name: "Wait for start",
                        method: "waitForStart"
                    }
                ]
            },
            
            // Windsock Side
            {
                name: "BackAndFront",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Set init pos",
                        method: "setPosDebug", //Robot's Side
                        team: "blue",
                        parameters:{}
                    },
                    {
                        name: "Move Forward 500",
                        method: "moveForward", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 500, speed: 0.2, angle: 0 }
                    },
                    {
                        name: "Move Backward 500",
                        method: "moveBackward", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 500, speed: 0.2, angle: 0 }
                    },
                    {
                        name: "Rotate 90",
                        method: "rotateToAngle", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 0, speed: 0.2, angle: 90 }
                    },
                    {
                        name: "Rotate -90",
                        method: "rotateToAngle", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 0, speed: 0.2, angle: -90 }
                    },
                    {
                        name: "Rotate 180",
                        method: "rotateToAngle", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 0, speed: 0.2, angle: 180 }
                    }
                ]
            }
        ]
    }
}