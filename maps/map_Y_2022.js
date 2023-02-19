'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2020.png"
        this.teams = ["yellow","violet"]
        this.components = [
            
            //Localisation Top
            { name: "Loc Experience Yellow", type: "localisation",
              shape: { type: "line", x1:0, y1:0, x2: 450, y2: 0, color: "blue" }
            },
            { name: "Loc Gallery Yellow", type: "localisation",
              shape: { type: "line", x1:450, y1:40, x2: 1170, y2: 40, color: "blue" }
            },
            { name: "Loc Gallery Violet", type: "localisation",
              shape: { type: "line", x1:1830, y1:40, x2: 2550, y2: 40, color: "blue" }
            },
            { name: "Loc Experience Violet", type: "localisation",
              shape: { type: "line", x1:2550, y1:0, x2: 3000, y2: 0, color: "blue" }
            },
            // Localisation Side Yellow
            { name: "Loc Side Yellow", type: "localisation",
              shape: { type: "line", x1:0, y1:0, x2: 0, y2: 1490, color: "blue" }
            },
            // Localisation Side Yellow
            { name: "Loc Side Violet", type: "localisation",
              shape: { type: "line", x1:3000, y1:0, x2: 3000, y2: 1490, color: "blue" }
            },
            // Localisation Bottom
            { name: "Loc Shed Yellow", type: "localisation",
              shape: { type: "line", x1:0, y1:1490, x2: 510, y2: 2000, color: "blue" }
            },
            { name: "Loc Shed Violet", type: "localisation",
              shape: { type: "line", x1:2490, y1:2000, x2: 3000, y2: 1490, color: "blue" }
            },
            { name: "Loc Bottom", type: "localisation",
              shape: { type: "line", x1:510, y1:2000, x2: 2490, y2: 2000, color: "blue" }
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
            {
                name: "Experiment Yellow",
                type: "experiment",
                team: "yellow",
                shape: { type: "rectangle", x:0, y:-222, width: 450,  height: 200, color: "yellow" },
                access:{ x:225, y:225, angle:-90 }
            },
            {
                name: "Lighthouse Violet",
                type: "experiment",
                team: "violet",
                shape: { type: "rectangle", x:2550, y:-222, width: 450,  height: 200, color: "violet" },
                access:{ x:2775, y:225, angle:-90 }
            },


            //Starting areas (reduced for path finding)
            {
                name: "Starting Area",
                type: "startingArea",
                team: "yellow",
                shape: { type: "rectangle", x:0, y:500, width: 400,  height: 500, color: "yellow" },
                access:{ x:500, y:750, angle:180 },
                avoidOffset: -50
            },{
                name: "Starting Area",
                type: "startingArea",
                team: "violet",
                shape: { type: "rectangle", x:2600, y:500, width: 400,  height: 500, color: "violet" },
                access:{ x:2500, y:750, angle:0 },
                avoidOffset: -50
            },
            
            //Middle Dispensers
            {
                name: "Middle Dispenser Yellow",
                type: "middleDispenser",
                team: "yellow",
                shape: { type: "rectangle", x:1275, y:0, width: 150,  height: 102, color: "yellow" },
                access:{ x:1340, y:350, angle:-90 }
            },
            {
                name: "Middle Dispenser Violet",
                type: "middleDispenser",
                team: "violet",
                shape: { type: "rectangle", x:1575, y:0, width: 150,  height: 102, color: "violet" },
                access:{ x:1660, y:350, angle:-90 }
            },
            {
                name: "Middle Dispenser Border",
                type: "middleDispenserBorder",
                shape: { type: "rectangle", x:1489, y:0, width: 22,  height: 300, color: "grey" }
            },
            
            //Top Dispensers
            {
                name: "Top Dispenser Yellow",
                type: "topDispenser",
                team: "yellow",
                shape: { type: "rectangle", x:-150, y:225, width: 150,  height: 150, color: "green" },
                access:{ x:225, y:300, angle:-60 }
            },
            {
                name: "Top Dispenser Violet",
                type: "topDispenser",
                team: "violet",
                shape: { type: "rectangle", x:3000, y:225, width: 150,  height: 150, color: "green" },
                access:{ x:2775, y:300, angle:-120 }
            },
            
            //Bottom Dispensers
            {
                name: "Bottom Dispenser Yellow",
                type: "bottomDispenser",
                team: "yellow",
                shape: { type: "rectangle", x:0, y:1175, width: 102,  height: 150, color: "yellow" },
                access:{ x:350, y:1250, angle:180 }
            },
            {
                name: "Bottom Dispenser Violet",
                type: "bottomDispenser",
                team: "violet",
                shape: { type: "rectangle", x:2898, y:1175, width: 102,  height: 150, color: "violet" },
                access:{ x:2650, y:1250, angle:0 }
            },
            
            // Shed
            {
                name: "Shed Yellow",
                type: "shed",
                team: "yellow",
                shape: { type: "circle", x:0, y:2000, radius: 410, color: "grey" }
            },
            {
                name: "Shed Violet",
                type: "shed",
                team: "violet",
                shape: { type: "circle", x:3000, y:2000, radius: 410, color: "grey" }
            },
            
            // Artifact
            {
                name: "Artifact Yellow",
                type: "artifact",
                team: "yellow",
                shape: { type: "circle", x:217, y:1784, radius: 60, color: "yellow" },
                access:{ x:500, y:1500, angle:135 }
            },
            {
                name: "Artifact Violet",
                type: "artifact",
                team: "violet",
                shape: { type: "circle", x:2783, y:1784, radius: 60, color: "violet" },
                access:{ x:2500, y:1500, angle:45 }
            },
            
            // Samples Shed
            {
                name: "Sample Shed Top Yellow",
                type: "sampleShedTop",
                team: "yellow",
                shape: { type: "circle", x:121, y:1688, radius: 75, color: "blue" },
                access:{ x:400, y:1400, angle:135 }
            },
            {
                name: "Sample Shed bottom Yellow",
                type: "sampleShedBottom",
                team: "yellow",
                shape: { type: "circle", x:312, y:1879, radius: 75, color: "red" },
                access:{ x:600, y:1600, angle:135 }
            },
            {
                name: "Sample Shed Top Violet",
                type: "sampleShedTop",
                team: "violet",
                shape: { type: "circle", x:2879, y:1688, radius: 75, color: "blue" },
                access:{ x:2600, y:1400, angle:45 }
            },
            {
                name: "Sample Shed Bottom Violet",
                type: "sampleShedBottom",
                team: "violet",
                shape: { type: "circle", x:2688, y:1879, radius: 75, color: "red" },
                access:{ x:2400, y:1600, angle:45 }
            },
            

            //Squares
            {
                name: "Square 1 Yellow",
                type: "square1",
                team: "yellow",
                shape: { type: "rectangle", x:575, y:2000, width: 185,  height: 50, color: "yellow" },
                access:{ x:667, y:1750, angle:90 }
            },
            {
                name: "Square 2 Yellow",
                type: "square2",
                team: "yellow",
                shape: { type: "rectangle", x:760, y:2000, width: 185,  height: 50, color: "yellow" },
                access:{ x:852, y:1750, angle:90 }
            },
            {
                name: "Square 3 Yellow",
                type: "square3",
                team: "yellow",
                shape: { type: "rectangle", x:945, y:2000, width: 185,  height: 50, color: "yellow" },
                access:{ x:1037, y:1750, angle:90 }
            },
            {
                name: "Square 1 Violet",
                type: "square1",
                team: "violet",
                shape: { type: "rectangle", x:2240, y:2000, width: 185,  height: 50, color: "violet" },
                access:{ x:2332, y:1750, angle:90 }
            },
            {
                name: "Square 2 Violet",
                type: "square2",
                team: "violet",
                shape: { type: "rectangle", x:2055, y:2000, width: 185,  height: 50, color: "violet" },
                access:{ x:2147, y:1750, angle:90 }
            },
            {
                name: "Square 3 Violet",
                type: "square3",
                team: "violet",
                shape: { type: "rectangle", x:1870, y:2000, width: 185,  height: 50, color: "violet" },
                access:{ x:1962, y:1750, angle:90 }
            },
            
            // Square Shared
            {
                name: "Square Shared 1 Yellow",
                type: "squareShared1",
                team: "yellow",
                shape: { type: "rectangle", x:1130, y:2000, width: 185,  height: 25, color: "yellow" },
                access:{ x:1222, y:1750, angle:90 }
            },
            {
                name: "Square Shared 2 Yellow",
                type: "squareShared2",
                team: "yellow",
                shape: { type: "rectangle", x:1315, y:2000, width: 185,  height: 25, color: "yellow" },
                access:{ x:1407, y:1750, angle:90 }
            },
            {
                name: "Square Shared 3 Yellow",
                type: "squareShared3",
                team: "yellow",
                shape: { type: "rectangle", x:1500, y:2000, width: 185,  height: 25, color: "yellow" },
                access:{ x:1592, y:1750, angle:90 }
            },
            {
                name: "Square Shared 4 Yellow",
                type: "squareShared4",
                team: "yellow",
                shape: { type: "rectangle", x:1685, y:2000, width: 185,  height: 25, color: "yellow" },
                access:{ x:1777, y:1750, angle:90 }
            },
            {
                name: "Square Shared 4 Violet",
                type: "squareShared4",
                team: "violet",
                shape: { type: "rectangle", x:1130, y:2025, width: 185,  height: 25, color: "violet" },
                access:{ x:1222, y:1750, angle:90 }
            },
            {
                name: "Square Shared 3 Violet",
                type: "squareShared3",
                team: "violet",
                shape: { type: "rectangle", x:1315, y:2025, width: 185,  height: 25, color: "violet" },
                access:{ x:1407, y:1750, angle:90 }
            },
            {
                name: "Square Shared 2 Violet",
                type: "squareShared2",
                team: "violet",
                shape: { type: "rectangle", x:1500, y:2025, width: 185,  height: 25, color: "violet" },
                access:{ x:1592, y:1750, angle:90 }
            },
            {
                name: "Square Shared 1 Violet",
                type: "squareShared1",
                team: "violet",
                shape: { type: "rectangle", x:1685, y:2025, width: 185,  height: 25, color: "violet" },
                access:{ x:1777, y:1750, angle:90 }
            },

            // Gallery
            {
                name: "Gallery Yellow",
                type: "gallery",
                team: "yellow",
                shape: { type: "rectangle", x:450, y:0, width: 720,  height: 86, color: "yellow" },
                access:{ x:810, y:330, angle:-90 }
            },
            {
                name: "Gallery Violet",
                type: "gallery",
                team: "violet",
                shape: { type: "rectangle", x:1830, y:0, width: 720,  height: 86, color: "violet" },
                access:{ x:2190, y:330, angle:-90 }
            },

            // Site
            {
                name: "Site Yellow",
                type: "site",
                team: "yellow",
                shape: { type: "rectangle", x:800, y:1200, width: 350,  height: 350, color: "yellow" },
                access:{ x:975, y:1030, angle:90 }
            },
            {
                name: "Site Violet",
                type: "site",
                team: "violet",
                shape: { type: "rectangle", x:1850, y:1200, width: 350,  height: 350, color: "violet" },
                access:{ x:2025, y:1030, angle:90 }
            },

            //Samples Starting
            {
                name: "Sample Starting Top",
                type: "sampleStartingTop",
                team: "yellow",
                shape: { type: "circle", x:900, y:555, radius: 75, color: "blue" },
                access:{ x:/*770*/800, y:340, angle:-60 }
            },
            {
                name: "Sample Starting Top",
                type: "sampleStartingTop",
                team: "violet",
                shape: { type: "circle", x:2100, y:555, radius: 75, color: "blue" },
                access:{ x:/*2230*/2200, y:340, angle:-120 }
            },
            {
                name: "Sample Starting Middle",
                type: "sampleStartingMiddle",
                team: "yellow",
                shape: { type: "circle", x:830, y:675, radius: 75, color: "green" },
                access:{ x:580, y:675, angle:-120 }
            },
            {
                name: "Sample Starting Middle",
                type: "sampleStartingMiddle",
                team: "violet",
                shape: { type: "circle", x:2170, y:675, radius: 75, color: "green" },
                access:{ x:2420, y:675, angle:-60 }
            },
            {
                name: "Sample Starting Bottom",
                type: "sampleStartingBottom",
                team: "yellow",
                shape: { type: "circle", x:900, y:795, radius: 75, color: "red" },
                access:{ x:/*770*/800, y:1010, angle:60 }
            },
            {
                name: "Sample Starting Bottom",
                type: "sampleStartingBottom",
                team: "violet",
                shape: { type: "circle", x:2100, y:795, radius: 75, color: "red" },
                access:{ x:/*2230*/2200, y:1010, angle:120 }
            },

        ]
    }

}