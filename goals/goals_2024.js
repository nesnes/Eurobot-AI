'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultAccel=1.0; //m/s2 //0.9
        this.defaultDeccel=0.4; //m/s2 //0.4
        this.defaultSpeed=0.85; //m/s 0.7 //0.9
        this.moveSpeed  = 0.85; //m/s 0.7 //0.9
        
        this.defaultAccelAngle=240; //°/s2 //180
        this.defaultAngleSpeed = 70; //°/s
        
        this.defaultNearDist=20;//50mm
        this.defaultNearAngle=3;//10°
        
        this.rushAccel=6.0; //m/s2 0.9
        this.rushSpeed=1.3; //m/s 0.9
        this.rushAngleSpeed = 360; //°/s
        this.rushAccelAngle = 360; //°/s2 
        
        this.rushAccelNext=0.8; //m/s2 0.9
        this.rushSpeedNext=0.9; //m/s 0.9
        this.rushAngleSpeedNext = 420; //°/s
        this.rushAccelAngleNext = 180; //°/s2 
        
        this.preventDoorsGrab = false;
        
        let waitForStart = {
            name: "Wait for start",
            condition: ()=>{return true;}, 
            executionCount: 1,
            actions: [
                {
                    name: "Wait for start",
                    method: "waitForStart"
                },
                {
                    name: "Identify start zone",
                    method: "identifyStartZone"
                }
            ]
        };
        
        let startRush = ()=>{
            return {
                name: "Start Rush",
                condition: ()=>{
                    let hasRushed = this.app.robot.variables.startRushed.value;
                    let isTimeStarting = this.app.intelligence.currentTime <= 5000;
                    //let inMatchingStartZone = 900 < this.app.robot.x && this.app.robot.x < 2100; 
                    let endReached = this.app.robot.variables.endReached.value;
                    let result =  !hasRushed && isTimeStarting && !endReached;
                    if(result) this.app.robot.variables.startRushed.value = 1;
                    return result;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "start rush",
                        method: "startRush",
                        parameters:{
                            speed: 0.3,    //m/s
                            nearDist: 100, //mm
                            nearAngle: 6   //deg
                        }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        };
        
        
        
        let depositeInPlanter = (zoneTypes)=>{
            return {
                name: "Deposit in planter",
                condition: ()=>{
                    let hasPlants = this.app.robot.variables.armAC.value != ""
                                    || this.app.robot.variables.armAB.value != ""
                                    || this.app.robot.variables.armBC.value != "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasPlants;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit in Planter",
                        method: "depositInPlanter",
                        parameters:{ plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        
        let depositeInZone = (zoneTypes)=>{
            return {
                name: "Deposit in zone",
                condition: ()=>{
                    let hasPlants = this.app.robot.variables.armAC.value != ""
                                    || this.app.robot.variables.armAB.value != ""
                                    || this.app.robot.variables.armBC.value != "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasPlants;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit in Zone",
                        method: "depositInZone",
                        parameters:{ plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        
        let depositeDoorsInZone = (zoneTypes)=>{
            return {
                name: "Deposit doors in zone",
                condition: ()=>{
                    let hasPlants = this.app.robot.variables.doorsAC.value != ""
                                    || this.app.robot.variables.doorsAB.value != ""
                                    || this.app.robot.variables.doorsBC.value != "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasPlants;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit doors in Zone",
                        method: "depositDoorsInZone",
                        parameters:{ plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        
        let solarPanels = (zoneTypes, isReserved=false)=>{
            return {
                name: "Solar panels "+zoneTypes.toString(),
                condition: ()=>{
                    let hasArmFree = (this.app.robot.variables.armAC.value == "" && this.app.robot.variables.doorsAC.value == "")
                                    || (this.app.robot.variables.armAB.value == "" && this.app.robot.variables.doorsAB.value == "")
                                    || (this.app.robot.variables.armBC.value == "" && this.app.robot.variables.doorsBC.value == "");
                    
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-12*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    let isCloseToEndOfMatch = this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-18*1000;
                    
                    let panel4 = this.app.map.getComponentByName("Panel 4 Center Blue");
                    let panel5 = this.app.map.getComponentByName("Panel 5 Center");
                    let panel6 = this.app.map.getComponentByName("Panel 4 Center Yellow");
                    let historyScore = 0;
                    let panelCount = 0;
                    if (panel4) { panelCount++; historyScore += this.app.map.getHistoryAt(panel4.access.x, panel4.access.y).value; }
                    if (panel5) { panelCount++; historyScore += this.app.map.getHistoryAt(panel5.access.x, panel5.access.y).value; }
                    if (panel6) { panelCount++; historyScore += this.app.map.getHistoryAt(panel6.access.x, panel6.access.y).value; }
                    let ennemyAlreadyVisited = true;
                    if (panelCount>1) { ennemyAlreadyVisited = (historyScore/panelCount) > 25; }
                    this.app.logger.log("Solar panel visited", ennemyAlreadyVisited, historyScore, panelCount, isCloseToEndOfMatch)
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasArmFree && (isReserved || isCloseToEndOfMatch || ennemyAlreadyVisited);
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Rotate Solar Panel",
                        method: "solarPanels",
                        parameters:{ plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        let goGrabPlants = (zoneTypes)=>{
            return {
                name: "Grab plants ",
                condition: ()=>{
                    let hasArmFree =this.app.robot.variables.armAC.value == ""
                                    || this.app.robot.variables.armAB.value == ""
                                    || this.app.robot.variables.armBC.value == "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasArmFree;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Grab plant",
                        method: "goGrabPlants",
                        parameters:{ plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        let goStealZones = (zoneTypes)=>{
            return {
                name: "Steal zones",
                condition: ()=>{
                    let hasArmFree =this.app.robot.variables.armAC.value == ""
                                    || this.app.robot.variables.armAB.value == ""
                                    || this.app.robot.variables.armBC.value == "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasArmFree;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Steal zones",
                        method: "goGrabPlants",
                        parameters:{ opposit:true, plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        let goStealPlanter = (zoneTypes)=>{
            return {
                name: "Steal planter",
                condition: ()=>{
                    let hasArmFree =this.app.robot.variables.armAC.value == ""
                                    || this.app.robot.variables.armAB.value == ""
                                    || this.app.robot.variables.armBC.value == "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasArmFree;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Steal planter",
                        method: "goGrabPlants",
                        parameters:{ planter:true, opposit:true, plateTypes: zoneTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        
        let moveToSpecificEndZone = (zoneTypes)=> {
            return{
                name: "Move to specific End",
                condition: ()=>{
                    let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-10*1000);
                    let endReached = this.app.robot.variables.endReached.value;
                    return isEnd && !endReached;
                },                
                executionCount: 1,
                actions: [
                    { name: "Return to end zone", method: "returnToSpecificEndZone", parameters: {
                        zoneTypes:zoneTypes,
                        speed: 0.8,
                        angleSpeed: 90,
                        accelDist: 0.6
                    } },
                    // Store End reached
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
                ],
                //onError: [ { name:"Move to new end zone", method:"returnToEndZone", parameters:{ignoreSelected:true}}]
            }
        };
        
        let listNesnes = [
            waitForStart,
            
            // Rush to get N plants
            startRush(),
            
            // Attemp to grab remaining plants
            goGrabPlants(),
            goGrabPlants(),
            goGrabPlants(),
            
            // Prioritize doors deposit
            depositeDoorsInZone(),
            depositeInPlanter(),
            depositeInPlanter(),
            depositeDoorsInZone(),
            depositeDoorsInZone(),
            depositeDoorsInZone(),
            
            // Deposit in planters
            depositeInPlanter(),
            depositeInPlanter(),
            depositeInPlanter(),
            depositeInPlanter(),
            
            // Deposit in zones
            depositeInZone(),
            depositeInZone(),
            depositeInZone(),
            
            // Grab more plants
            //goGrabPlants(),
            //goGrabPlants(),
            
            // STEAL IN PLANTERS
            // !!!!!!!!!!!
            goStealPlanter(["planter"]),
            goStealPlanter(["planter"]),
            goStealPlanter(["planter"]),
            depositeInPlanter(),
            depositeInZone(),
            
            
            // Flip panels
            solarPanels(["panel_shared_access"]),
            solarPanels(["panel_color_access"], true),
            solarPanels(["panel_shared_access"]),
            solarPanels(["panel_color_access"], true),
            
            // Some more Steal
            goStealPlanter(["planter"]),
            goStealPlanter(["planter"]),
            
            // Grab and deposit eventual plants
            goGrabPlants(),
            goGrabPlants(),
            depositeInPlanter(),
            depositeInPlanter(),
            depositeInZone(),
            depositeInZone(),
            depositeDoorsInZone(),
            depositeDoorsInZone(),
            
            solarPanels(["panel_shared_access"]),
            
            goStealPlanter(["planter"]),
            goStealZones(["baseMiddle", "baseBottom"]),
            //goStealZones(["baseMiddle", "baseBottom"]),
            
            solarPanels(["panel_shared_access"]),
            
            moveToSpecificEndZone(["baseMiddle", "baseBottom"]),
            moveToSpecificEndZone(["baseMiddle", "baseBottom"]),
            moveToSpecificEndZone(["baseReserved"]),
            
            //moveTest
        ];
        
        this.list = listNesnes;
    }
}
