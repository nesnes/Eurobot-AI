'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2026.png"
        this.teams = ["blue","yellow"]

        let reservedZoneAvoidOffset = (app, item)=>{
            if(app.robot && item.team && app.robot.team != item.team) return 50;
            return -250;
        };

        let buildZoneAvoidOffset = (app, item)=>{
            let isStart = (app.intelligence.currentTime < 8*1000);
            if(isStart) return 50
            if(app.robot && item.team && app.robot.team != item.team) return 50;
            if(item.itemCount) return 50;
            return 50;
        };

        let sceneOffset = (app, item)=>{
            let isStart = (app.intelligence.currentTime < 8*1000);
            if(isStart) return 25;
            return 50;
        };

        let elementOffset = (app, item)=>{
            let isStart = (app.intelligence.currentTime < 8*1000);
            let isEnd = (app.intelligence.currentTime >= app.intelligence.matchDuration-20*1000);
            let isTeam = (app.robot && item.team && app.robot.team != item.team);
            if(isStart && isTeam) return 25;
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

            // Scene
            {
                name: "Scene",
                type: "scene",
                team: "",
                avoidOffset: sceneOffset,
                shape: { type: "rectangle", x:600, y:0, width: 1800,  height: 450, color: "brown" }
            },

            // PAMI
            /*{
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
            },*/


            //Starting zones (protected)
            {
                name: "Starting Yellow",
                type: "startingZone",
                team: "yellow",
                reserved: true,
                shape: { type: "rectangle", x:0, y:0, width: 600,  height: 450, color: "yellow" },
                access:{ x:475, y:700, angle:-120 },
                endAccess: [{ x:900, y:800, angle:-90 }, { x:450, y:1200, angle:-90 }, { x:650, y:850, angle:-90 }],
                avoidOffset: reservedZoneAvoidOffset,
                startPosition: {x: 375, y: 225, angle: 90, team: "yellow"}
            },
            {
                name: "Starting Blue",
                type: "startingZone",
                team: "blue",
                reserved: true,
                shape: { type: "rectangle", x:2400, y:0, width: 600,  height: 450, color: "blue" },
                access:{ x:2525, y:700, angle:-60 },
                endAccess: [{ x:2100, y:800, angle:-90 }, { x:2550, y:1200, angle:-90 }, { x:2300, y:850, angle:-90 }],
                avoidOffset: reservedZoneAvoidOffset,
                startPosition: {x: 2625, y: 225, angle: 90, team: "blue"}
            },
            
            //Build Top
            {
                name: "Build TY",
                type: "buildTop",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:1150, y:450, width: 200,  height: 200, color: "green" },
                access:{ x:1250, y:875, angle:-90 },
                avoidOffset: buildZoneAvoidOffset
            },
            {
                name: "Build TB",
                type: "buildTop",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:1650, y:450, width: 200,  height: 200, color: "green" },
                access:{ x:1750, y:875, angle:-90 },
                avoidOffset: buildZoneAvoidOffset
            },

            //Build Middle
            {
                name: "Build MYY",
                type: "buildMiddle",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:0, y:1100, width: 200,  height: 200, color: "green" },
                access:{ x:425, y:1200, angle:180 },
                avoidOffset: buildZoneAvoidOffset
            },{
                name: "Build MY",
                type: "buildMiddle",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:700, y:1100, width: 200,  height: 200, color: "green" },
                access:{ x:800, y:875, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },{
                name: "Build M",
                type: "buildMiddle",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:1400, y:1100, width: 200,  height: 200, color: "green" },
                access:{ x:1500, y:875, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },{
                name: "Build MB",
                type: "buildMiddle",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:2100, y:1100, width: 200,  height: 200, color: "green" },
                access:{ x:2200, y:875, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },{
                name: "Build MBB",
                type: "buildMiddle",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:2800, y:1100, width: 200,  height: 200, color: "green" },
                access:{ x:2576, y:1200, angle:0 },
                avoidOffset: buildZoneAvoidOffset
            },

            //Build Bottom
            {
                name: "Build BY",
                type: "buildBottom",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:600, y:1800, width: 200,  height: 200, color: "green" },
                access:{ x:700, y:1575, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },
            {
                name: "Build B",
                type: "buildBottom",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:1400, y:1800, width: 200,  height: 200, color: "green" },
                access:{ x:1500, y:1575, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },
            {
                name: "Build B",
                type: "buildBottom",
                team: "",
                reserved: true,
                shape: { type: "rectangle", x:2200, y:1800, width: 200,  height: 200, color: "green" },
                access:{ x:2300, y:1575, angle:90 },
                avoidOffset: buildZoneAvoidOffset
            },

            // Elements Top Side
            {
                name: "Element Top Yellow",
                type: "element",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:100, y:700, width: 150,  height: 200, color: "yellow" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:500, y:800, angle:180 }
            },
            {
                name: "Element Top Blue",
                type: "element",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:2750, y:700, width: 150,  height: 200, color: "blue" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:2500, y:800, angle:0 }
            },

            // Elements PAMI
            {
                name: "Element PAMI Yellow",
                type: "elementPAMI",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:700, y:250, width: 200,  height: 150, color: "yellow" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:800, y:650, angle:-90 }
            },
            {
                name: "Element PAMI Blue",
                type: "elementPAMI",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:2100, y:250, width: 200,  height: 150, color: "blue" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:2200, y:650, angle:-90 }
            },

            // Elements Middle
            {
                name: "Element Middle Yellow",
                type: "element",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:1050, y:1125, width: 200,  height: 150, color: "yellow" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:1150, y:875, angle:90 }
            },
            {
                name: "Element Middle Blue",
                type: "element",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:1750, y:1125, width: 200,  height: 150, color: "blue" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:1850, y:875, angle:90 }
            },

            // Elements Bottom Side
            {
                name: "Element Bottom Side Yellow",
                type: "element",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:100, y:1500, width: 150,  height: 200, color: "yellow" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:500, y:1600, angle:180 }
            },
            {
                name: "Element Bottom Side Blue",
                type: "element",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:2750, y:1500, width: 150,  height: 200, color: "blue" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:2500, y:1600, angle:0 }
            },

            // Elements Bottom
            {
                name: "Element Bottom Yellow",
                type: "element",
                team: "yellow",
                reserved: false,
                shape: { type: "rectangle", x:1000, y:1750, width: 200,  height: 150, color: "yellow" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:1100, y:1500, angle:90 }
            },
            {
                name: "Element Bottom Blue",
                type: "element",
                team: "blue",
                reserved: false,
                shape: { type: "rectangle", x:1800, y:1750, width: 200,  height: 150, color: "blue" },
                avoidOffset: elementOffset,
                access:{ tags:["center"], x:1900, y:1500, angle:90 }
            },

            

        ]
    }

}