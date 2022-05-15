'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.6; //m/s 0.6
        this.moveSpeed = 0.5; //m/s 0.4
        this.defaultNearDist=50;//50mm
        this.defaultNearAngle=10;//10°
        
        let waitForStart = {
            name: "Wait for start",
            condition: ()=>{return true;}, 
            executionCount: 1,
            actions: [
                {
                    name: "Wait for start",
                    method: "waitForStart"
                },
                { name: "Experiment deposit Score", method: "addScore", parameters:{ score: 2 } },
                { name: "Artifact deposit Score", method: "addScore", parameters:{ score: 2 } },
                { name: "Score secondaire", method: "addScore", parameters:{ score: 45 } },
            ]
        };
        
        let replicaAndArtifactFromShed = {
            name: "Replica and Artifact from Shed",
            condition: ()=>{
                let hasReplica = ( this.app.robot.team=="yellow" && this.app.robot.variables.armBC.value == "replica")
                              || ( this.app.robot.team=="violet" && this.app.robot.variables.armAB.value == "replica");
                let hasArmFree = this.app.robot.variables.armAC.value == "";
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasReplica && hasArmFree && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                // Move to shed
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "artifact", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Arm
                { name: "Open arm 1/2", method: "setArmUH", parameters:{ name:"ACG", duration: 250, wait: true } },
                { name: "Open arm 2/2", method: "setArmPGA", parameters:{ name:"ACG", duration: 250, wait: false } },
                // Forward
                { name: "forward",  method: "moveForward", parameters:{ distance:200, speed: this.defaultSpeed } },
                // Grab artifact
                { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 255 } },
                { name: "Grab artifact", method: "setArmGA", parameters:{ name:"ACG", duration: 0, wait: false } },
                { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"artifact" } },
                { name: "score", method: "addScore", parameters:{ score: 5 } },
                { name: "Lift artifact", method: "setArmPGA", parameters:{ name:"ACG", duration: 0, wait: false } },
                // Prepare replica arm 1/2
                { team:"yellow", name: "Replica arm 1/2", method: "setArmUH", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Replica arm 1/2", method: "setArmUH", parameters:{ name:"ABG", duration: 0, wait: false } },
                // Move backward
                { name: "backward",  method: "moveBackward", parameters:{ distance:150, speed: this.defaultSpeed } },
                { name: "Artifact storage position", method: "setArmAS", parameters:{ name:"ACG", duration: 250, wait: false } },
                // Prepare replica arm 2/2
                { team:"yellow", name: "Replica arm 2/2", method: "setArmPGA", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Replica arm 2/2", method: "setArmPGA", parameters:{ name:"ABG", duration: 0, wait: false } },
                // Reorient for replica
                { team:"yellow", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:15, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:165, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                // Forward
                { team:"yellow", name: "Forward",  method: "moveAtAngle", parameters:{ angle:135, distance:150, speed: this.defaultSpeed } },
                { team:"violet", name: "Forward",  method: "moveAtAngle", parameters:{ angle:-135, distance:150, speed: this.defaultSpeed } },
                // Deposit replica
                { team:"yellow", name: "Deposit replica", method: "setArmGA", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Deposit replica", method: "setArmGA", parameters:{ name:"ABG", duration: 0, wait: false } },
                { team:"yellow", name: "Pump off", method: "setPump", parameters:{ name:"BCP", value: 0 } },
                { team:"violet", name: "Pump off", method: "setPump", parameters:{ name:"ABP", value: 0 } },
                { name:"Wait", method: "sleep", parameters:{ duration:600 } },
                { team:"yellow", name:"Store in variable", method: "setVariable", parameters:{ name:"armBC", value:"" } },
                { team:"violet", name:"Store in variable", method: "setVariable", parameters:{ name:"armAB", value:"" } },
                { name:"score", method: "addScore", parameters:{ score: 10 } },
                { team:"yellow", name: "Lift arm", method: "setArmPGA", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Lift arm", method: "setArmPGA", parameters:{ name:"ABG", duration: 0, wait: false } },
                // Back
                { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:-45, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:45, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:"BCG", duration: 500, wait: false } },
                { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:"ABG", duration: 500, wait: false } },
            ]
        };
        
        let depositArtifactInGallery = {
            name: "Deposit Artifact in Experiment",
            condition: ()=>{
                let hasArtifact = this.app.robot.variables.armAC.value == "artifact";
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasArtifact && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                // Move to experiment
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "experiment", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Arm
                { name: "Open arm 1/2", method: "setArmPPGA", parameters:{ name:"ACG", duration: 350, wait: true } },
                { name: "Open arm 2/2", method: "setArmPGA", parameters:{ name:"ACG", duration: 250, wait: false } },
                // Forward
                { name: "Reposition Y forward",  method: "moveRepositionning", parameters:{ moveAngle:-90, newY: 110, newAngle: -90, distance:350, speed: this.moveSpeed } },
                // Grab artifact
                { name: "Deposit artifact", method: "setArmGA", parameters:{ name:"ACG", duration: 250, wait: false } },
                { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 0 } },
                { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"" } },
                { name: "Score artifact", method: "addScore", parameters:{ score: 15 } },
                { name: "Score experiment", method: "addScore", parameters:{ score: 5 } },
                { name: "Lift artifact", method: "setArmPGA", parameters:{ name:"ACG", duration: 100, wait: true } },
                // Move backward
                { name: "backward",  method: "moveBackward", parameters:{ distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { name: "Arm default", method: "setArmDefault", parameters:{ name:"ACG", duration: 250, wait: false } },
            ]
        };
        //shareSampleBetweenArms
        let exchangeSamples = (fromYellow, fromViolet, to)=>{
            return {
                name: "Exchange to "+to,
                condition: ()=>{
                    let hasArmFromUsed = ((this.app.robot.team=="yellow" && this.app.robot.variables["arm"+fromYellow].value != "" && this.app.robot.variables["arm"+fromYellow].side == 1)
                                      || (this.app.robot.team=="violet" && this.app.robot.variables["arm"+fromViolet].value != "" && this.app.robot.variables["arm"+fromViolet].side == 1));
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-11*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasArmFromUsed && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    { team: "yellow", name: "Exchange"+fromYellow, method: "shareSampleBetweenArms", parameters:{ from:fromYellow, to:to} },
                    { team: "violet", name: "Exchange"+fromViolet, method: "shareSampleBetweenArms", parameters:{ from:fromViolet, to:to} },
                    { name: "Close Arm", method: "setArmDefault", parameters:{ name:to+"G", duration: 500, wait: false } },
                ]
            };
        }
        
        
        let grabTopDispenser = {
            name: "Grab Top Dispenser",
            condition: ()=>{
                let hasArmFree = ( this.app.robot.team=="yellow" && this.app.robot.variables.armAB.value == "")
                              || ( this.app.robot.team=="violet" && this.app.robot.variables.armBC.value == "");
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasArmFree && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                // Move to top dispenser
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "topDispenser", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Prepare grab arm
                { team:"yellow", name: "Prepare arm", method: "setArmPGFD", parameters:{ name:"ABG", duration: 0, wait: false } },
                { team:"violet", name: "Prepare arm", method: "setArmPGFD", parameters:{ name:"BCG", duration: 0, wait: false } },
                // Forward
                { team:"yellow", name: "Reposition X forward",  method: "moveRepositionning", parameters:{ newX:100, newAngle: -60, moveAngle: 180, distance:250, speed: this.moveSpeed } },
                { team:"violet", name: "Reposition X forward",  method: "moveRepositionning", parameters:{ newX:2900, newAngle: -120, moveAngle: 0, distance:250, speed: this.moveSpeed } },
                // Grab arm
                { team:"yellow", name: "Pump on", method: "setPump", parameters:{ name:"ABP", value: 255 } },
                { team:"violet", name: "Pump on", method: "setPump", parameters:{ name:"BCP", value: 255 } },
                { team:"yellow", name: "Grab arm", method: "setArmGFD", parameters:{ name:"ABG", duration: 0, wait: false } },
                { team:"violet", name: "Grab arm", method: "setArmGFD", parameters:{ name:"BCG", duration: 0, wait: false } },
                { name: "Wait", method: "sleep", parameters:{ duration:1000 } },
                // Lift arm
                { team:"yellow", name: "Prepare arm", method: "setArmPGFD", parameters:{ name:"ABG", duration: 0, wait: false } },
                { team:"violet", name: "Prepare arm", method: "setArmPGFD", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"yellow", name: "Store in variable", method: "setVariable", parameters:{ name:"armAB", value:"G", side:1 } },
                { team:"violet", name: "Store in variable", method: "setVariable", parameters:{ name:"armBC", value:"G", side:1 } },
                { name: "score", method: "addScore", parameters:{ score: 1 } },
                // Backward
                { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:0, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:-180, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                // Close arm
                { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:"ABG", duration: 0, wait: false } },
                { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:"BCG", duration: 0, wait: false } },
            ]
        }
        
        let grabSampleStartingTop = {
            name: "Grab Sample Starting Top",
            condition: ()=>{
                let hasArmFree = ( this.app.robot.team=="yellow" && this.app.robot.variables.armBC.value == "")
                              || ( this.app.robot.team=="violet" && this.app.robot.variables.armAB.value == "");
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasArmFree && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                // Move to sample starting top
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "sampleStartingTop", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Prepare grab arm 1/3
                { team:"yellow", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:"ABG", duration: 0, wait: false } },
                // Diagonal
                { team:"yellow", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:60, distance:140, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:120, distance:140, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                // Prepare grab arm 2/3
                { team:"yellow", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:"ABG", duration: 0, wait: false } },
                { name: "Wait", method: "sleep", parameters:{ duration:300 } },
                // Prepare grab arm 3/3
                { team:"yellow", name: "Pump on", method: "setPump", parameters:{ name:"BCP", value: 255 } },
                { team:"violet", name: "Pump on", method: "setPump", parameters:{ name:"ABP", value: 255 } },
                { team:"yellow", name: "Prepare arm 3/3", method: "setArmPGV", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Prepare arm 3/3", method: "setArmPGV", parameters:{ name:"ABG", duration: 0, wait: false } },
                { name: "Wait", method: "sleep", parameters:{ duration:300 } },
                // Grab arm
                { team:"yellow", name: "Grab arm", method: "setArmGV", parameters:{ name:"BCG", duration: 0, wait: false } },
                { team:"violet", name: "Grab arm", method: "setArmGV", parameters:{ name:"ABG", duration: 0, wait: false } },
                { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                // Lift arm 1/2
                { team:"yellow", name: "Lift arm 1/2", method: "setArmPGV", parameters:{ name:"BCG", duration: 200, wait: true } },
                { team:"violet", name: "Lift arm 1/2", method: "setArmPGV", parameters:{ name:"ABG", duration: 200, wait: true } },
                { team:"yellow", name: "Store in variable", method: "setVariable", parameters:{ name:"armBC", value:"B", side:1 } },
                { team:"violet", name: "Store in variable", method: "setVariable", parameters:{ name:"armAB", value:"B", side:1 } },
                // Lift arm 2/2
                { team:"yellow", name: "Lift arm 2/2", method: "setArmDH", parameters:{ name:"BCG", duration: 200, wait: true } },
                { team:"violet", name: "Lift arm 2/2", method: "setArmDH", parameters:{ name:"ABG", duration: 200, wait: true } },
                // Remove from map
                { name:"updateMap", method: "removeFromMap", parameters:{ list:["sampleStartingTop"] } },
                // Close arm
                { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:"BCG", duration: 400, wait: false } },
                { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:"ABG", duration: 400, wait: false } },
                // Backward
                { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:-120, distance:100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:-60, distance:100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                
            ]
        };
        
        let grabSampleStarting = (element, sideYellow, moveAngleYellow, sampleColor, sampleSide)=>{
            let sideViolet = sideYellow;
            if(sideYellow=="AB") sideViolet = "BC";
            if(sideYellow=="BC") sideViolet = "AB";
            let armY = sideYellow+"G";
            let pumpY = sideYellow+"P";
            let armV = sideViolet+"G";
            let pumpV = sideViolet+"P";
            let moveAngleViolet = 180 - moveAngleYellow;
            return {
                name: "Grab "+element,
                condition: ()=>{
                    let hasArmFree = ( this.app.robot.team=="yellow" && this.app.robot.variables["arm"+sideYellow].value == "")
                                  || ( this.app.robot.team=="violet" && this.app.robot.variables["arm"+sideViolet].value == "");
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to sample starting top
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Prepare grab arm 1/3
                    { team:"yellow", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:armV, duration: 0, wait: false } },
                    // Diagonal
                    { team:"yellow", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:moveAngleYellow, distance:140, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:moveAngleViolet, distance:140, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Prepare grab arm 2/3
                    { team:"yellow", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:armV, duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:300 } },
                    // Prepare grab arm 3/3
                    { team:"yellow", name: "Pump on", method: "setPump", parameters:{ name:pumpY, value: 255 } },
                    { team:"violet", name: "Pump on", method: "setPump", parameters:{ name:pumpV, value: 255 } },
                    { team:"yellow", name: "Prepare arm 3/3", method: "setArmPGV", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 3/3", method: "setArmPGV", parameters:{ name:armV, duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:800 } },
                    // Grab arm
                    { team:"yellow", name: "Grab arm", method: "setArmGV", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Grab arm", method: "setArmGV", parameters:{ name:armV, duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:750 } },
                    // Lift arm 1/2
                    { team:"yellow", name: "Lift arm 1/2", method: "setArmPGV", parameters:{ name:armY, duration: 200, wait: true } },
                    { team:"violet", name: "Lift arm 1/2", method: "setArmPGV", parameters:{ name:armV, duration: 200, wait: true } },
                    { team:"yellow", name: "Store in variable", method: "setVariable", parameters:{ name:"arm"+sideYellow, value:sampleColor, side:sampleSide } },
                    { team:"violet", name: "Store in variable", method: "setVariable", parameters:{ name:"arm"+sideViolet, value:sampleColor, side:sampleSide } },
                    // Lift arm 2/2
                    { team:"yellow", name: "Lift arm 2/2", method: "setArmDH", parameters:{ name:armY, duration: 200, wait: true } },
                    { team:"violet", name: "Lift arm 2/2", method: "setArmDH", parameters:{ name:armV, duration: 200, wait: true } },
                    // Remove from map
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } },
                    // Close arm
                    { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:armY, duration: 400, wait: false } },
                    { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:armV, duration: 400, wait: false } },
                    // Backward
                    { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:moveAngleYellow, distance:-100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:moveAngleViolet, distance:-100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    
                ]
            }
        };
        
        let depositInGallery = {
            name: "Deposit in gallery",
            condition: ()=>{
                let depositList = this.app.robot.getGalleryDepositList();
                let timeLeft = (this.app.intelligence.matchDuration - this.app.intelligence.currentTime) / 1000;
                let shouldDeposit = false;
                if(depositList.length>=2) shouldDeposit = true;
                if(depositList.length>=1 && timeLeft < 65) shouldDeposit = true;
                let hasTimeLeft = timeLeft > 20;
                let endReached = this.app.robot.variables.endReached.value;
                return shouldDeposit && hasTimeLeft && !endReached;
            },                
            executionCount: -1,
            actions: [
                { name: "Deposit", method: "depositInGallery" }
            ]
        };
        
        let grabAndThrowSampleShed = (element, sideDist)=>{
            return {
                name: "Grab and Throw "+element,
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-11*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    let secondRobotLeft = this.app.intelligence.currentTime >= 30*1000;
                    return secondRobotLeft && hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to shed
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Arm
                    { name: "Open arm", method: "setArmPGFD", parameters:{ name:"ACG", duration: 250, wait: true } },
                    // Forward
                    { name: "forward",  method: "moveForward", parameters:{ distance:230, speed: this.defaultSpeed } },
                    // Grab artifact
                    { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 255 } },
                    { name: "Grab sample", method: "setArmGFD", parameters:{ name:"ACG", duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"B", side:1 } },
                    // Move backward
                    { name: "backward",  method: "moveBackward", parameters:{ distance:175, speed: this.defaultSpeed } },
                    // Side
                    //{ team:"yellow", name: "Side",  method: "moveAtAngle", parameters:{ angle:45, distance:sideDist, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //{ team:"violet", name: "Side",  method: "moveAtAngle", parameters:{ angle:135, distance:sideDist, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Deposit on ground
                    { name: "Pump off", method: "setPump", parameters:{ name:"ACP", value: 0 } },
                    { name: "Wait", method: "sleep", parameters:{ duration:1200 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"" } },
                    // Throw
                    { name: "Motor on", method: "setMotor", parameters:{ name:"ACM", value: 255 } },
                    { name: "Prepare Throw", method: "setArmPT", parameters:{ name:"ACG", duration: 900, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:1000 } },
                    //{ name: "forward",  method: "moveForward", parameters:{ distance:100, speed: this.defaultSpeed } },
                    { name: "Throw", method: "setArmT", parameters:{ name:"ACG", duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:1000 } },
                    { name: "Motor off", method: "setMotor", parameters:{ name:"ACM", value: 0 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:100, speed: this.defaultSpeed } },
                    { name: "Close Arm 1/2", method: "setArmUH", parameters:{ name:"ACG", duration: 300, wait: true } },
                    { name: "Close Arm 2/2", method: "setArmDefault", parameters:{ name:"ACG", duration: 200, wait: false } },
                    { name: "Score sample in shed", method: "addScore", parameters:{ score: 5 } },
                    // Remove from map
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } }
                ]
            };
        }
        
        let grabAndDropSampleShed = (element)=>{
            return {
                name: "Grab and Drop Sample Shed Top",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    let secondRobotLeft = this.app.intelligence.currentTime >= 30*1000;
                    return secondRobotLeft && hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to shed
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Arm
                    { name: "Open arm", method: "setArmPGFD", parameters:{ name:"ACG", duration: 250, wait: true } },
                    // Forward
                    { name: "forward",  method: "moveForward", parameters:{ distance:230, speed: this.defaultSpeed } },
                    // Side
                    //{ team:"yellow", name: "Side",  method: "moveAtAngle", parameters:{ angle:-135, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //{ team:"violet", name: "Side",  method: "moveAtAngle", parameters:{ angle:-45, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Grab artifact
                    { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 255 } },
                    { name: "Grab sample", method: "setArmGFD", parameters:{ name:"ACG", duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"B", side:1 } },
                    // Move backward
                    { name: "backward",  method: "moveBackward", parameters:{ distance:250, speed: this.defaultSpeed } },
                    { name: "Open arm", method: "setArmDSS", parameters:{ name:"ACG", duration: 600, wait: true } },
                    // Move to shed
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "artifact", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    { team: "yellow", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:145, newX: 292, newY: 1651, newAngle: 135, distance:250, speed: this.moveSpeed } },
                    { team: "violet", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:35, newX: 2708, newY: 1651, newAngle: 45, distance:250, speed: this.moveSpeed } },
                    // Drop
                    { name: "Open arm", method: "setArmUH", parameters:{ name:"ACG", duration: 250, wait: false } },
                    { name: "Pump off", method: "setPump", parameters:{ name:"ACP", value: 0 } },
                    { name: "Wait", method: "sleep", parameters:{ duration:1750 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:"" } },
                    // Back
                    { name: "backward",  method: "moveBackward", parameters:{ distance:250, speed: this.defaultSpeed } },
                    { name: "Close Arm", method: "setArmDefault", parameters:{ name:"ACG", duration: 200, wait: false } },
                    { name: "Score sample in shed", method: "addScore", parameters:{ score: 5 } },
                    // Remove from map
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } }
                ]
            };
        }
        
        let justGrabSampleShed = (element, color)=>{
            return {
                name: "Just Grab Sample Shed",
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    let secondRobotLeft = this.app.intelligence.currentTime >= 30*1000;
                    return secondRobotLeft && hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to shed
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Arm
                    { name: "Open arm", method: "setArmPGFD", parameters:{ name:"ACG", duration: 250, wait: true } },
                    // Forward
                    { name: "forward",  method: "moveForward", parameters:{ distance:230, speed: this.defaultSpeed } },
                    // Side
                    //{ team:"yellow", name: "Side",  method: "moveAtAngle", parameters:{ angle:-135, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //{ team:"violet", name: "Side",  method: "moveAtAngle", parameters:{ angle:-45, distance:30, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Grab artifact
                    { name: "Pump on", method: "setPump", parameters:{ name:"ACP", value: 255 } },
                    { name: "Grab sample", method: "setArmGFD", parameters:{ name:"ACG", duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:400 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"armAC", value:color, side:1 } },
                    // Move backward
                    { name: "backward",  method: "moveBackward", parameters:{ distance:250, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "setArmDefault", parameters:{ name:"ACG", duration: 600, wait: false } },
                    // Remove from map
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } }
                ]
            };
        }
        
        let grabSampleDiagonal = (element, sideYellow, moveAngleYellow, sampleColor, sampleSide, sampleNumber)=>{
            let sideViolet = sideYellow;
            if(sideYellow=="AB") sideViolet = "BC";
            if(sideYellow=="BC") sideViolet = "AB";
            let armY = sideYellow+"G";
            let pumpY = sideYellow+"P";
            let armV = sideViolet+"G";
            let pumpV = sideViolet+"P";
            let moveAngleViolet = 180 - moveAngleYellow;
            let armAngleYellow = -60;
            if(sideYellow=="AC") armAngleYellow = 180;
            if(sideYellow=="BC") armAngleYellow = 60;
            let armAngleViolet = 180 - armAngleYellow;
            return {
                name: "Grab "+element,
                condition: ()=>{
                    let hasArmFree = ( this.app.robot.team=="yellow" && this.app.robot.variables["arm"+sideYellow].value == "")
                                  || ( this.app.robot.team=="violet" && this.app.robot.variables["arm"+sideViolet].value == "");
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                    let hasDispenserCountMatching = 3 - sampleNumber == this.app.robot.variables[element].value;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasDispenserCountMatching && hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: [
                    // Move to sample starting top
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    // Prepare grab arm 1/3
                    { team:"yellow", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:armV, duration: 0, wait: false } },
                    // Rotate
                    { team:"yellow", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:armAngleYellow, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:armAngleViolet, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Prepare grab arm 2/3
                    { team:"yellow", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 2/3", method: "setArmDH", parameters:{ name:armV, duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:300 } },
                    // Prepare grab arm 3/3
                    { team:"yellow", name: "Prepare arm 3/3", method: "setArmPGD", parameters:{ name:armY, duration: 0, wait: false } },
                    { team:"violet", name: "Prepare arm 3/3", method: "setArmPGD", parameters:{ name:armV, duration: 0, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:600 } },
                    // Forward
                    { team:"yellow", name: "Forward",  method: "moveAtAngle", parameters:{ angle:moveAngleYellow, distance:100+sampleNumber*22, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Forward",  method: "moveAtAngle", parameters:{ angle:moveAngleViolet, distance:100+sampleNumber*22, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"yellow", name: "Pump on", method: "setPump", parameters:{ name:pumpY, value: 255 } },
                    { team:"violet", name: "Pump on", method: "setPump", parameters:{ name:pumpV, value: 255 } },
                    // Grab arm
                    { team:"yellow", name: "Grab arm", method: "setArmGD", parameters:{ name:armY, duration: 300, wait: false } },
                    { team:"violet", name: "Grab arm", method: "setArmGD", parameters:{ name:armV, duration: 300, wait: false } },
                    { name: "Wait", method: "sleep", parameters:{ duration:700 } },
                    // Lift arm 1/2
                    { team:"yellow", name: "Lift arm 1/2", method: "setArmAGD", parameters:{ name:armY, duration: 600, wait: true } },
                    { team:"violet", name: "Lift arm 1/2", method: "setArmAGD", parameters:{ name:armV, duration: 600, wait: true } },
                    { team:"yellow", name: "Store in variable", method: "setVariable", parameters:{ name:"arm"+sideYellow, value:sampleColor, side:sampleSide } },
                    { team:"violet", name: "Store in variable", method: "setVariable", parameters:{ name:"arm"+sideViolet, value:sampleColor, side:sampleSide } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:element, value:3-sampleNumber-1 } },
                    // Lift + Backward
                    { team:"yellow", name: "Lift arm 2/2", method: "setArmUH", parameters:{ name:armY, duration: 2000, wait: false } },
                    { team:"violet", name: "Lift arm 2/2", method: "setArmUH", parameters:{ name:armV, duration: 2000, wait: false } },
                    { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:moveAngleYellow, distance:-100, speed: 0.2, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:moveAngleViolet, distance:-100, speed: 0.2, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Lift arm 2/2
                    // Remove from map
                    // { name:"updateMap", method: "removeFromMap", parameters:{ list:[element] } },
                    // Close arm
                    
                    { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:armY, duration: 400, wait: false } },
                    { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:armV, duration: 400, wait: false } },
                    
                ]
            }
        };
        
        let flipSquare = (element)=>{
            let goal = {
                name: "Flip "+element,
                condition: ()=>{
                    let hasArmFree = this.app.robot.variables.armAC.value == "";
                    let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000;
                    let endReached = this.app.robot.variables.endReached.value;
                    return hasArmFree && hasTimeLeft && !endReached;
                },                
                executionCount: 1,
                actions: []
            };
            goal.actions.push({ name: "Move", method: "moveToComponent", parameters:{ component: element, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } });
            goal.actions.push({ name: "Arm default", method: "setArmDefault", parameters:{ name:"ACG", duration: 250, wait: true } });
            goal.actions.push({ name: "Reposition Y forward",  method: "moveRepositionning", parameters:{ moveAngle:90, newY: 1890, newAngle: 90, distance:300, speed: this.moveSpeed } });
            goal.actions.push({ name: "Flip square", method: "setArmUH", parameters:{ name:"ACG", duration: 600, wait: true } });
            if(element == "square2") {
                goal.actions.push({ name: "Score", method: "addScore", parameters:{ score: 5 } });
                goal.actions.push({ name: "Score Bonus", method: "addScore", parameters:{ score: 5 } });
            }
            else {
                goal.actions.push({ name: "Score", method: "addScore", parameters:{ score: 2.5 } });
            }
            goal.actions.push({ name: "updateMap", method: "removeFromMap", parameters:{ list:[element] } });
            goal.actions.push({ name: "Close Arm", method: "setArmDefault", parameters:{ name:"ACG", duration: 200, wait: false } });
            goal.actions.push({ name: "backward",  method: "moveBackward", parameters:{ distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } });
            return goal;
        };
        
        let moveToEndStart = {
            name: "Move to End",
            condition: ()=>{
                let isEnd = (this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000);
                let endReached = this.app.robot.variables.endReached.value;
                return isEnd && !endReached;
            },                
            executionCount: 1,
            actions: [
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "startingArea", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Lift arm
                { team:"yellow", name: "Extend arm", method: "setArmUH", parameters:{ name:"ABG", duration: 500, wait: false } },
                { team:"violet", name: "Extend arm", method: "setArmUH", parameters:{ name:"BCG", duration: 500, wait: false } },
                // Backward
                { team:"yellow", name: "Backward",  method: "moveBackward", parameters:{ distance:350, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team:"violet", name: "Backward",  method: "moveBackward", parameters:{ distance:350, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                // Store End reached
                { name: "Score artifact", method: "addScore", parameters:{ score: 20 } },
                { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
                { name: "Pump off", method: "setPump", parameters:{ name:"ACP", value: 0 } },
                { name: "Pump off", method: "setPump", parameters:{ name:"BCP", value: 0 } },
                { name: "Pump off", method: "setPump", parameters:{ name:"ABP", value: 0 } },
            ]
        };
        
        let repositionStart = {
            name: "Reposition Start",
            condition: ()=>{
                let hasArmFree = this.app.robot.variables.armAC.value == "";
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasArmFree && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                { team: "yellow", name: "Move", method: "moveToComponent", parameters:{ component: "startingArea", angle: 180, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                { team: "violet", name: "Move", method: "moveToComponent", parameters:{ component: "startingArea", angle: 0, speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                // Reposition
                { team: "yellow", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:180, newX: 100, newAngle: 180, distance:550, speed: this.moveSpeed } },
                { team: "violet", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:0, newX: 2900, newAngle: 0, distance:550, speed: this.moveSpeed } },
                // Backward
                { name: "backward",  method: "moveBackward", parameters:{ distance:200, speed: this.defaultSpeed } },
            ]
        };
        
        let repositionSquare = {
            name: "Reposition Square",
            condition: ()=>{
                let hasArmFree = this.app.robot.variables.armAC.value == "";
                let hasTimeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-20*1000;
                let endReached = this.app.robot.variables.endReached.value;
                return hasArmFree && hasTimeLeft && !endReached;
            },                
            executionCount: 1,
            actions: [
                {
                    name: "Move",
                    method: "moveToComponent",
                    parameters:{ component: "square2", speed: this.moveSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                },
                // Reposition
                { team: "yellow", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:90, newY: 1900, newAngle: 90, distance:350, speed: this.moveSpeed } },
                { team: "violet", name: "Reposition forward",  method: "moveRepositionning", parameters:{ moveAngle:90, newY: 1900, newAngle: 90, distance:350, speed: this.moveSpeed } },
                // Backward
                { name: "backward",  method: "moveBackward", parameters:{ distance:200, speed: this.defaultSpeed } },
            ]
        };

        this.list = [
            waitForStart,
            /*replicaAndArtifactFromShed,
            depositArtifactInGallery,*/
            grabSampleStarting("sampleStartingMiddle", "BC", 0, "G", 1), //4s+d
            exchangeSamples("BC", "AB", "AC"),
            grabSampleStarting("sampleStartingBottom", "AB", -60, "R", 1), //4S+d
            grabSampleStarting("sampleStartingTop", "BC", 60, "B", 1), //4s+d
            depositInGallery, //20s+d (2sample)
            grabTopDispenser, //4s+d
            depositInGallery,//20s+d (2sample)
            repositionStart,
            repositionSquare,
            //grabAndDropSampleShed("sampleShedTop"),
            grabAndDropSampleShed("sampleShedBottom"),
            //justGrabSampleShed("sampleShedBottom"),
            grabAndThrowSampleShed("sampleShedTop", 75),
            //grabAndThrowSampleShed("sampleShedBottom", -75),
            //grabSampleDiagonal("bottomDispenser", "AB", 180, "B", 1, 0),
            //grabSampleDiagonal("bottomDispenser", "BC", 180, "G", 1, 1),
            //grabSampleDiagonal("bottomDispenser", "AB", 180, "R", 1, 2),
            depositInGallery,
            /*flipSquare("square2"),
            flipSquare("squareShared1"),
            flipSquare("squareShared2"),
            flipSquare("squareShared3"),
            flipSquare("squareShared4"),*/
            moveToEndStart
        ]
    }
}