'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class Goals2020 extends Goals{
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
                    },
                    {
                        name: "Start funny action",
                        method: "startFunnyAction"
                    }
                ]
            },
            
            // Start Move
            {
                name: "Perform start move",
                condition: ()=>{
                    let buoyStorageSideA = this.app.robot.variables["buoyStorageSideA"];
                    let buoyStorageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(buoyStorageSideA.value>0 || buoyStorageSideB.value>0) return false;
                    return true;
                }, 
                executionCount: 1,
                actions: [
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        parameters:{ left: true, right: true}
                    },
                    {
                        name: "perform path",
                        method: "moveAlongPath",
                        team: "blue",
                        parameters:{ path:[
                            {x:250, y:650, angle:120, speed:0.2},
                            {x:400, y:400, angle:120, speed:0.2},
                            {x:670, y:250, angle:180, speed:0.2},
                            {x:1000, y:300, angle:225, speed:0.2},
                            {x:950, y:700, angle:-45, speed:0.2},
                        ]}
                    },
                    {
                        name: "Close arms",
                        method: "closeSideArms",
                        parameters: { 
                            addBuoyStorageSideA: 2,
                            addBuoyStorageSideB: 2,
                            removeFromMap:["buoyStartingNorth","buoyStartingFairwayNorth", "buoyTop", "buoyMiddleTop"]
                        }
                    },
                ]
            },
            
            // Start buoys
            {
                name: "Grab Start buoys",
                condition: ()=>{
                    let buoyStorageSideA = this.app.robot.variables["buoyStorageSideA"];
                    let buoyStorageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(buoyStorageSideA.value == buoyStorageSideA.max
                    || buoyStorageSideB.value == buoyStorageSideB.max)
                        return false;
                    return true;
                }, 
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyStartingNorth",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        parameters:{ left: true, right: true}
                    },
                    {
                        name: "Move Backward",
                        method: "moveBackward", //Robot's Side
                        team: "blue",
                        parameters:{ distance: 400, speed: 0.2}
                    },
                    {
                        name: "Close arms",
                        method: "closeSideArms",
                        parameters: { 
                            addBuoyStorageSideA: true,
                            addBuoyStorageSideB: true,
                            removeFromMap:["buoyStartingNorth","buoyStartingFairwayNorth"]
                        }
                    },
                ]
            },

            // Lighthouse
            {
                name: "Enable Lighthouse",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "lighthouse",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Activate lighthouse",
                        method: "activateLighthouse"
                    }
                ]
            },

            // Buoys Top
            {
                name: "Grab Buoy Top",
                condition: ()=>{
                    let storageSideA = this.app.robot.variables["buoyStorageSideA"];
                    if(storageSideA.value == storageSideA.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyTop",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        team: "blue",
                        parameters:{ left: true, right: false}
                    },
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        team: "yellow",
                        parameters:{ left: false, right: true}
                    },
                    {
                        name: "Move Backward",
                        method: "moveBackward",
                        parameters:{ distance: 250, speed: 0.2}
                    },
                    {
                        name: "Close arms",
                        method: "closeSideArms",
                        parameters: { 
                            addBuoyStorageSideA: true,
                            removeFromMap:["buoyTop"]
                        }
                    }
                ]
            },

            // Buoys Middle Top
            {
                name: "Grab Buoy Middle Top",
                condition: ()=>{
                    let storageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(storageSideB.value == storageSideB.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyMiddleTop",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        team: "blue",
                        parameters:{ left: false, right: true}
                    },
                    {
                        name: "Open arms",
                        method: "openSideArms",
                        team: "yellow",
                        parameters:{ left: true, right: false}
                    },
                    {
                        name: "Move Backward",
                        method: "moveBackward",
                        parameters:{ distance: 250, speed: 0.2}
                    },
                    {
                        name: "Close arms",
                        method: "closeSideArms",
                        parameters: { 
                            addBuoyStorageSideB: true,
                            removeFromMap:["buoyMiddleTop"]
                        }
                    }
                ]
            },

            // Read Wheathervane
            {
                name: "Read Weathervane",
                condition: ()=>{return true;},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "weathervane",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Read",
                        method: "readWeathervane"
                    }
                ]
            },

            // Deposit Start
            {
                name: "Deposit Starting Area",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageFrontA"].value == 0
                    && this.app.robot.variables["buoyStorageFrontB"].value == 0
                    && this.app.robot.variables["buoyStorageSideA"].value == 0
                    && this.app.robot.variables["buoyStorageSideB"].value == 0)
                        return false;
                    return true;
                },                
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "startingArea",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys"
                    }
                ]
            },

            // Buoys Bottom
            /*{
                name: "Grab Buoys Bottom",
                condition: ()=>{
                    let storageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(storageSideB.value != 0)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyMiddleBottom",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Grab buoys Bottom",
                        method: "grabBuoysBottom"
                    }
                ]
            },*/

            // Shared Reaf
            /*{
                name: "Grab Shared Reaf",
                condition: ()=>{
                    let storageFrontA = this.app.robot.variables["buoyStorageFrontA"];
                    let storageFrontB = this.app.robot.variables["buoyStorageFrontB"];
                    if(storageFrontA.value == storageFrontA.max
                    || storageFrontB.value == storageFrontB.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "sharedReaf",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Grab reaf",
                        method: "grabReaf"
                    }
                ]
            },*/
            
            // Deposit Bottom
            /*{
                name: "Deposit Bottom Port",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageFrontA"].value == 0
                    && this.app.robot.variables["buoyStorageFrontB"].value == 0
                    && this.app.robot.variables["buoyStorageSideA"].value == 0
                    && this.app.robot.variables["buoyStorageSideB"].value == 0)
                        return false;
                    return true;
                },
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "bottomPort",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys"
                    }
                ]
            },*/
            
            // Windsock Side
            /*{
                name: "Windsock Side",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "windsockSide",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Deploy Arm",
                        method: "setArmWindsock",
                        parameters:{ }
                    },
                    {
                        name: "Move Sideway",
                        method: "moveSidway", //Robot's Side
                        team: "blue",
                        parameters:{ side: "left", distance: 100, speed: 0.2, angle: 60 }
                    },
                    {
                        name: "Move Sideway",
                        method: "moveSidway", //Robot's Side
                        team: "yellow",
                        parameters:{ side: "right", distance: 100, speed: 0.2, angle: 60 }
                    },
                    {
                        name: "Retract Arm",
                        method: "setArmDefault",
                        parameters:{}
                    },
                    {
                        name: "Update score",
                        method: "validateWindsock",
                        parameters:{ }
                    }
                ]
            },*/
            
            // Windsock Middle
            /*{
                name: "Windsock Middle",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "windsockMiddle",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Deploy Arm",
                        method: "setArmWindsock",
                        parameters:{ }
                    },
                    {
                        name: "Move Sideway",
                        method: "moveSidway", //Robot's Side
                        team: "blue",
                        parameters:{ side: "left", distance: 100, speed: 0.2, angle: 60 }
                    },
                    {
                        name: "Move Sideway",
                        method: "moveSidway", //Robot's Side
                        team: "yellow",
                        parameters:{ side: "right", distance: 100, speed: 0.2, angle: 60 }
                    },
                    {
                        name: "Retract Arm",
                        method: "setArmDefault",
                        parameters:{ }
                    },
                    {
                        name: "Update score",
                        method: "validateWindsock",
                        parameters:{ }
                    }
                ]
            },*/

            // Move to End
            {
                name: "Move to End",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "endingAreaNorth",
                            speed: 0.2 // m/s
                        }
                    },
                    {
                        name: "Add score",
                        method: "validateEndZone"
                    }
                ]
            },

        ]
    }
}