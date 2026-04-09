'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultAccel=2;//2;//0.7; //m/s2 1.0
        this.defaultDeccel=0.5; //m/s2 0.5
        this.defaultSpeed=0.60;//0.55; //m/s 0.85
        this.moveSpeed  = 0.60;//0.6;//0.55; //m/s 0.85

        this.endSpeed = 0.6; //0.7
        this.endAccelDist = 2; //0.6
        this.endAngleSpeed = 90;

        
        this.defaultAccelAngle=240; //°/s2 //240
        this.defaultAngleSpeed = 90; //°/s 70
        
        this.defaultNearDist=20;//50mm
        this.defaultNearAngle=3;//10°
        
        this.rushAccel=2; //m/s2 0.9
        this.rushSpeed=0.5; //m/s 0.5
        this.rushAccelAngle = 240; //°/s2 
        this.rushAngleSpeed = 90; //°/s
        
        this.rushAccelNext=0.8; //m/s2 0.9
        this.rushSpeedNext=0.5; //m/s 0.9
        this.rushAngleSpeedNext = 240; //°/s
        this.rushAccelAngleNext = 90; //°/s2 
        
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

        let depositStartFlag = {
            name: "Deposit start flag ",
            condition: ()=>{
                let isStartZoneCompatible = this.app.robot.variables.startZone.value.includes("Build Bottom"); 
                return isStartZoneCompatible;
            }, 
            executionCount: 1,
            actions: [
                {
                    name: "Deposit",
                    method: "depositFlag",
                    parameters: {}
                }
            ]
        };
        
        let depositeInBuild = (componentTypes, stageCount=0)=>{
            return {
                name: "Deposit in build zone",
                condition: ()=>{
                    let areClampsOccupied = this.app.robot.variables["clampFAC"].value != ""
                                         || this.app.robot.variables["clampFCC"].value != ""
                                         || this.app.robot.variables["clampAFC"].value != ""
                                         || this.app.robot.variables["clampCFC"].value != ""
                                         || this.app.robot.variables["clampAS4"].value != ""
                                         || this.app.robot.variables["clampAS5"].value != ""
                                         || this.app.robot.variables["clampCS4"].value != ""
                                         || this.app.robot.variables["clampCS5"].value != "";
                    let isFront1Stage = (this.app.robot.variables["clampFAC"].value != "" && this.app.robot.variables["clampFCC"].value != "")
                                     || (this.app.robot.variables["clampAS4"].value != "" && this.app.robot.variables["clampCS4"].value != "");;
                    let isFront2Stage = (this.app.robot.variables["clampAFC"].value != ""
                                        && this.app.robot.variables["clampCFC"].value != ""
                                        && this.app.robot.variables["clampAFC"].value != ""
                                        && this.app.robot.variables["clampCFC"].value != "")
                                        ||
                                        (this.app.robot.variables["clampAS4"].value != ""
                                        && this.app.robot.variables["clampAS5"].value != ""
                                        && this.app.robot.variables["clampCS4"].value != ""
                                        && this.app.robot.variables["clampCS5"].value != "");
                    let isStagePossible = (stageCount==0 && areClampsOccupied)
                                       || (stageCount==1 && isFront1Stage)
                                       || (stageCount==2 && isFront1Stage && isFront2Stage)
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && (isStagePossible || areClampsOccupied);
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit in Build zone",
                        method: "depositInBuildZone",
                        parameters:{ componentTypes: componentTypes, stageCount: stageCount, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: []// [{ name:"pack arms", method:"setArmsPacked", parameters:{}}]
            };
        }
        
        let startRush = (tag="")=>{
            let opposit = this.app.parameters.modifier1;
            return {
                name: "Rush Grab elements ",
                condition: ()=>{
                    let hasRushed = this.app.robot.variables.startRushed.value;
                    this.app.robot.variables.startRushed.value = true;
                    let isTimeStarting = this.app.intelligence.currentTime <= 5000;
                    let hasElementFront =  this.app.robot.variables.clampAFC.value != ""
                                        || this.app.robot.variables.clampFAC.value != ""
                                        || this.app.robot.variables.clampFCC.value != ""
                                        || this.app.robot.variables.clampCFC.value != "";
                    let hasElementBack  =  this.app.robot.variables.clampAS4.value != ""
                                        || this.app.robot.variables.clampAS5.value != ""
                                        || this.app.robot.variables.clampCS4.value != ""
                                        || this.app.robot.variables.clampCS5.value != "";
                    let hasSideFree = !hasElementFront || !hasElementBack;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasSideFree && !hasRushed && isTimeStarting;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Go grab center",
                        method: "rushGrab",
                        parameters:{ 
                            side: "front",
                            opposit: opposit,
                            accessTag: tag,
                            componentTypes: ["element"], speed: this.rushSpeed, accelDist: this.rushAccel, angleSpeed: this.rushAngleSpeed, accelAngle: this.rushAccelAngle }
                    },{
                        name: "Deposit in Build zone",
                        method: "depositInBuildZone",
                        parameters:{ side:"front", componentTypes: opposit?["buildMiddle"]:["buildBottom"], speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    {
                        name: "Go grab bottom build",
                        method: "rushGrab",
                        parameters:{ 
                            side: "front",
                            earlyDeploy: true,
                            opposit: opposit,
                            accessTag: tag,
                            componentTypes: ["elementBuildBottom"], speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },{
                        name: "Deposit in Build zone",
                        method: "depositInBuildZone",
                        parameters:{ side:"front", componentTypes: opposit?["buildMiddle"]:["buildBottomCenter"], speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        let goGrabElements = (componentTypes, side="", earlyDeploy=false)=>{
            let opposit = this.app.parameters.modifier1;
            return {
                name: "Grab elements ",
                condition: ()=>{
                    let hasElementFront =  this.app.robot.variables.clampAFC.value != ""
                                        || this.app.robot.variables.clampFAC.value != ""
                                        || this.app.robot.variables.clampFCC.value != ""
                                        || this.app.robot.variables.clampCFC.value != "";
                    let hasElementBack  =  this.app.robot.variables.clampAS4.value != ""
                                        || this.app.robot.variables.clampAS5.value != ""
                                        || this.app.robot.variables.clampCS4.value != ""
                                        || this.app.robot.variables.clampCS5.value != "";
                    let hasSideFree = !hasElementFront || !hasElementBack;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasSideFree;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Go grab elements",
                        method: "goGrabElements",
                        parameters:{ 
                            side: side,
                            earlyDeploy,
                            componentTypes: componentTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }

        let moveToSpecificEndZone = (componentTypes)=> {
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
                        componentTypes: componentTypes,
                        speed: this.endSpeed,
                        angleSpeed: this.endAngleSpeed,
                        accelDist: this.endAccelDist
                    } },
                    // Store End reached
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
                ],
                //onError: [ { name:"Move to new end zone", method:"returnToEndZone", parameters:{ignoreSelected:true}}]
            }
        };
        
        
        let listNesnes = [
            waitForStart,
            depositStartFlag,
            // sample grab goGrabElements(["element", "elementReserved", "elementPAMI", "elementTight"], "front"),
            // Grab center element
            startRush("bottom"),
            
            goGrabElements(["element"], "front"),
            depositeInBuild(["buildBottom"]),
            goGrabElements(["elementBuildBottom"], "front"),
            depositeInBuild(["buildBottomCenter"]),
            goGrabElements(["elementTight"]),
            depositeInBuild(["buildBottom"]),

            // grab elem from any side
            goGrabElements(["element", "elementBuildBottom",/*"elementReserved",*/ /*"elementPAMI",*/ "elementTight"]),
            goGrabElements(["element", "elementBuildBottom",/*"elementReserved",*/ /*"elementPAMI",*/ "elementTight"]),
            goGrabElements(["element", "elementBuildBottom",/*"elementReserved",*/ /*"elementPAMI",*/ "elementTight"]),

            // Deposit everything
            depositeInBuild(["buildBottom"]),
            depositeInBuild(["buildBottom", "buildBottomCenter", "buildMiddle", "buildBottomSide"]),

            goGrabElements(["elementBuildBottom"]),
            goGrabElements(["elementTight"]),
            depositeInBuild(["buildBottom", "buildBottomCenter", "buildMiddle", "buildBottomSide"]),

            moveToSpecificEndZone(["buildReserved"])
        ];
        
        this.list = listNesnes;
    }
}
