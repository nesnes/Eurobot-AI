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
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys"
                    }
                ]
            },

            // Start buoys
            {
                name: "Grab Start buoys",
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
                            component: "buoyStartingNorth",
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Grab starting buoys",
                        method: "grabStartingBuoys"
                    }
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
                            speed: 0.5 // m/s
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
                name: "Grab Buoys Top",
                condition: ()=>{
                    let storageSideA = this.app.robot.variables["buoyStorageSideA"];
                    if(storageSideA.value != 0)
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
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Grab buoys top",
                        method: "grabBuoysTop"
                    }
                ]
            },

            // Buoys Bottom
            {
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
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Grab buoys Bottom",
                        method: "grabBuoysBottom"
                    }
                ]
            },

            // Shared Reaf
            {
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
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Grab reaf",
                        method: "grabReaf"
                    }
                ]
            },
            
            // Deposit Bottom
            {
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
                            speed: 0.5 // m/s
                        }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys"
                    }
                ]
            },
            
            // Windsock Side
            {
                name: "Windsock Side",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "windsockSide",
                            speed: 0.5 // m/s
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
            },
            
            // Windsock Middle
            {
                name: "Windsock Middle",
                condition: ()=>{return true},
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "windsockMiddle",
                            speed: 0.5 // m/s
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
            },


        ]
    }
}