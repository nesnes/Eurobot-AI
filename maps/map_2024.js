'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2024.png"
        this.teams = ["blue","yellow"]
        this.components = [
            
            //Localisation
            { name: "Loc Top", type: "localisation",
              shape: { type: "line", x1:0, y1:0, x2: 3000, y2: 0, color: "blue" }
            },
            { name: "Loc Right", type: "localisation",
              shape: { type: "line", x1:3000, y1:0, x2: 3000, y2: 2000, color: "blue" }
            },
            { name: "Loc Bottom", type: "localisation",
              shape: { type: "line", x1:0, y1:2000, x2: 3000, y2: 2000, color: "blue" }
            },
            { name: "Loc Left", type: "localisation",
              shape: { type: "line", x1:0, y1:0, x2: 0, y2: 2000, color: "blue" }
            },

            //Borders
            {
                name: "Top Border",
                type: "boder",
                shape: { type: "rectangle", x:0, y:-22, width: 3000,  height: 22, color: "grey" }
            },{
                name: "Left Border",
                type: "boder",
                shape: { type: "rectangle", x:-22, y:0, width: 22,  height: 2000, color: "grey" }
            },{
                name: "Right Border",
                type: "boder",
                shape: { type: "rectangle", x:3000, y:0, width: 22,  height: 2000, color: "grey" }
            },{
                name: "Bottom Border",
                type: "boder",
                shape: { type: "rectangle", x:0, y:2000, width: 3000,  height: 22, color: "grey" }
            },

            //Experiment
            /*{
                name: "Experiment Blue",
                type: "experiment",
                team: "blue",
                shape: { type: "rectangle", x:-222, y:1550, width: 200,  height: 450, color: "blue" },
                access:{ x:225, y:1775, angle:180 }
            },
            {
                name: "Experiment Green",
                type: "experiment",
                team: "green",
                shape: { type: "rectangle", x:-222, y:0, width: 200,  height: 450, color: "green" },
                access:{ x:225, y:225, angle:180 }
            },*/


            //Base Top (protected)
            {
                name: "Base Top Reserved Blue",
                type: "baseReserved",
                team: "blue",
                shape: { type: "rectangle", x:0, y:0, width: 450,  height: 450, color: "blue" },
                access:{ x:600, y:300, angle:180 },
                ///avoidOffset: -85,
                startPosition: {x: 225, y: 225, angle: 45, team: "blue"},
                endAccess:[/*{ x:525, y:300, angle:180 },*/{ x:500, y:500, angle:-135 },{ x:300, y:525, angle:-90 }]
            },{
                name: "Base Top Reserved Yellow",
                type: "baseReserved",
                team: "yellow",
                shape: { type: "rectangle", x:2550, y:0, width: 450,  height: 450, color: "yellow" },
                access:{ x:2400, y:300, angle:0 },
                //avoidOffset: -85,
                startPosition: {x: 2775, y: 225, angle: 135, team: "yellow"},
                endAccess: [/*{ x:2475, y:300, angle:0 },*/{ x:2500, y:500, angle:-45 },{ x:2700, y:525, angle:-90 }]
            },


            //Base Middle
            {
                name: "Base Middle Blue",
                type: "baseMiddle",
                team: "blue",
                shape: { type: "rectangle", x:2550, y:775, width: 450,  height: 450, color: "blue" },
                access:{ x:2400, y:1000, angle:0 },
                avoidOffset: -60,
                startPosition: {x: 2775, y: 1000, angle: 180, team: "blue"},
                endAccess:[{ x:2700, y:700, angle:90 }/*,{ x:2475, y:1000, angle:0 },{ x:2500, y:725, angle:45 },{ x:2500, y:1275, angle:-45 },{ x:2700, y:1300, angle:-90 }*/]
            },{
                name: "Base Middle Yellow",
                type: "baseMiddle",
                team: "yellow",
                shape: { type: "rectangle", x:0, y:775, width: 450,  height: 450, color: "yellow" },
                access:{ x:600, y:1000, angle:180 },
                avoidOffset: -60,
                startPosition: {x: 225, y: 1000, angle: 0, team: "yellow"},
                endAccess:[{ x:300, y:700, angle:90 }/*,{ x:525, y:1000, angle:180 },{ x:500, y:725, angle:135 },{ x:500, y:1275, angle:-135 },{ x:300, y:1300, angle:-90 }*/]
            },

            //Base Bottom
            {
                name: "Base Bottom Blue",
                type: "baseBottom",
                team: "blue",
                shape: { type: "rectangle", x:0, y:1550, width: 450,  height: 450, color: "blue" },
                access:{ x:600, y:1700, angle:180 },
                avoidOffset: -60,
                startPosition: {x: 225, y: 1775, angle: -45, team: "blue"},
                endAccess:[{ x:300, y:1475, angle:90 }/*,{ x:525, y:1700, angle:180 },{ x:500, y:1500, angle:135 }*/]
            },{
                name: "Base Bottom Yellow",
                type: "baseBottom",
                team: "yellow",
                shape: { type: "rectangle", x:2550, y:1550, width: 450,  height: 450, color: "yellow" },
                access:{ x:2400, y:1700, angle:0 },
                avoidOffset: -60,
                startPosition: {x: 2775, y: 1775, angle: -135, team: "yellow"},
                endAccess:[{ x:2700, y:1475, angle:90 }/*,{ x:2475, y:1700, angle:0 },{ x:2500, y:1500, angle:45 }*/]
            },

            // PAMI
            {
                name: "PAMI yellow",
                type: "pami",
                team: "yellow",
                avoidOffset: 100,
                shape: { type: "rectangle", x:1500, y:0, width: 450,  height: 150, color: "yellow" },
            },
            {
                name: "PAMI blue",
                type: "pami",
                team: "blue",
                avoidOffset: 100,
                shape: { type: "rectangle", x:1050, y:0, width: 450,  height: 150, color: "blue" },
            },


            // Plants
            {
                name: "PlantTop_center",
                type: "plant",
                shape: { type: "circle", x:1500, y:500, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["bottom"], x:1500, y:800, angle:-90 },
                otherAccess:[{ tags:["blue"], x:1200, y:500, angle:0 },
                            { tags:["yellow"], x:1800, y:500, angle:180 },
                            //{ tags:["topblue"], x:1225, y:375, angle:25 },
                            //{ tags:["topyellow"], x:1775, y:375, angle:155 },
                            { tags:["bottomblue"], x:1300, y:700, angle:-45 },
                            { tags:["bottomyellow"], x:1700, y:700, angle:-135 }]
            },
            {
                name: "PlantTop_blue",
                type: "plant",
                shape: { type: "circle", x:1000, y:700, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["bottom"], x:1000, y:1000, angle:-90 },
                otherAccess:[{ tags:["top"], x:1000, y:450, angle:90 },
                            { tags:["blue"], x:700, y:700, angle:0 },
                            { tags:["yellow"], x:1300, y:700, angle:180 },
                            { tags:["topblue"], x:800, y:500, angle:45 },
                            { tags:["topyellow"], x:1200, y:500, angle:135 },
                            { tags:["bottomblue"], x:800, y:900, angle:-45 },
                            { tags:["bottomyellow"], x:1200, y:900, angle:-135 }]
            },
            {
                name: "PlantTop_yellow",
                type: "plant",
                shape: { type: "circle", x:2000, y:700, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["bottom"], x:2000, y:1000, angle:-90 },
                otherAccess:[{ tags:["top"], x:2000, y:450, angle:90 },
                            { tags:["blue"], x:1700, y:700, angle:0 },
                            { tags:["yellow"], x:2300, y:700, angle:180 },
                            { tags:["topblue"], x:1800, y:500, angle:45 },
                            { tags:["topyellow"], x:2200, y:500, angle:135 },
                            { tags:["bottomblue"], x:1800, y:900, angle:-45 },
                            { tags:["bottomyellow"], x:2200, y:900, angle:-135 }]
            },
            {
                name: "PlantBottom_blue",
                type: "plant",
                shape: { type: "circle", x:1000, y:1300, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["top"], x:1000, y:1000, angle:90 },
                otherAccess:[{ tags:["bottom"], x:1000, y:1600, angle:-90 },
                            { tags:["blue"], x:700, y:1300, angle:0 },
                            { tags:["yellow"], x:1300, y:1300, angle:180 },
                            { tags:["topblue"], x:800, y:1100, angle:45 },
                            { tags:["topyellow"], x:1200, y:1100, angle:135 },
                            { tags:["bottomblue"], x:800, y:1500, angle:-45 },
                            { tags:["bottomyellow"], x:1200, y:1500, angle:-135 }]
            },
            {
                name: "PlantBottom_yellow",
                type: "plant",
                shape: { type: "circle", x:2000, y:1300, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["top"], x:2000, y:1000, angle:90 },
                otherAccess:[{ tags:["bottom"], x:2000, y:1600, angle:-90 },
                            { tags:["blue"], x:1700, y:1300, angle:0 },
                            { tags:["yellow"], x:2300, y:1300, angle:180 },
                            { tags:["topblue"], x:1800, y:1100, angle:45 },
                            { tags:["topyellow"], x:2200, y:1100, angle:135 },
                            { tags:["bottomblue"], x:1800, y:1500, angle:-45 },
                            { tags:["bottomyellow"], x:2200, y:1500, angle:-135 }]
            },
            {
                name: "PlantBottom_center",
                type: "plant",
                shape: { type: "circle", x:1500, y:1500, radius: 125, color: "pink" },
                avoidOffset: -15,
                access:{ tags:["top"], x:1500, y:1200, angle:90 },
                otherAccess:[{ tags:["blue"], x:1200, y:1500, angle:0 },
                            { tags:["yellow"], x:1800, y:1500, angle:180 },
                            { tags:["bottomblue"],  x:1250, y:1650, angle:-35 },
                            { tags:["bottomyellow"], x:1750, y:1650, angle:-145 },
                            { tags:["topblue"], x:1300, y:1300, angle:45 },
                            { tags:["topyellow"], x:1700, y:1300, angle:135 }]
            },


            // Solar panels
            {
                name: "Panel 1 Blue",
                type: "panel_reserved",
                team: "blue",
                shape: { type: "rectangle", x:225, y:1950, width: 100,  height: 50, color: "blue" },
                avoidOffset: 50,
                access:{ x:275, y:1730, angle:90 }
            },
            {
                name: "Panel 2 Blue",
                type: "panel_reserved",
                team: "blue",
                shape: { type: "rectangle", x:450, y:1950, width: 100,  height: 50, color: "blue" },
                avoidOffset: 50,
                access:{ x:500, y:1730, angle:90 }
            },
            {
                name: "Panel 3 Blue",
                type: "panel_color_access",
                team: "blue",
                shape: { type: "rectangle", x:675, y:1950, width: 100,  height: 50, color: "blue" },
                avoidOffset: 50,
                access:{ x:725, y:1730, angle:90 }
            },
            {
                name: "Panel 4 Center Blue",
                type: "panel_shared_access",
                team: "yellow",
                shape: { type: "rectangle", x:1225, y:1950, width: 100,  height: 50, color: "grey" },
                avoidOffset: 50,
                access:{ x:1275, y:1730, angle:90 }
            },
            {
                name: "Panel 5 Center",
                type: "panel",
                shape: { type: "rectangle", x:1450, y:1950, width: 100,  height: 50, color: "grey" },
                avoidOffset: 50,
                access:{ x:1500, y:1730, angle:90 }
            },
            {
                name: "Panel 4 Center Yellow",
                type: "panel_shared_access",
                team: "blue",
                shape: { type: "rectangle", x:1675, y:1950, width: 100,  height: 50, color: "grey" },
                avoidOffset: 50,
                access:{ x:1725, y:1730, angle:90 }
            },
            {
                name: "Panel 3 Yellow",
                type: "panel_color_access",
                team: "yellow",
                shape: { type: "rectangle", x:2225, y:1950, width: 100,  height: 50, color: "yellow" },
                avoidOffset: 50,
                access:{ x:2275, y:1730, angle:90 }
            },
            {
                name: "Panel 2 Yellow",
                type: "panel_reserved",
                team: "yellow",
                shape: { type: "rectangle", x:2450, y:1950, width: 100,  height: 50, color: "yellow" },
                avoidOffset: 50,
                access:{ x:2500, y:1730, angle:90 }
            },
            {
                name: "Panel 1 Yellow",
                type: "panel_reserved",
                team: "yellow",
                shape: { type: "rectangle", x:2675, y:1950, width: 100,  height: 50, color: "yellow" },
                avoidOffset: 50,
                access:{ x:2725, y:1730, angle:90 }
            },
            
            // Metal pots

            {
                name: "Pots top blue",
                type: "metal_pots",
                shape: { type: "circle", x:0, y:612.5, radius: 125, color: "grey" },
                access:{ x:300, y:613, angle:180 }
            },
            {
                name: "Pots middle blue",
                type: "metal_pots",
                shape: { type: "circle", x:0, y:1387.5, radius: 125, color: "grey" },
                access:{ x:300, y:1388, angle:180 }
            },

            {
                name: "Pots top yellow",
                type: "metal_pots",
                shape: { type: "circle", x:3000, y:612.5, radius: 125, color: "grey" },
                access:{ x:2700, y:613, angle:0 }
            },
            {
                name: "Pots middle yellow",
                type: "metal_pots",
                shape: { type: "circle", x:3000, y:1387.5, radius: 125, color: "grey" },
                access:{ x:2700, y:1388, angle:0 }
            },

            {
                name: "Pots bottom blue",
                type: "metal_pots",
                shape: { type: "circle", x:1000, y:2000, radius: 125, color: "grey" },
                access:{ x:1000, y:1730, angle:90 }
            },
            {
                name: "Pots bottom yellow",
                type: "metal_pots",
                shape: { type: "circle", x:2000, y:2000, radius: 125, color: "grey" },
                access:{ x:2000, y:1730, angle:90 }
            },
            
            //Planters
            
            {
                name: "Planter top blue reserved",
                type: "planter_reserved",
                team: "blue",
                shape: { type: "rectangle", x:600, y:-172, width: 325,  height: 172, color: "blue" },
                avoidOffset: -200,
                access:{ x:763, y:300, angle:-90 }
            },
            
            {
                name: "Planter top yellow reserved",
                type: "planter_reserved",
                team: "yellow",
                shape: { type: "rectangle", x:2075, y:-172, width: 325,  height: 172, color: "yellow" },
                avoidOffset: -200,
                access:{ x:2237, y:300, angle:-90 }
            },
            
            {
                name: "Planter left blue",
                type: "planter",
                team: "blue",
                shape: { type: "rectangle", x:-172, y:450, width: 172,  height: 325, color: "blue" },
                avoidOffset: -200,
                access:{ x:300, y:613, angle:180 }
            },
            
            {
                name: "Planter right yellow",
                type: "planter",
                team: "yellow",
                shape: { type: "rectangle", x:3000, y:450, width: 172,  height: 325, color: "yellow" },
                avoidOffset: -200,
                access:{ x:2700, y:613, angle:0 }
            },
            
            {
                name: "Planter bottom yellow",
                type: "planter",
                team: "yellow",
                shape: { type: "rectangle", x:-172, y:1225, width: 172,  height: 325, color: "yellow" },
                avoidOffset: -200,
                access:{ x:300, y:1388, angle:180 }
            },
            
            {
                name: "Planter bottom blue",
                type: "planter",
                team: "blue",
                shape: { type: "rectangle", x:3000, y:1225, width: 172,  height: 325, color: "blue" },
                avoidOffset: -200,
                access:{ x:2700, y:1388, angle:0 }
            },

        ]
    }

}