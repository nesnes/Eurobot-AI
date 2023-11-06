'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2024.png"
        this.teams = ["blue","green"]
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
                name: "Base Top Protected Blue",
                type: "baseProtected",
                team: "blue",
                shape: { type: "rectangle", x:0, y:0, width: 400,  height: 400, color: "blue" },
                //access:{ x:225, y:1475, angle:90 },
                //avoidOffset: -85,
                startPosition: {x: 225, y: 1775, angle: 0, team: "blue"},
                endAccess:[/*{ x:525, y:1775, angle:180 },{ x:225, y:1475, angle:90 }*/]
            },{
                name: "Base Top protected Yellow",
                type: "baseProtected",
                team: "yellow",
                shape: { type: "rectangle", x:2600, y:0, width: 400,  height: 400, color: "yellow" },
                //access:{ x:225, y:525, angle:-90 },
                //avoidOffset: -85,
                startPosition: {x: 225, y: 225, angle: 0, team: "green"},
                endAccess: [/*{ x:525, y:225, angle:180 },{ x:225, y:525, angle:-90 }*/]
            },


            //Base Middle
            {
                name: "Base Middle Blue",
                type: "baseMiddle",
                team: "blue",
                shape: { type: "rectangle", x:2600, y:800, width: 400,  height: 400, color: "blue" },
                //access:{ x:1125, y:525, angle:-90 },
                //avoidOffset: -85,
                startPosition: {x: 1125, y: 225, angle: 90, team: "blue"},
                endAccess:[/*{ x:825, y:225, angle:0 }, { x:1425, y:225, angle:180 }, { x:1125, y:525, angle:-90 }*/]
            },{
                name: "Base Middle Yellow",
                type: "baseMiddle",
                team: "yellow",
                shape: { type: "rectangle", x:0, y:800, width: 400,  height: 400, color: "yellow" },
                //access:{ x:1125, y:1475, angle:90 },
                //avoidOffset: -85,
                startPosition: {x: 1125, y: 1775, angle: -90, team: "green"},
                endAccess:[/*{ x:825, y:1775, angle:0 }, { x:1425, y:1775, angle:180 },{ x:1125, y:1475, angle:90 }*/]
            },

            //Base Bottom
            {
                name: "Base Bottom",
                type: "baseBottom",
                team: "blue",
                shape: { type: "rectangle", x:0, y:1600, width: 400,  height: 400, color: "blue" },
                //access:{ x:1875, y:1475, angle:90 },
                //avoidOffset: -85,
                startPosition: {x: 1875, y: 1775, angle: -90, team: "blue"},
                endAccess:[/*{ x:1575, y:1775, angle:0 }, { x:2175, y:1775, angle:180 }, { x:1875, y:1475, angle:90 }*/]
            },{
                name: "Base Bottom",
                type: "baseBottom",
                team: "yellow",
                shape: { type: "rectangle", x:2600, y:1600, width: 400,  height: 400, color: "yellow" },
                //access:{ x:2300, y:1725, angle:0 },
                //avoidOffset: -85,
                startPosition: {x: 1875, y: 225, angle: 90, team: "green"},
                endAccess:[/*{ x:1575, y:225, angle:0 },{ x:2175, y:225, angle:180 }, { x:1875, y:525, angle:-90 }*/]
            },

            // PAMI
            {
                name: "PAMI yellow",
                type: "pami",
                team: "yellow",
                shape: { type: "rectangle", x:1500, y:0, width: 450,  height: 150, color: "yellow" },
            },
            {
                name: "PAMI blue",
                type: "pami",
                team: "blue",
                shape: { type: "rectangle", x:1050, y:0, width: 450,  height: 150, color: "blue" },
            },


            // Zones
            {
                name: "ZoneA",
                type: "zone",
                shape: { type: "circle", x:1500, y:500, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "ZoneBB",
                type: "zone",
                shape: { type: "circle", x:1000, y:700, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "ZoneBY",
                type: "zone",
                shape: { type: "circle", x:2000, y:700, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "ZoneCB",
                type: "zone",
                shape: { type: "circle", x:1000, y:1300, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "ZoneCY",
                type: "zone",
                shape: { type: "circle", x:2000, y:1300, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "ZoneD",
                type: "zone",
                shape: { type: "circle", x:1500, y:1500, radius: 125, color: "pink" },
                //access:{ x:575, y:1500, angle:90 }
            },


            // Solar panels
            {
                name: "Panel 1 Blue",
                type: "panel_reserved",
                team: "blue",
                shape: { type: "rectangle", x:225, y:1950, width: 100,  height: 50, color: "blue" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 2 Blue",
                type: "panel_reserved",
                team: "blue",
                shape: { type: "rectangle", x:450, y:1950, width: 100,  height: 50, color: "blue" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 3 Blue",
                type: "panel",
                shape: { type: "rectangle", x:675, y:1950, width: 100,  height: 50, color: "blue" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 4 Center Blue",
                type: "panel",
                shape: { type: "rectangle", x:1225, y:1950, width: 100,  height: 50, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 5 Center",
                type: "panel",
                shape: { type: "rectangle", x:1450, y:1950, width: 100,  height: 50, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 4 Center Yellow",
                type: "panel",
                shape: { type: "rectangle", x:1675, y:1950, width: 100,  height: 50, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 3 Yellow",
                type: "panel",
                shape: { type: "rectangle", x:2225, y:1950, width: 100,  height: 50, color: "yellow" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 2 Yellow",
                type: "panel_reserved",
                team: "yellow",
                shape: { type: "rectangle", x:2450, y:1950, width: 100,  height: 50, color: "yellow" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Panel 2 Yellow",
                type: "panel_reserved",
                team: "yellow",
                shape: { type: "rectangle", x:2675, y:1950, width: 100,  height: 50, color: "yellow" },
                //access:{ x:575, y:1500, angle:90 }
            },
            
            // Metal pots

            {
                name: "Pots top blue",
                type: "metal_pots",
                shape: { type: "circle", x:0, y:612.5, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Pots middle blue",
                type: "metal_pots",
                shape: { type: "circle", x:0, y:1387.5, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },

            {
                name: "Pots top yellow",
                type: "metal_pots",
                shape: { type: "circle", x:3000, y:612.5, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Pots middle yellow",
                type: "metal_pots",
                shape: { type: "circle", x:3000, y:1387.5, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },

            {
                name: "Pots bottom blue",
                type: "metal_pots",
                shape: { type: "circle", x:1000, y:2000, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Pots bottom yellow",
                type: "metal_pots",
                shape: { type: "circle", x:2000, y:2000, radius: 125, color: "grey" },
                //access:{ x:575, y:1500, angle:90 }
            },
            
            

        ]
    }

}