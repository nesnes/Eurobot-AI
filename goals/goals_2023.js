'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.6; //m/s 0.4
        this.moveSpeed = 0.6; //m/s 0.4
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
            ]
        };
        
        let findAndGrab = (elementList)=>{
            return {
                name: "Find and grab",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "" || this.app.robot.variables.armAB.value == "" || this.app.robot.variables.armBC.value == "";
                    let hasTimeElapsed = this.app.intelligence.currentTime >= 50*1000;
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-28*1000;
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
                onError: [ { name:"pack arms", method:"setArmsPacked", parameters:{}}]
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
                onError: [ { name:"pack arms", method:"setArmsPacked", parameters:{}}]
            };
        };
        
        let grabCake = (element=null, iterations=0)=>{
            return {
                name: "Grab cake",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "" || this.app.robot.variables.armAB.value == "" || this.app.robot.variables.armBC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-28*1000;
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
                onError: [ { name:"pack arms", method:"setArmsPacked", parameters:{}}]
            };
        }
        
        let depositeCake = (plateTypes, preventBuild=false)=>{
            return {
                name: "Deposit cake",
                condition: ()=>{
                    let hasCakes = this.app.robot.variables.armAC.value != "" || this.app.robot.variables.armAB.value != "" || this.app.robot.variables.armBC.value != "";
                    let hasAllCakes = this.app.robot.variables.armAC.value != "" && this.app.robot.variables.armAB.value != "" && this.app.robot.variables.armBC.value != "";
                    let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-22*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && (canDepositAndBuild || canDepositRandom);
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit cake",
                        method: "depositCake",
                        parameters:{ plateTypes: plateTypes, preventBuild: preventBuild, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ { name:"pack arms", method:"setArmsPacked", parameters:{}}]
            };
        }
        
        let moveToSpecificEndZone = (plateTypes)=> {
            return{
                name: "Move to specific End",
                condition: ()=>{
                    let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000);//9
                    let endReached = this.app.robot.variables.endReached.value;
                    return isEnd && !endReached;
                },                
                executionCount: 1,
                actions: [
                    { name: "Return to end zone", method: "returnToSpecificEndZone", parameters:{ plateTypes:plateTypes } },
                    // Store End reached
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
                ],
                //onError: [ { name:"Move to new end zone", method:"returnToEndZone", parameters:{ignoreSelected:true}}]
            }
        };
        
        let moveToEndZone = {
            name: "Move to End",
            condition: ()=>{
                let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000);//9
                let endReached = this.app.robot.variables.endReached.value;
                return isEnd && !endReached;
            },                
            executionCount: 0,
            actions: [
                { name: "Return to end zone", method: "returnToEndZone", parameters:{ } },
                // Store End reached
                { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
            ],
            onError: [ { name:"Move to new end zone", method:"returnToEndZone", parameters:{ignoreSelected:true}}]
        };
        
        let moveToEndZoneUpdated = {
            name: "Move to updated End",
            condition: ()=>{
                let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000);//9
                let endReached = this.app.robot.variables.endReached.value;
                if(!isEnd || !endReached) return false;
                
                // Detect if end zone changed
                let zoneList = [];
                let zoneTypes = ["plateProtected", "plateMiddleTop", "plateMiddleBottom", "plateBottomSide", "plateBottom"];
                for(let type of zoneTypes) {
                    zoneList.push(...this.app.map.getComponentList(type, this.app.robot.team));
                }
                let actualZoneValue = 0;
                let maxZoneValue = 0;
                let maxZone = null;
                for(let zone of zoneList){
                    if(zone.cakes) continue;
                    let zoneValue = 0;
                    if(zone.endZone) zoneValue = zone.endZone;
                    if(zone.name == this.app.robot.variables.endZone.value) actualZoneValue = zoneValue;
                    if(maxZoneValue<zoneValue){
                        maxZoneValue = zoneValue;
                        maxZone = zone;
                    }
                }
                let endZoneChanged = actualZoneValue != maxZoneValue
                                     && maxZone.name != this.app.robot.variables.endZone.value;
                                     
                return isEnd && endZoneChanged;
            },                
            executionCount: 0,
            actions: [
                { name: "Return to end zone", method: "returnToEndZone", parameters:{ } },
                // Store End reached
                { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
            ],
            onError: [ { name:"Move to new end zone", method:"returnToEndZone", parameters:{ignoreSelected:true}}]
        };

        this.list = [
            waitForStart,
            rushBrownCakes(),
            grabCake(null, 1),
            
            // Deposit random
            depositeCake(["plateMiddleTop"/*, "plateMiddleBottom"*/, "plateBottom", "plateBottomSide"], true), // not "plateProtected"
           
            grabCake(null, 1),
            grabCake(null, 1),
            
             // Deposit random
            depositeCake(["plateMiddleTop"/*, "plateMiddleBottom"*/, "plateBottom", "plateBottomSide"], true), // not "plateProtected"
           
            grabCake(null, 1),
            grabCake(null, 1),
            findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            
            depositeCake(["plateMiddleTop"/*, "plateMiddleBottom"*/, "plateBottom", "plateBottomSide"], true), // not "plateProtected"
           
            //findAndGrab(["plateMiddleTop", "plateMiddleBottom", "plateBottom"]),
            ////depositeCake("plateProtected", 1),
            //depositeCake(["plateMiddleTop"/*, "plateMiddleBottom"*/, "plateBottom", "plateBottomSide"]), // not "plateProtected"
            //depositeCake(["plateMiddleTop"/*, "plateMiddleBottom"*/, "plateBottom", "plateBottomSide"]), // not "plateProtected"
           
            moveToSpecificEndZone(["plateMiddleBottom"]),
           
            //moveToEndZone,
            //moveToEndZone,
            //moveToEndZoneUpdated
            
            //moveTest
        ]
    }
}
