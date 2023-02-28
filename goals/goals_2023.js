'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.5; //m/s 0.6
        this.moveSpeed = 0.4; //m/s 0.5
        this.defaultNearDist=50;//50mm
        this.defaultNearAngle=10;//10°
        
        let waitForStart = {
            name: "Wait for start",
            condition: ()=>{return true;}, 
            executionCount: 1,
            actions: [
                {
                    name: "Wait for start",
                    method: "waitForStart"
                },
                { name: "Score secondaire", method: "addScore", parameters:{ score: 42 } },
            ]
        };
        
        
        let justGrabSampleShed = (element, color)=>{
            return {
                name: "Just Grab Sample Shed",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    let secondRobotLeft = this.app.intelligence.currentTime >= 30*1000;
                    return secondRobotLeft && hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to shed
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Arm
                    { name: "Open arm", method: "setArmPGFD", parameters:{ name:"ACG", duration: 250, wait: true } },
                    // Forward
                    { name: "forward",  method: "moveForward", parameters:{ distance:230, speed: this.defaultSpeed } },
                    // Side
                    //{ team:"yellow", name: "Side",  method: "moveAtAngle", parameters:{ angle:-135, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //{ team:"violet", name: "Side",  method: "moveAtAngle", parameters:{ angle:-45, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Grab artifact
                    { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 255 } },
                    { name: "Grab sample", method: "setArmGFD", parameters:{ name:"ACG", duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:color, side:1 } },
                    // Move backward
                    { name: "backward",  method: "moveBackward", parameters:{ distance:250, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "setArmDefault", parameters:{ name:"ACG", duration: 600, wait: false } },
                    // Remove from map
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } }
                ]
            };
        }
        
        
        
        let moveTest = {
            name: "Move test",
            condition: ()=>{
                let endReached = this.app.robot.variables.endReached.value;
                return !endReached;
            },                
            executionCount: 10,
            actions: [
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "plateProtected", color:"green", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "plateProtected", color:"blue", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                }
            ]
        };

        this.list = [
            waitForStart,
            moveTest
        ]
    }
}