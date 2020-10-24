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
                    },
                    {
                        name: "Start funny action",
                        method: "startFunnyAction"
                    }
                ]
            },
            
            {
                name: "Deposit North (B)",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageSideB"].value == 0)
                        return false;
                    return true;
                },                
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingFairwayNorth", speed: 0.2 }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys",
                        parameters:{ sideB: true }
                    }
                ]
            },
            
            {
                name: "Deposit South (A)",
                condition: ()=>{
                    if(this.app.robot.variables["buoyStorageSideA"].value == 0)
                        return false;
                    return true;
                },                
                executionCount: 10,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingFairwaySouth", speed: 0.2 }
                    },
                    {
                        name: "Deposit buoys",
                        method: "depositBuoys",
                        parameters:{ sideA: true }
                    }
                ]
            },
            
            {
                name: "Grab Buoy Middle Bottom",
                condition: ()=>{
                    let storageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(storageSideB.value >= storageSideB.max)
                        return false;
                    return true;
                },
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyMiddleBottom", speed: 0.2 }
                    },
                    {
                        name: "Grab buoys",
                        method: "grabBuoy",
                        parameters:{ sideB:true, component: "buoyMiddleBottom"}
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
                    let storageSideA = this.app.robot.variables["buoyStorageSideA"];
                    if(storageSideA.value >= storageSideA.max)
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
                        name: "Grab buoy",
                        method: "grabBuoy",
                        parameters:{ sideA:true, component: "buoyMiddleTop"}
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
                    let storageSideB = this.app.robot.variables["buoyStorageSideB"];
                    if(storageSideB.value >= storageSideB.max)
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
                        name: "Grab buoy",
                        method: "grabBuoy",
                        parameters:{ sideB:true, component: "buoyTop"}
                    }
                ],
                onError: [
                    {
                        name: "Close Arms",
                        method: "closeSideArms",
                        parameters:{}
                    }
                ]  
            }
            
            
        ]
    }
}