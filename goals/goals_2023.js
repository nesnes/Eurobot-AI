'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.3; //m/s 0.6
        this.moveSpeed = 0.3; //m/s 0.5
        this.defaultNearDist=20;//50mm
        this.defaultNearAngle=3;//10°
        
        let waitForStart = {
            name: "Wait for start",
            condition: ()=>{return true;}, 
            executionCount: 1,
            actions: [
                {
                    name: "Wait for start",
                    method: "waitForStart"
                },
                { name: "Score sortie zone + panier", method: "addScore", parameters:{ score: 6 } },
            ]
        };
        
        let findAndGrab = (elementList)=>{
            return {
                name: "Find and grab",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "" || this.app.robot.variables.armAB.value == "" || this.app.robot.variables.armBC.value == "";
                    let hasTimeElapsed = this.app.intelligence.currentTime >= 50*1000;
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-16*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasArmFree && hasTimeElapsed && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "find and grab",
                        method: "findAndGrabCake",
                        parameters:{ plateList: elementList }
                    }
                ],
                onError: [ { name:"pack arms", method:"packEmptyArms", parameters:{}}]
            };
        };
        
        let rushBrownCakes = ()=>{
            return {
                name: "Rush brown cakes",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let isTimeStarting = this.app.intelligence.currentTime <= 2000;
                    let inMatchingStartZone = 900 < this.app.robot.x && this.app.robot.x < 2100; 
                    let endReached = this.app.robot.variables.endReached.value;
                    return inMatchingStartZone && hasArmFree && isTimeStarting && !endReached;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Rush brown cakes",
                        method: "rushBrownFromCenter",
                        parameters:{ }
                    }
                ],
                onError: [ { name:"pack arms", method:"packEmptyArms", parameters:{}}]
            };
        };
        
        let grabCake = (element=null, iterations=0)=>{
            return {
                name: "Simple grab cake",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "" || this.app.robot.variables.armAB.value == "" || this.app.robot.variables.armBC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: iterations,
                actions: [
                    {
                        name: "Grab cake",
                        method: "grabCake",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ { name:"pack arms", method:"packEmptyArms", parameters:{}}]
            };
        }
        
        let depositeCake = (plateTypes)=>{
            return {
                name: "Deposit cake",
                condition: ()=>{
                    let hasCakes = this.app.robot.variables.armAC.value != "" || this.app.robot.variables.armAB.value != "" || this.app.robot.variables.armBC.value != "";
                    let hasAllCakes = this.app.robot.variables.armAC.value != "" && this.app.robot.variables.armAB.value != "" && this.app.robot.variables.armBC.value != "";
                    let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-30*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    let canDepositRandom = hasCakes && !hasMuchTimeLeft && hasSomeTimeLeft;
                    return !endReached && (canDepositAndBuild || canDepositRandom);
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit cake",
                        method: "depositCake",
                        parameters:{ plateTypes: plateTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ { name:"pack arms", method:"packEmptyArms", parameters:{}}]
            };
        }
        
        let depositeCakeSimple = (plateTypes)=>{
            return {
                name: "Deposit cake",
                condition: ()=>{
                    let hasCakes = this.app.robot.variables.armAC.value != "" || this.app.robot.variables.armAB.value != "" || this.app.robot.variables.armBC.value != "";
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return !endReached && hasCakes && hasSomeTimeLeft;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit cake",
                        method: "depositCakeSimple",
                        parameters:{ plateTypes: plateTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ { name:"pack arms", method:"packEmptyArms", parameters:{}}]
            };
        }
        
        let moveToEndZone = {
            name: "Move to End",
            condition: ()=>{
                let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-10*1000);//9
                let endReached = this.app.robot.variables.endReached.value;
                return isEnd && !endReached;
            },                
            executionCount: 1,
            actions: [
                { name: "Return to end zone", method: "returnToEndZone", parameters:{ } },
                // Store End reached
                { name: "Score end zone", method: "addScore", parameters:{ score: 15 } },
                { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
            ]
        };
        
        
        
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
            rushBrownCakes(),
            grabCake(null, 1),
            grabCake(null, 1),
            grabCake(null, 1),
            findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            //depositeCake("plateProtected", 1),
            depositeCake(["plateMiddleTop", "plateMiddleBottom", "plateBottom", "plateBottomSide"]), // not "plateProtected"
            depositeCake(["plateMiddleTop", "plateMiddleBottom", "plateBottom", "plateBottomSide"]), // not "plateProtected"
            //depositeCakeSimple("plateProtected", 1),
            //depositeCakeSimple(),
            //depositeCakeSimple(),
            moveToEndZone
            
            //moveTest
        ]
    }
}
