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
                method: "moveToElement",
                parameters:{
                    element: "lighthouse",
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