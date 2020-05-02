'use strict';

exports.goals = [
    {
        name: "Enable Lighthouse",
        conditions: [
            { variable: "lighthouseActived", value:false }
        ],
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
    }
]