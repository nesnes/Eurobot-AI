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

        let reservedZoneAvoidOffset = (app, item)=>{
            if(app.robot && item.team && app.robot.team != item.team) return 50;
            return -250;
        };

        let buildZoneAvoidOffset = (app, item)=>{
            let isStart = (app.intelligence.currentTime < 8*1000);
            if(isStart) return -250
            if(app.robot && item.team && app.robot.team != item.team) return 50;
            if(item.itemCount) return 50;
            return -250;
        };

        let sceneOffset = (app, item)=>{
            let isEnd = (app.intelligence.currentTime >= app.intelligence.matchDuration-20*1000);
            if(isEnd) return 250;
            return 50;
        };


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

            // Ramp & Scene
            {
                name: "Ramp Yellow",
                type: "ramp",
                team: "yellow",
                avoidOffset: 100,
                shape: { type: "rectangle", x:650, y:0, width: 400,  height: 200, color: "black" }
            },
            {
                name: "Ramp Blue",
                type: "ramp",
                team: "blue",
                avoidOffset: 100,
                shape: { type: "rectangle", x:1950, y:0, width: 400,  height: 200, color: "black" }
            },
            {
                name: "Scene Yellow",
                type: "scene",
                team: "yellow",
                avoidOffset: sceneOffset,
                shape: { type: "rectangle", x:1050, y:0, width: 450,  height: 450, color: "black" }
            },
            {
                name: "Scene Blue",
                type: "scene",
                team: "blue",
                avoidOffset: sceneOffset,
                shape: { type: "rectangle", x:1500, y:0, width: 450,  height: 450, color: "black" }
            },

            // reserved areas

            {
                name: "Reserved Yellow",
                type: "reservedArea",
                team: "yellow",
                avoidOffset: 50,
                shape: { type: "rectangle", x:0, y:0, width: 1050,  height: 450, color: "pink" }
            },
            {
                name: "Reserved Blue",
                type: "reservedArea",
                team: "blue",
                avoidOffset: 50,
                shape: { type: "rectangle", x:1950, y:0, width: 1050,  height: 450, color: "pink" }
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



            // PAMI
            {
                name: "PAMI yellow",
                type: "pami",
                team: "yellow",
                reserved: true,
                avoidOffset: 100,
                shape: { type: "rectangle", x:0, y:0, width: 150,  height: 450, color: "yellow" },
            },
            {
                name: "PAMI blue",
                type: "pami",
                reserved: true,
                team: "blue",
                avoidOffset: 100,
                shape: { type: "rectangle", x:2850, y:0, width: 150,  height: 450, color: "blue" },
            },


            //Base Top (protected)
            {
                name: "Build Top Reserved Blue",
                type: "buildReserved",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:2400, y:0, width: 450,  height: 450, color: "blue" },
                access:{ x:2550, y:500, angle:-90 },
                endAccess: [{ x:1700, y:1300, angle:-40 }, { x:2200, y:1200, angle:-60 }, { x:2225, y:1500, angle:-70 }],
                avoidOffset: reservedZoneAvoidOffset,
                startPosition: {x: 2625, y: 225, angle: 90, team: "blue"}
            },{
                name: "Build Top Reserved Yellow",
                type: "buildReserved",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:150, y:0, width: 450,  height: 450, color: "yellow" },
                access:{ x:450, y:500, angle:-90 },
                endAccess: [{ x:1300, y:1300, angle:-130 }, { x:800, y:1200, angle:-120 }, { x:775, y:1500, angle:-110 }],
                avoidOffset: reservedZoneAvoidOffset,
                startPosition: {x: 375, y: 225, angle: 90, team: "yellow"}
            },

            //Build Middle
            {
                name: "Build Middle Blue",
                type: "buildMiddle",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:0, y:900, width: 450,  height: 450, color: "blue" },
                access:{ x:700, y:1125, angle:180 },
                avoidOffset: buildZoneAvoidOffset,
                startPosition: {x: 225, y: 1125, angle: 0, team: "blue"}
            },{
                name: "Build Middle Yellow",
                type: "buildMiddle",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:2550, y:900, width: 450,  height: 450, color: "yellow" },
                access:{ x:2300, y:1125, angle:0 },
                avoidOffset: buildZoneAvoidOffset,
                startPosition: {x: 2775, y: 1125, angle: 180, team: "yellow"}
            },

            //Build Bottom
            {
                name: "Build Bottom Blue",
                type: "buildBottom",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:1550, y:1550, width: 450,  height: 450, color: "blue" },
                access:{ x:1775, y:1300, angle:90 },
                avoidOffset: buildZoneAvoidOffset,
                startPosition: {x: 1775, y: 1775, angle: 90, team: "blue"}
            },{
                name: "Build Bottom Yellow",
                type: "buildBottom",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:1000, y:1550, width: 450,  height: 450, color: "yellow" },
                access:{ x:1225, y:1300, angle:90 },
                avoidOffset: buildZoneAvoidOffset,
                startPosition: {x: 1225, y: 1775, angle: 90, team: "yellow"}
            },

            //Build bottom side
            {
                name: "Build Bottom Side Blue",
                type: "buildBottomSide",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:0, y:1850, width: 450,  height: 150, color: "blue" },
                access:{ x:300, y:1650, angle:90 },
                maxItemCount: 1,
                avoidOffset: 50,
                isAccessible: (app, component)=>{
                    let elementInFront = app.map.getComponentByName("Element Bottom Side Yellow");
                    return elementInFront == null;
                }
            },{
                name: "Build Bottom Side Yellow",
                type: "buildBottomSide",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:2550, y:1850, width: 450,  height: 150, color: "yellow" },
                access:{ x:2700, y:1650, angle:90 },
                maxItemCount: 1,
                avoidOffset: 50,
                isAccessible: (app, component)=>{
                    let elementInFront = app.map.getComponentByName("Element Bottom Side Blue");
                    return elementInFront == null;
                }
            },

            //Build bottom center
            {
                name: "Build Bottom Center Blue",
                type: "buildBottomCenter",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:2000, y:1850, width: 450,  height: 150, color: "blue" },
                access:{ x:2250, y:1650, angle:90 },
                maxItemCount: 1,
                avoidOffset: 50,
                isAccessible: (app, component)=>{
                    let elementInFront = app.map.getComponentByName("Element Bottom Blue");
                    return elementInFront == null;
                }
            },{
                name: "Build Bottom Center Yellow",
                type: "buildBottomCenter",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:550, y:1850, width: 450,  height: 150, color: "yellow" },
                access:{ x:750, y:1650, angle:90 },
                maxItemCount: 1,
                avoidOffset: 50,
                isAccessible: (app, component)=>{
                    let elementInFront = app.map.getComponentByName("Element Bottom Yellow");
                    return elementInFront == null;
                }
            },


            // Elements Reserved
            {
                name: "Element Top Reserved Yellow",
                type: "elementReserved",
                team: "yellow",
                shape: { type: "rectangle", x:625, y:225, width: 400,  height: 100, color: "yellow" },
                avoidOffset: 50,
                reserved: true,
                access:{ tags:["center"], x:825, y:575, angle:-90 }
                /*otherAccess:[{ tags:["blue"], x:1200, y:500, angle:0 },
                            { tags:["yellow"], x:1800, y:500, angle:180 },
                            { tags:["bottomblue"], x:1300, y:700, angle:-45 },
                            { tags:["bottomyellow"], x:1700, y:700, angle:-135 }]*/
            },
            {
                name: "Element Top Reserved Blue",
                type: "elementReserved",
                team: "blue",
                shape: { type: "rectangle", x:1975, y:225, width: 400,  height: 100, color: "blue" },
                avoidOffset: 50,
                reserved: true,
                access:{ tags:["center"], x:2175, y:575, angle:-90 }
            },

            // Elements Top Side
            {
                name: "Element Top Side Yellow",
                type: "elementPAMI",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:25, y:475, width: 100,  height: 400, color: "yellow" },
                avoidOffset: 50,
                access:{ tags:["center"], x:375, y:700, angle:180 }
            },
            {
                name: "Element Top Side Blue",
                type: "elementPAMI",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:2875, y:475, width: 100,  height: 400, color: "blue" },
                avoidOffset: 50,
                access:{ tags:["center"], x:2625, y:700, angle:0 }
            },

            // Elements Bottom Side
            {
                name: "Element Bottom Side Yellow",
                type: "elementTight",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:25, y:1400, width: 100,  height: 400, color: "yellow" },
                avoidOffset: 50,
                access:{ tags:["center"], x:375, y:1600, angle:180 },
                isAccessible: (app, component)=>{
                    let elementAside = app.map.getComponentByName("Element Bottom Yellow");
                    return elementAside == null;
                }
            },
            {
                name: "Element Bottom Side Blue",
                type: "elementTight",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:2875, y:1400, width: 100,  height: 400, color: "blue" },
                avoidOffset: 50,
                access:{ tags:["center"], x:2625, y:1600, angle:0 },
                isAccessible: (app, component)=>{
                    let elementAside = app.map.getComponentByName("Element Bottom Blue");
                    return elementAside == null;
                }
            },

            // Elements Center
            {
                name: "Element Center Yellow",
                type: "element",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:900, y:1000, width: 400,  height: 100, color: "yellow" },
                avoidOffset: 50,
                access:{ tags:["bottom"], x:1100, y:1350, angle:-90 },
                otherAccess:[{ tags:["top"], x:1100, y:750, angle:90 }]
            },
            {
                name: "Element Center Blue",
                type: "element",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:1700, y:1000, width: 400,  height: 100, color: "blue" },
                avoidOffset: 50,
                access:{ tags:["bottom"], x:1900, y:1350, angle:-90 },
                otherAccess:[{ tags:["top"], x:1900, y:750, angle:90 }]
            },

            // Elements Bottom
            {
                name: "Element Bottom Yellow",
                type: "elementBuildBottom",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:575, y:1700, width: 400,  height: 100, color: "yellow" },
                avoidOffset: -50, // needed to avoid blocking in corner
                access:{ tags:["bottom"], x:775, y:1450, angle:90 }
            },
            {
                name: "Element Bottom Blue",
                type: "elementBuildBottom",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:2025, y:1700, width: 400,  height: 100, color: "blue" },
                avoidOffset: -50, // needed to avoid blocking in corner
                access:{ tags:["bottom"], x:2225, y:1450, angle:90 }
            }
            

        ]
    }

}