'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultAccel=0.7; //m/s2 1.0
        this.defaultDeccel=0.5; //m/s2 0.4
        this.defaultSpeed=0.55; //m/s 0.85
        this.moveSpeed  = 0.55; //m/s 0.85
        
        this.defaultAccelAngle=240; //°/s2 //240
        this.defaultAngleSpeed = 70; //°/s 70
        
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

        let depositStartFlag = {
            name: "Deposit start flag ",
            condition: ()=>{return true;}, 
            executionCount: 1,
            actions: [
                {
                    name: "Deposit",
                    method: "depositFlag",
                    parameters: {}
                }
            ]
        };
        
        let depositeInBuild = (targetTypes)=>{
            return {
                name: "Deposit in planter",
                condition: ()=>{
                    let hasElements = this.app.robot.variables.armCC.value != ""
                                    || this.app.robot.variables.armC0.value != ""
                                    || this.app.robot.variables.armC1.value != ""
                                    || this.app.robot.variables.armC2.value != ""
                                    || this.app.robot.variables.armC3.value != ""
                                    || this.app.robot.variables.armAA.value != ""
                                    || this.app.robot.variables.armA0.value != ""
                                    || this.app.robot.variables.armA1.value != ""
                                    || this.app.robot.variables.armA2.value != ""
                                    || this.app.robot.variables.armA3.value != "";
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && hasElements;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Deposit in Build zone",
                        method: "depositInBuildZone",
                        parameters:{ targetTypes: targetTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    }
                ],
                onError: [ /*{ name:"pack arms", method:"setArmsPacked", parameters:{}}*/]
            };
        }
        
        let goGrabElements = (targetTypes)=>{
            return {
                name: "Grab elements ",
                condition: ()=>{
                    let hasElements = this.app.robot.variables.armCC.value != ""
                            || this.app.robot.variables.armC0.value != ""
                            || this.app.robot.variables.armC1.value != ""
                            || this.app.robot.variables.armC2.value != ""
                            || this.app.robot.variables.armC3.value != ""
                            || this.app.robot.variables.armAA.value != ""
                            || this.app.robot.variables.armA0.value != ""
                            || this.app.robot.variables.armA1.value != ""
                            || this.app.robot.variables.armA2.value != ""
                            || this.app.robot.variables.armA3.value != "";
                    //let hasMuchTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-75*1000;
                    let hasSomeTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    
                    //let canDepositAndBuild = hasAllCakes && hasMuchTimeLeft;
                    //let canDepositRandom = hasCakes && (preventBuild || !hasMuchTimeLeft) && hasSomeTimeLeft;
                    return !endReached && hasSomeTimeLeft && !hasElements;
                },                
                executionCount: 0,
                actions: [
                    {
                        name: "Go grab elements",
                        method: "goGrabElements",
                        parameters:{ 
                            armList :["CC","AA", "C1", "A1"],
                            elementTypes: targetTypes, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
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
            //depositStartFlag,
            goGrabElements(["element"]),
            depositeInBuild(["buildBottom", "buildMiddle", "buildBottomSide"]),
            moveToSpecificEndZone(["buildReserved"])
        ];
        
        this.list = listNesnes;
    }
}
