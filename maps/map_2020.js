'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2020.png"
        this.teams = ["yellow","blue"]
        this.components = [

            //Beacons
            /*{
                name: "Beacon Top Left",
                type: "beacon",
                team: "",
                isSolid: true,
                shape: { type: "circle", x:1400, y:750, radius: 28, color: "purple" }
            },
            {
                name: "Beacon Bottom Left",
                type: "beacon",
                team: "",
                isSolid: true,
                shape: { type: "circle", x:1400, y:1250, radius: 28, color: "purple" }
            },
            {
                name: "Beacon top right",
                type: "beacon",
                team: "",
                isSolid: true,
                shape: { type: "circle", x:1630, y:750, radius: 28, color: "purple" }
            },
            {
                name: "Beacon Bottom Right",
                type: "beacon",
                team: "",
                isSolid: true,
                shape: { type: "circle", x:1630, y:1250, radius: 28, color: "purple" }
            },*/

            //Borders
            {
                name: "Top Border",
                type: "boder",
                isSolid: true,
                shape: { type: "rectangle", x:0, y:-22, width: 3000,  height: 22, color: "grey" }
            },{
                name: "Left Border",
                type: "boder",
                isSolid: true,
                shape: { type: "rectangle", x:-22, y:0, width: 22,  height: 2000, color: "grey" }
            },{
                name: "Right Border",
                type: "boder",
                isSolid: true,
                shape: { type: "rectangle", x:3000, y:0, width: 22,  height: 2000, color: "grey" }
            },{
                name: "Bottom Border",
                type: "boder",
                isSolid: true,
                shape: { type: "rectangle", x:0, y:2000, width: 3000,  height: 22, color: "grey" }
            },

            //Lighthouse
            {
                name: "Lighthouse Blue",
                type: "lighthouse",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:0, y:-222, width: 450,  height: 200, color: "blue" },
                access:{ x:225, y:350, angle:-90 }
            },
            {
                name: "Lighthouse Yellow",
                type: "lighthouse",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:2550, y:-222, width: 450,  height: 200, color: "yellow" },
                access:{ x:2775, y:350, angle:-90 }
            },


            //Starting areas
            {
                name: "Starting Area",
                type: "startingArea",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:0, y:500, width: 400,  height: 600, color: "blue" },
                access:{ x:500, y:800, angle:180 }
            },{
                name: "Starting Area",
                type: "startingArea",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2600, y:500, width: 400,  height: 600, color: "yellow" },
                access:{ x:2500, y:800, angle:0 }
            },


            //Starting Fairway
            {
                name: "Starting Fairway North Green",
                type: "startingFairwayGreen",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:0, y:500, width: 400,  height: 30, color: "green" },
                access:{ x:400, y:590, angle:0 }
            },
            {
                name: "Starting Fairway South Red",
                type: "startingFairwayRed",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:0, y:1070, width: 400,  height: 30, color: "red" },
                access:{ x:400, y:1000, angle:0 }
            },
            {
                name: "Starting Fairway North Red",
                type: "startingFairwayRed",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2600, y:500, width: 400,  height: 30, color: "red" },
                access:{ x:2600, y:590, angle:180 }
            },
            {
                name: "Starting Fairway South Green",
                type: "startingFairwayGreen",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2600, y:1070, width: 400,  height: 30, color: "green" },
                access:{ x:2600, y:1000, angle:180 }
            },


            //Ending areas North
            {
                name: "Ending Area North",
                type: "endingAreaNorth",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:0, y:210, width: 290,  height: 290, color: "DarkSlateGrey" },
                access:{ x:175, y:610, angle:-90 }
            },
            {
                name: "Ending Area North",
                type: "endingAreaNorth",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2710, y:210, width: 290,  height: 290, color: "DarkSlateGrey" },
                access:{ x:2825, y:610, angle:-90 }
            },
            
            //Ending areas South
            {
                name: "Ending Area South",
                type: "endingAreaSouth",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:0, y:1100, width: 290,  height: 290, color: "LightSteelBlue" },
                access:{ x:175, y:995, angle:90 }
            },
            {
                name: "Ending Area South",
                type: "endingAreaSouth",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2710, y:1100, width: 290,  height: 290, color: "LightSteelBlue" },
                access:{ x:2825, y:995, angle:90 }
            },
            
            //Bottom Ports
            {
                name: "Bottom Port Blue",
                type: "bottomPort",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:1650, y:1700, width: 300,  height: 300, color: "blue" },
                access:{ x:1810, y:1450, angle:90 }
            },
            {
                name: "Bottom Port Yellow",
                type: "bottomPort",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:1050, y:1700, width: 300,  height: 300, color: "yellow" },
                access:{ x:1190, y:1450, angle:90 }
            },


            //Bottom Fairway
            {
                name: "Bottom Fairway Left",
                type: "bottomFairwayLeft",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:1650, y:1700, width: 100,  height: 300, color: "green" }
            },
            {
                name: "Bottom Fairway Right",
                type: "bottomFairwayRight",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:1850, y:1700, width: 100,  height: 300, color: "red" }
            },
            {
                name: "Bottom Fairway Left",
                type: "bottomFairwayLeft",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:1050, y:1700, width: 100,  height: 300, color: "green" }
            },
            {
                name: "Bottom Fairway Right",
                type: "bottomFairwayRight",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:1250, y:1700, width: 100,  height: 300, color: "red" }
            },
            
            //Port Borders
            {
                name: "Port Border Left",
                type: "portBorder",
                isSolid: true,
                shape: { type: "rectangle", x:889, y:1850, width: 22,  height: 150, color: "grey" }
            },
            {
                name: "Port Border Middle",
                type: "portBorder",
                isSolid: true,
                shape: { type: "rectangle", x:1489, y:1700, width: 22,  height: 300, color: "grey" }
            },
            {
                name: "Port Border Right",
                type: "portBorder",
                isSolid: true,
                shape: { type: "rectangle", x:2089, y:1850, width: 22,  height: 150, color: "grey" }
            },

            //Windsocks
            {
                name: "Windsock Side Blue",
                type: "windsockSide",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:130, y:2000, width: 60,  height: 60, color: "blue" },
                access:{ x:160, y:1700, angle:90 }
            },
            {
                name: "Windsock Middle Blue",
                type: "windsockMiddle",
                team: "blue",
                isSolid: false,
                shape: { type: "rectangle", x:540, y:2000, width: 60,  height: 60, color: "blue" },
                access:{ x:570, y:1700, angle:90 }
            },
            {
                name: "Windsock Side Yellow",
                type: "windsockSide",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2810, y:2000, width: 60,  height: 60, color: "yellow" },
                access:{ x:2840, y:1700, angle:90 }
            },
            {
                name: "Windsock Middle Yellow",
                type: "windsockMiddle",
                team: "yellow",
                isSolid: false,
                shape: { type: "rectangle", x:2410, y:2000, width: 60,  height: 60, color: "yellow" },
                access:{ x:2440, y:1700, angle:90 }
            },

            //Weathervane
            {
                name: "Weathervane blue",
                type: "weathervane",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "black" },
                access:{ x:1000, y:600, angle:-45 }
            },
            {
                name: "Weathervane yellow",
                type: "weathervane",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "black" },
                access:{ x:2000, y:600, angle:-135 }
            },

            //Weathervane  2
            {
                name: "Weathervane 2 blue",
                type: "weathervane2",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "black" },
                access:{ x:1250, y:600, angle:-60 }
            },
            {
                name: "Weathervane 2 yellow",
                type: "weathervane2",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "black" },
                access:{ x:1750, y:600, angle:-120 }
            },

            //Reefs
            {
                name: "Reef Blue",
                type: "teamReef",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:-134, y:1390, width: 134,  height: 420, color: "blue" }
            },
            {
                name: "Reef Yellow",
                type: "teamReef",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:3000, y:1390, width: 134,  height: 420, color: "yellow" }
            },
            {
                name: "Shared Reef Blue",
                type: "sharedReef",
                team: "blue",
                isSolid: true,
                shape: { type: "rectangle", x:640, y:-134, width: 420,  height: 134, color: "grey" },
                access:{ x:810, y:350, angle:-90 }
            },
            {
                name: "Shared Reef Yellow",
                type: "sharedReef",
                team: "yellow",
                isSolid: true,
                shape: { type: "rectangle", x:1940, y:-134, width: 420,  height: 134, color: "grey" },
                access:{ x:2190, y:350, angle:-90 }
            },

            //Buoys Starting North
            {
                name: "Buoy Starting North Blue",
                type: "buoyStartingNorth",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:300, y:400, radius: 36, color: "red" },
                access:{ x:350, y:550, angle:70 }
            },
            {
                name: "Buoy Starting North Yellow",
                type: "buoyStartingNorth",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2700, y:400, radius: 36, color: "green" },
                access:{ x:2650, y:550, angle:110 }
            },
            {
                name: "Buoy Starting Fairway North Blue",
                type: "buoyStartingFairwayNorth",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:450, y:510, radius: 36, color: "green" }
            },
            {
                name: "Buoy Starting Fairway North Yellow",
                type: "buoyStartingFairwayNorth",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2550, y:510, radius: 36, color: "red" }
            },

            //Buoys Starting South
            {
                name: "Buoy Starting South Blue",
                type: "buoyStartingSouth",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:300, y:1200, radius: 36, color: "green" },
                access:{ x:550, y:1450, angle:-125 }
            },
            {
                name: "Buoy Starting South Yellow",
                type: "buoyStartingSouth",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2700, y:1200, radius: 36, color: "red" },
                access:{ x:2450, y:1450, angle:-55 }
            },
            {
                name: "Buoy Starting Fairway South Blue",
                type: "buoyStartingFairwaySouth",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:450, y:1080, radius: 36, color: "red" }
            },
            {
                name: "Buoy Starting Fairway South Yellow",
                type: "buoyStartingFairwaySouth",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2550, y:1080, radius: 36, color: "green" }
            },

            //Buoys Bottom Port Blue
            {
                name: "Buoy Bottom Port Right Blue",
                type: "buoyBottomPortRight",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1995, y:1955, radius: 36, color: "green" }
            },
            {
                name: "Buoy Bottom Port Left Blue",
                type: "buoyBottomPortLeft",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1605, y:1955, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Right Blue",
                type: "buoyBottomPortFairwayRight",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1935, y:1650, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Left Blue",
                type: "buoyBottomPortFairwayLeft",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1665, y:1650, radius: 36, color: "green" }
            },

            //Buoys Bottom Port Yellow
            {
                name: "Buoy Bottom Port Right Yellow",
                type: "buoyBottomPortRight",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1395, y:1955, radius: 36, color: "green" }
            },
            {
                name: "Buoy Bottom Port Left Yellow",
                type: "buoyBottomPortLeft",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1005, y:1955, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Right Yellow",
                type: "buoyBottomPortFairwayRight",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1335, y:1650, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Left Yellow",
                type: "buoyBottomPortFairwayLeft",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1065, y:1650, radius: 36, color: "green" }
            },

            //Buoys Top
            {
                name: "Buoy Top Blue",
                type: "buoyTop",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:670, y:100, radius: 36, color: "red" },
                access:{ x:500, y:170, angle:-120 }
            },
            {
                name: "Buoy Top Yellow",
                type: "buoyTop",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2330, y:100, radius: 36, color: "green" },
                access:{ x:2500, y:170, angle:-60 }
            },

            //Buoys Middle Top
            {
                name: "Buoy Middle Top Blue",
                type: "buoyMiddleTop",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:950, y:400, radius: 36, color: "green" },
                access:{ x:1000, y:320, angle:-120 }
            },
            {
                name: "Buoy Middle Top Yellow",
                type: "buoyMiddleTop",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:2050, y:400, radius: 36, color: "red" },
                access:{ x:2000, y:320, angle:-60 }
            },

            //Buoys Middle bottom
            {
                name: "Buoy Middle Bottom Blue",
                type: "buoyMiddleBottom",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1100, y:800, radius: 36, color: "red" },
                access:{ x:800, y:875, angle:0 }
            },
            {
                name: "Buoy Middle Bottom Yellow",
                type: "buoyMiddleBottom",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1900, y:800, radius: 36, color: "green" },
                access:{ x:2200, y:875, angle:180 }
            },

            //Buoys bottom
            {
                name: "Buoy Bottom Blue",
                type: "buoyBottom",
                team: "blue",
                isSolid: false,
                shape: { type: "circle", x:1270, y:1200, radius: 36, color: "green" },
                access:{ x:1280, y:1000, angle:60 }
                
            },
            {
                name: "Buoy Bottom Yellow",
                type: "buoyBottom",
                team: "yellow",
                isSolid: false,
                shape: { type: "circle", x:1730, y:1200, radius: 36, color: "red" },
                access:{ x:1720, y:1000, angle:120 }
            },

        ]
    }

}