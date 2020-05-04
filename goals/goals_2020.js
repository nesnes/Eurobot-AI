'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class Goals2020 extends Goals{
    constructor(app) {
        super(app);

        this.list = [

            // Start buoys
            {
                name: "Grab Start buoys",
                conditions: [
                    { variable: "buoyStorageFront", value:0 }
                ],
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyStartingNorth",
                            speed: 1 // m/s
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
                conditions: [],
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "lighthouse",
                            speed: 1 // m/s
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
                conditions: [
                    { variable: "buoyStorageA", value:0 }
                ],
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyTop",
                            speed: 1 // m/s
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
                conditions: [
                    { variable: "buoyStorageB", value:0 }
                ],
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "buoyMiddleBottom",
                            speed: 1 // m/s
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
                conditions: [
                    { variable: "buoyStorageFront", value:0 }
                ],
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{
                            component: "sharedReaf",
                            speed: 1 // m/s
                        }
                    },
                    {
                        name: "Grab reaf",
                        method: "grabReaf"
                    }
                ]
            },


        ]
    }
}