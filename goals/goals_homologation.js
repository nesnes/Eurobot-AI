'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.4; //m/s

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
                    },
                    {
                        name: "Start funny action",
                        method: "startFunnyAction"
                    }
                ]
            },
            
            {
                name: "Perform start move",
                condition: ()=>{
                    let buoyStorageSideGreen = this.app.robot.variables["buoyStorageSideGreen"];
                    let buoyStorageSideRed = this.app.robot.variables["buoyStorageSideRed"];
                    if(buoyStorageSideGreen.value>0 || buoyStorageSideRed.value>0) return false;
                    return true;
                }, 
                executionCount: 1,
                actions: [
                    {
                        name: "Position front arm",
                        method: "setArmDefault"
                    },
                    {
                        name: "perform path",
                        method: "moveAlongPath",
                        team: "blue",
                        parameters:{ path:[
                            {x:260, y:435, angle:-45, speed:this.defaultSpeed},
                            {x:260, y:435, angle:10, speed:this.defaultSpeed},
                            {x:450, y:450, angle:10, speed:this.defaultSpeed}
                        ]}
                    },
                    {
                        name: "perform path",
                        method: "moveAlongPath",
                        team: "yellow",
                        parameters:{ path:[
                            {x:2740, y:435, angle:-135, speed:this.defaultSpeed},
                            {x:2740, y:435, angle:170, speed:this.defaultSpeed},
                            {x:2550, y:450, angle:170, speed:this.defaultSpeed}
                        ]}
                    },
                    {
                        name: "Close front arm",
                        method: "setArmClose",
                        parameters: { 
                            addBuoyStorageFrontGreen: 1,
                            addBuoyStorageFrontRed: 1,
                            removeFromMap:["buoyStartingNorth","buoyStartingFairwayNorth"]
                        }
                    },
                ]
            },
            
            {
                name: "Activate lighthouse",
                condition: ()=>{
                    return true;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "lighthouse", speed: this.defaultSpeed }
                    },
                    {
                        name: "Activate",
                        method: "activateLighthouse"
                    }
                ]
            },
            
            {
                name: "Grab Buoy Middle Bottom",
                condition: ()=>{
                    let storageVar = this.app.robot.variables["buoyStorageSideRed"];
                    if(this.app.robot.team=="yellow") storageVar = this.app.robot.variables["buoyStorageSideGreen"];
                    if(storageVar.value >= storageVar.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyMiddleBottom", speed: this.defaultSpeed }
                    },
                    {
                        name: "Grab buoys",
                        method: "grabBuoy",
                        parameters:{ 
                            sideRed:this.app.robot.team=="blue", 
                            sideGreen:this.app.robot.team=="yellow", 
                            component: "buoyMiddleBottom"
                        }
                    }
                ],
                onError: [
                    {
                        name: "Close Arms",
                        method: "closeSideArms",
                        parameters:{}
                    }
                ]  
                
            },
            
            {
                name: "Grab Buoy Middle Top",
                condition: ()=>{
                    let storageVar = this.app.robot.variables["buoyStorageSideGreen"];
                    if(this.app.robot.team=="yellow") storageVar = this.app.robot.variables["buoyStorageSideRed"];
                    if(storageVar.value >= storageVar.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyMiddleTop", speed: this.defaultSpeed }
                    },
                    {
                        name: "Grab buoy",
                        method: "grabBuoy",
                        parameters:{ 
                            sideRed:this.app.robot.team=="yellow", 
                            sideGreen:this.app.robot.team=="blue", 
                            component: "buoyMiddleTop"
                        }
                    }
                ],
                onError: [
                    {
                        name: "Close Arms",
                        method: "closeSideArms",
                        parameters:{}
                    }
                ]  
            },
            
            {
                name: "Grab Buoy Top",
                condition: ()=>{
                    let storageVar = this.app.robot.variables["buoyStorageSideRed"];
                    if(this.app.robot.team=="yellow") storageVar = this.app.robot.variables["buoyStorageSideGreen"];
                    if(storageVar.value >= storageVar.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyTop", speed: this.defaultSpeed }
                    },
                    {
                        name: "Grab buoy",
                        method: "grabBuoy",
                        parameters:{ 
                            sideRed:this.app.robot.team=="blue", 
                            sideGreen:this.app.robot.team=="yellow", 
                            component: "buoyTop"}
                    }
                ],
                onError: [
                    {
                        name: "Close Arms",
                        method: "closeSideArms",
                        parameters:{}
                    }
                ]  
            },
            
            {
                name: "Deposit Green",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageSideGreen"].value == 0
                    && this.app.robot.variables["buoyStorageFrontGreen"].value == 0)
                        return false;
                    return true;
                },                
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingFairwayGreen", speed: this.defaultSpeed }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys",
                        parameters:{ sideGreen: true, component: "startingFairwayGreen", pairedComponent: "startingFairwayRed" }
                    }
                ]
            },
            
            {
                name: "Deposit Red",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageSideRed"].value == 0
                    && this.app.robot.variables["buoyStorageFrontRed"].value == 0)
                        return false;
                    return true;
                },                
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingFairwayRed", speed: this.defaultSpeed }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys",
                        parameters:{ sideRed: true, component: "startingFairwayRed", pairedComponent: "startingFairwayGreen" }
                    }
                ]
            },
            
            {
                name: "Read weathervane",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= 25*1000
                      && this.app.robot.variables["endZone"].value == 0)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "weathervane", speed: this.defaultSpeed }
                    },
                    {
                        name: "Read",
                        method: "readWeathervane"
                    }
                ]
            },
            
            {
                name: "Read weathervane 2",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= 25*1000
                      && this.app.robot.variables["endZone"].value == 0)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "weathervane2", speed: this.defaultSpeed }
                    },
                    {
                        name: "Read",
                        method: "readWeathervane"
                    }
                ]
            },
            {
                name: "Move to End",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000
                       && this.app.robot.variables["endZone"].value>0)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingArea", speed: this.defaultSpeed }
                    },
                    {
                        name: "orientRobot",
                        method: "performEndingMove"
                    }
                ]
            },
            
            
        ]
    }
}