'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.6; //m/s 0.3
        this.moveSpeed = 0.4; //m/s 0.2
        this.defaultNearDist=50;//mm
        this.defaultNearAngle=5;//°

        this.list = [

            
            // Wait for start
            {
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
                ]
            },
            
            {
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
                    { name: "backward",  method: "moveBackward", parameters:{ distance:100, speed: this.defaultSpeed } },
                    { name: "Artifact default position", method: "setArmDefault", parameters:{ name:"ACG", duration: 250, wait: false } },
                    // Prepare replica arm 2/2
                    { team:"yellow", name: "Replica arm 2/2", method: "setArmPGA", parameters:{ name:"BCG", duration: 0, wait: false } },
                    { team:"violet", name: "Replica arm 2/2", method: "setArmPGA", parameters:{ name:"ABG", duration: 0, wait: false } },
                    // Reorient for replica
                    { team:"yellow", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:0, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Rotate",  method: "rotateToAngle", parameters:{ angle:180, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Forward
                    { team:"yellow", name: "Forward",  method: "moveAtAngle", parameters:{ angle:135, distance:200, speed: this.defaultSpeed } },
                    { team:"violet", name: "Forward",  method: "moveAtAngle", parameters:{ angle:-135, distance:200, speed: this.defaultSpeed } },
                    // Deposit replica
                    { team:"yellow", name: "Deposit replica", method: "setArmGA", parameters:{ name:"BCG", duration: 0, wait: false } },
                    { team:"violet", name: "Deposit replica", method: "setArmGA", parameters:{ name:"ABG", duration: 0, wait: false } },
                    { team:"yellow", name: "Pump off", method: "setPump", parameters:{ name:"BCP", value: 0 } },
                    { team:"violet", name: "Pump off", method: "setPump", parameters:{ name:"ABP", value: 0 } },
                    { name:"Wait", method: "sleep", parameters:{ duration:400 } },
                    { team:"yellow", name:"Store in variable", method: "setVariable", parameters:{ name:"armBC", value:"" } },
                    { team:"violet", name:"Store in variable", method: "setVariable", parameters:{ name:"armAB", value:"" } },
                    { name:"score", method: "addScore", parameters:{ score: 10 } },
                    // Back
                    { team:"yellow", name: "Backward",  method: "moveAtAngle", parameters:{ angle:-45, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Backward",  method: "moveAtAngle", parameters:{ angle:45, distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"yellow", name: "Close arm", method: "setArmDefault", parameters:{ name:"BCG", duration: 0, wait: false } },
                    { team:"violet", name: "Close arm", method: "setArmDefault", parameters:{ name:"ABG", duration: 0, wait: false } },
                ]
            },
            
            {
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
                    { name: "Open arm 1/2", method: "setArmUH", parameters:{ name:"ACG", duration: 250, wait: true } },
                    { name: "Open arm 2/2", method: "setArmPGA", parameters:{ name:"ACG", duration: 250, wait: false } },
                    // Forward
                    { name: "Reposition Y forward",  method: "moveRepositionning", parameters:{ axis:"y", value: 100, distance:350, speed: this.moveSpeed } },
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
            },
            
            {
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
                    { name: "Wait", method: "sleep", parameters:{ duration:400 } },
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
            },
            
            {
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
                    { team:"yellow", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:60, distance:100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    { team:"violet", name: "Diagonal",  method: "moveAtAngle", parameters:{ angle:120, distance:100, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
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
            },
            
            {
                name: "Deposit in gallery",
                condition: ()=>{
                    let depositList = this.app.robot.getGalleryDepositList();
                    let timeLeft = (this.app.intelligence.matchDuration - this.app.intelligence.currentTime) / 1000;
                    let shouldDeposit = false;
                    if(depositList.length>=2) shouldDeposit = true;
                    if(depositList.length>=1 && timeLeft < 35) shouldDeposit = true;
                    let hasTimeLeft = timeLeft > 20;
                    let endReached = this.app.robot.variables.endReached.value;
                    return shouldDeposit && hasTimeLeft && !endReached;
                },                
                executionCount: -1,
                actions: [
                    { name: "Deposit", method: "depositInGallery" }
                ]
            },
            
            {
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
                    { name: "Prepare arm 1/3", method: "setArmUH", parameters:{ name:"ACG", duration: 500, wait: false } },
                    // Forward
                    { name: "Forward",  method: "moveForward", parameters:{ distance:150, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    // Store End reached
                    { name: "Score artifact", method: "addScore", parameters:{ score: 20 } },
                    { name: "Store in variable", method: "setVariable", parameters:{ name:"endReached", value:1 } },
                ]
            },
            
            
        ]
    }
}