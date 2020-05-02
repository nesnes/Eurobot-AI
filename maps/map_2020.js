'use strict';
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  "/images/fond2020.png"
        this.components = [

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

            //Lighthouse
            {
                name: "Lighthouse Blue",
                type: "lighthouse",
                team: "blue",
                shape: { type: "rectangle", x:0, y:-222, width: 450,  height: 200, color: "blue" }
            },
            {
                name: "Lighthouse Yellow",
                type: "lighthouse",
                team: "yellow",
                shape: { type: "rectangle", x:2550, y:-222, width: 450,  height: 200, color: "yellow" }
            },


            //Starting areas
            {
                name: "Starting Area",
                type: "startingArea",
                team: "blue",
                shape: { type: "rectangle", x:0, y:500, width: 400,  height: 600, color: "blue" }
            },{
                name: "Starting Area",
                type: "startingArea",
                team: "yellow",
                shape: { type: "rectangle", x:2600, y:500, width: 400,  height: 600, color: "yellow" }
            },


            //Ending areas North
            {
                name: "Ending Area North",
                type: "endingAreaNorth",
                team: "blue",
                shape: { type: "rectangle", x:0, y:100, width: 400,  height: 400, color: "DarkSlateGrey" }
            },
            {
                name: "Ending Area North",
                type: "endingAreaNorth",
                team: "yellow",
                shape: { type: "rectangle", x:2600, y:100, width: 400,  height: 400, color: "DarkSlateGrey" }
            },
            
            //Ending areas South
            {
                name: "Ending Area South",
                type: "endingAreaSouth",
                team: "blue",
                shape: { type: "rectangle", x:0, y:1100, width: 400,  height: 400, color: "LightSteelBlue" }
            },
            {
                name: "Ending Area South",
                type: "endingAreaSouth",
                team: "yellow",
                shape: { type: "rectangle", x:2600, y:1100, width: 400,  height: 400, color: "LightSteelBlue" }
            },
            
            //Bottom Ports
            {
                name: "Bottom Port Blue",
                type: "bottomPort",
                team: "blue",
                shape: { type: "rectangle", x:1650, y:1700, width: 300,  height: 300, color: "blue" }
            },
            {
                name: "Bottom Port Yellow",
                type: "bottomPort",
                team: "yellow",
                shape: { type: "rectangle", x:1050, y:1700, width: 300,  height: 300, color: "yellow" }
            },
            
            //Port Borders
            {
                name: "Port Border Left",
                type: "portBorder",
                shape: { type: "rectangle", x:889, y:1850, width: 22,  height: 150, color: "grey" }
            },
            {
                name: "Port Border Middle",
                type: "portBorder",
                shape: { type: "rectangle", x:1489, y:1700, width: 22,  height: 300, color: "grey" }
            },
            {
                name: "Port Border Right",
                type: "portBorder",
                shape: { type: "rectangle", x:2089, y:1850, width: 22,  height: 150, color: "grey" }
            },

            //Windsocks
            {
                name: "Windsock Side Blue",
                type: "windsockSide",
                team: "blue",
                shape: { type: "rectangle", x:200, y:2000, width: 60,  height: 60, color: "blue" }
            },
            {
                name: "Windsock Middle Blue",
                type: "windsockMiddle",
                team: "blue",
                shape: { type: "rectangle", x:605, y:2000, width: 60,  height: 60, color: "blue" }
            },
            {
                name: "Windsock Side Yellow",
                type: "windsockSide",
                team: "yellow",
                shape: { type: "rectangle", x:2740, y:2000, width: 60,  height: 60, color: "yellow" }
            },
            {
                name: "Windsock Middle Yellow",
                type: "windsockMiddle",
                team: "yellow",
                shape: { type: "rectangle", x:2335, y:2000, width: 60,  height: 60, color: "yellow" }
            },

            //Weathervane
            {
                name: "Weathervane",
                type: "weathervane",
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "black" }
            },

            //Reefs
            {
                name: "Reef Blue",
                type: "teamReaf",
                team: "blue",
                shape: { type: "rectangle", x:-134, y:1390, width: 134,  height: 420, color: "blue" }
            },
            {
                name: "Reef Yellow",
                type: "teamReaf",
                team: "yellow",
                shape: { type: "rectangle", x:3000, y:1390, width: 134,  height: 420, color: "yellow" }
            },
            {
                name: "Shared Reef Blue",
                type: "sharedReaf",
                team: "blue",
                shape: { type: "rectangle", x:640, y:-134, width: 420,  height: 134, color: "grey" }
            },
            {
                name: "Shared Reef Yellow",
                type: "sharedReaf",
                team: "yellow",
                shape: { type: "rectangle", x:1940, y:-134, width: 420,  height: 134, color: "grey" }
            },

            //Buoys Starting North
            {
                name: "Buoy Starting North Blue",
                type: "buoyStartingNorth",
                team: "blue",
                shape: { type: "circle", x:300, y:400, radius: 36, color: "red" }
            },
            {
                name: "Buoy Starting North Yellow",
                type: "buoyStartingNorth",
                team: "yellow",
                shape: { type: "circle", x:2700, y:400, radius: 36, color: "green" }
            },
            {
                name: "Buoy Starting Fairway North Blue",
                type: "buoyStartingFairwayNorth",
                team: "blue",
                shape: { type: "circle", x:450, y:510, radius: 36, color: "green" }
            },
            {
                name: "Buoy Starting Fairway North Yellow",
                type: "buoyStartingFairwayNorth",
                team: "yellow",
                shape: { type: "circle", x:2550, y:510, radius: 36, color: "red" }
            },

            //Buoys Starting South
            {
                name: "Buoy Starting South Blue",
                type: "buoyStartingSouth",
                team: "blue",
                shape: { type: "circle", x:300, y:1200, radius: 36, color: "green" }
            },
            {
                name: "Buoy Starting South Yellow",
                type: "buoyStartingSouth",
                team: "yellow",
                shape: { type: "circle", x:2700, y:1200, radius: 36, color: "red" }
            },
            {
                name: "Buoy Starting Fairway South Blue",
                type: "buoyStartingFairwaySouth",
                team: "blue",
                shape: { type: "circle", x:450, y:1080, radius: 36, color: "red" }
            },
            {
                name: "Buoy Starting Fairway South Yellow",
                type: "buoyStartingFairwaySouth",
                team: "yellow",
                shape: { type: "circle", x:2550, y:1080, radius: 36, color: "green" }
            },

            //Buoys Bottom Port Blue
            {
                name: "Buoy Bottom Port Right Blue",
                type: "buoyBottomPortRight",
                team: "blue",
                shape: { type: "circle", x:1995, y:1955, radius: 36, color: "green" }
            },
            {
                name: "Buoy Bottom Port Left Blue",
                type: "buoyBottomPortLeft",
                team: "blue",
                shape: { type: "circle", x:1605, y:1955, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Right Blue",
                type: "buoyBottomPortFairwayRight",
                team: "blue",
                shape: { type: "circle", x:1935, y:1650, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Left Blue",
                type: "buoyBottomPortFairwayLeft",
                team: "blue",
                shape: { type: "circle", x:1665, y:1650, radius: 36, color: "green" }
            },

            //Buoys Bottom Port Yellow
            {
                name: "Buoy Bottom Port Right Yellow",
                type: "buoyBottomPortRight",
                team: "yellow",
                shape: { type: "circle", x:1395, y:1955, radius: 36, color: "green" }
            },
            {
                name: "Buoy Bottom Port Left Yellow",
                type: "buoyBottomPortLeft",
                team: "yellow",
                shape: { type: "circle", x:1005, y:1955, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Right Yellow",
                type: "buoyBottomPortFairwayRight",
                team: "yellow",
                shape: { type: "circle", x:1335, y:1650, radius: 36, color: "red" }
            },
            {
                name: "Buoy Bottom Port Fairway Left Yellow",
                type: "buoyBottomPortFairwayLeft",
                team: "yellow",
                shape: { type: "circle", x:1065, y:1650, radius: 36, color: "green" }
            },

            //Buoys Middle Top
            {
                name: "Buoy Top Blue",
                type: "buoyTop",
                team: "blue",
                shape: { type: "circle", x:670, y:100, radius: 36, color: "red" }
            },
            {
                name: "Buoy Top Yellow",
                type: "buoyTop",
                team: "yellow",
                shape: { type: "circle", x:2330, y:100, radius: 36, color: "green" }
            },

            //Buoys Middle Top
            {
                name: "Buoy Middle Top Blue",
                type: "buoyMiddleTop",
                team: "blue",
                shape: { type: "circle", x:950, y:400, radius: 36, color: "green" }
            },
            {
                name: "Buoy Middle Top Yellow",
                type: "buoyMiddleTop",
                team: "yellow",
                shape: { type: "circle", x:2050, y:400, radius: 36, color: "red" }
            },

            //Buoys Middle Top
            {
                name: "Buoy Middle Bottom Blue",
                type: "buoyMiddleBottom",
                team: "blue",
                shape: { type: "circle", x:1100, y:800, radius: 36, color: "red" }
            },
            {
                name: "Buoy Middle Bottom Yellow",
                type: "buoyMiddleBottom",
                team: "yellow",
                shape: { type: "circle", x:1900, y:800, radius: 36, color: "green" }
            },

            //Buoys Middle Top
            {
                name: "Buoy Bottom Blue",
                type: "buoyBottom",
                team: "blue",
                shape: { type: "circle", x:1270, y:1200, radius: 36, color: "green" }
            },
            {
                name: "Buoy Bottom Yellow",
                type: "buoyBottom",
                team: "yellow",
                shape: { type: "circle", x:1730, y:1200, radius: 36, color: "red" }
            },

        ]
    }

}