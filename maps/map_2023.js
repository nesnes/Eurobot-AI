'use strict';
delete require.cache[require.resolve('./map')]; //Delete require() cache
const Map = require('./map');

module.exports = class Map2020 extends Map{
    constructor(app) {
        super(app);

        this.width = 3000
        this.height = 2000
        this.background =  ""//"/images/fond2020.png"
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
            {
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
            },


            //Plates Top (protected)
            {
                name: "Plate Top Protected Blue",
                type: "plateProtected",
                team: "blue",
                shape: { type: "rectangle", x:0, y:1550, width: 450,  height: 450, color: "blue" },
                access:{ x:225, y:1475, angle:90 },
                avoidOffset: -85,
                startPosition: {x: 225, y: 1775, angle: 0, team: "blue"}
            },{
                name: "Plate Top protected Green",
                type: "plateProtected",
                team: "green",
                shape: { type: "rectangle", x:0, y:0, width: 450,  height: 450, color: "green" },
                access:{ x:225, y:525, angle:-90 },
                avoidOffset: -85,
                startPosition: {x: 225, y: 225, angle: 0, team: "green"}
            },


            //Plates Middle Top
            {
                name: "Plate Middle Top Blue",
                type: "plateMiddleTop",
                team: "blue",
                shape: { type: "rectangle", x:900, y:0, width: 450,  height: 450, color: "blue" },
                access:{ x:1125, y:525, angle:-90 },
                avoidOffset: -85,
                startPosition: {x: 1125, y: 225, angle: 90, team: "blue"}
            },{
                name: "Plate Middle Top Green",
                type: "plateMiddleTop",
                team: "green",
                shape: { type: "rectangle", x:900, y:1550, width: 450,  height: 450, color: "green" },
                access:{ x:1125, y:1475, angle:90 },
                avoidOffset: -85,
                startPosition: {x: 1125, y: 1775, angle: -90, team: "green"}
            },

            //Plates Middle Bottom
            {
                name: "Plate Middle Bottom Blue",
                type: "plateMiddleBottom",
                team: "blue",
                shape: { type: "rectangle", x:1650, y:1550, width: 450,  height: 450, color: "blue" },
                access:{ x:1875, y:1475, angle:90 },
                avoidOffset: -85,
                startPosition: {x: 1875, y: 1775, angle: -90, team: "blue"}
            },{
                name: "Plate Middle Bottom Green",
                type: "plateMiddleBottom",
                team: "green",
                shape: { type: "rectangle", x:1650, y:0, width: 450,  height: 450, color: "green" },
                access:{ x:1875, y:525, angle:-90 },
                avoidOffset: -85,
                startPosition: {x: 1875, y: 225, angle: 90, team: "green"}
            },

            //Plates Bottom Side
            {
                name: "Plate Bottom Side Blue",
                type: "plateBottomSide",
                team: "blue",
                shape: { type: "rectangle", x:2550, y:0, width: 450,  height: 450, color: "blue" },
                access:{ x:2475, y:225, angle:0 },
                avoidOffset: -85,
                startPosition: {x: 2775, y: 225, angle:180, team: "blue"}
            },{
                name: "Plate Bottom Side Green",
                type: "plateBottomSide",
                team: "green",
                shape: { type: "rectangle", x:2550, y:1550, width: 450,  height: 450, color: "green" },
                access:{ x:2475, y:1775, angle:0 },
                avoidOffset: -85,
                startPosition: {x: 2775, y: 1775, angle: 180, team: "green"}
            },

            //Plates Bottom
            {
                name: "Plate Bottom Blue",
                type: "plateBottom",
                team: "blue",
                shape: { type: "rectangle", x:2550, y:1050, width: 450,  height: 450, color: "blue" },
                access:{ x:2475, y:1275, angle:0 },
                avoidOffset: -85,
                startPosition: {x: 2775, y: 1275, angle:180, team: "blue"}
            },{
                name: "Plate Bottom Green",
                type: "plateBottom",
                team: "green",
                shape: { type: "rectangle", x:2550, y:500, width: 450,  height: 450, color: "green" },
                access:{ x:2475, y:725, angle:0 },
                avoidOffset: -85,
                startPosition: {x: 2775, y: 725, angle:180, team: "green"}
            },

            //Cherry Top
            {
                name: "Cherry Top",
                type: "cherryTop",
                shape: { type: "rectangle", x:0, y:985, width: 300,  height: 30, color: "red" },
                access:{ x:525, y:1000, angle:180 },
                avoidOffset: 50
            },

            //Cherry Middle
            {
                name: "Cherry Middle Green",
                type: "cherryMiddle",
                shape: { type: "rectangle", x:1350, y:0, width: 300,  height: 30, color: "red" },
                access:{ x:1500, y:300, angle:-90 },
                avoidOffset: 50
            },
            {
                name: "Cherry Middle Blue",
                type: "cherryMiddle",
                shape: { type: "rectangle", x:1350, y:1970, width: 300,  height: 30, color: "red" },
                access:{ x:1500, y:1700, angle:90 },
                avoidOffset: 50
            },

            //Cherry Bottom
            {
                name: "Cherry Bottom",
                type: "cherryBottom",
                shape: { type: "rectangle", x:2700, y:985, width: 300,  height: 30, color: "red" },
                access:{ x:2475, y:1000, angle:0 },
                avoidOffset: 50
            },
            

            //Cake Top
            {
                name: "Cake Top Pink Blue",
                type: "cakePink",
                shape: { type: "circle", x:575, y:1775, radius: 60, color: "pink" },
                access:{ x:575, y:1500, angle:90 }
            },
            {
                name: "Cake Top Pink Green",
                type: "cakePink",
                shape: { type: "circle", x:575, y:225, radius: 60, color: "pink" },
                access:{ x:575, y:500, angle:-90 }
            },
            {
                name: "Cake Top Yellow Blue",
                type: "cakeYellow",
                shape: { type: "circle", x:775, y:1775, radius: 60, color: "yellow" },
                access:{ x:775, y:1500, angle:90 }
            },
            {
                name: "Cake Top Yellow Green",
                type: "cakeYellow",
                shape: { type: "circle", x:775, y:225, radius: 60, color: "yellow" },
                access:{ x:775, y:500, angle:-90 }
            },
            {
                name: "Cake Top Brown Blue",
                type: "cakeBrown",
                shape: { type: "circle", x:1125, y:1275, radius: 60, color: "brown" },
                access:{ x:1125, y:1025, angle:90 },
                otherAccess: [
                    { x:1375, y:1275, angle:-180 },
                    { x:875, y:1275, angle:0 },
                    { x:1125, y:1475, angle:-90 }
                ]
            },
            {
                name: "Cake Top Brown Green",
                type: "cakeBrown",
                shape: { type: "circle", x:1125, y:725, radius: 60, color: "brown" },
                access:{ x:1125, y:975, angle:-90 },
                otherAccess: [
                    { x:1375, y:725, angle:-180 },
                    { x:875, y:725, angle:0 },
                    { x:1125, y:525, angle:90 }
                ]
            },
            

            //Cake Bottom
            {
                name: "Cake Bottom Pink Blue",
                type: "cakePink",
                shape: { type: "circle", x:2425, y:1775, radius: 60, color: "pink" },
                access:{ x:2425, y:1500, angle:90 }
            },
            {
                name: "Cake Bottom Pink Green",
                type: "cakePink",
                shape: { type: "circle", x:2425, y:225, radius: 60, color: "pink" },
                access:{ x:2425, y:500, angle:-90 }
            },
            {
                name: "Cake Bottom Yellow Blue",
                type: "cakeYellow",
                shape: { type: "circle", x:2225, y:1775, radius: 60, color: "yellow" },
                access:{ x:2225, y:1500, angle:90 }
            },
            {
                name: "Cake Bottom Yellow Green",
                type: "cakeYellow",
                shape: { type: "circle", x:2225, y:225, radius: 60, color: "yellow" },
                access:{ x:2225, y:500, angle:-90 }
            },
            {
                name: "Cake Bottom Brown Blue",
                type: "cakeBrown",
                shape: { type: "circle", x:1875, y:1275, radius: 60, color: "brown" },
                access:{ x:1875, y:1025, angle:90 },
                otherAccess: [
                    { x:2125, y:1275, angle:-180 },
                    { x:1625, y:1275, angle:0 },
                    { x:1875, y:1475, angle:-90 }
                ]
            },
            {
                name: "Cake Bottom Brown Green",
                type: "cakeBrown",
                shape: { type: "circle", x:1875, y:725, radius: 60, color: "brown" },
                access:{ x:1875, y:975, angle:-90 },
                otherAccess: [
                    { x:2125, y:725, angle:-180 },
                    { x:1625, y:725, angle:0 },
                    { x:1875, y:525, angle:90 }
                ]
            },
            

        ]
    }

}