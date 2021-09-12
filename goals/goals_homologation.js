'use strict';
delete require.cache[require.resolve('./goals')]; //Delete require() cache
const Goals = require('./goals');

module.exports = class GoalsTest extends Goals{
    constructor(app) {
        super(app);
        this.defaultSpeed=0.3; //m/s
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
                    {
                        name: "Start funny action",
                        method: "startFunnyAction"
                    }
                ]
            },
            
            {
                name: "Perform start move",
                condition: ()=>{
                    if(this.app.robot.team=="blue")
                        return this.app.robot.variables.buoyABA.value == 0 && this.app.robot.variables.buoyABB.value == 0;
                    if(this.app.robot.team=="yellow")
                        return this.app.robot.variables.buoyBCB.value == 0 && this.app.robot.variables.buoyBCB.value == 0;
                    return false;
                }, 
                executionCount: 1,
                actions: [
                    //open
                    { team:"blue", name: "Open arm", method: "openSideArms", parameters:{ name:"ABA", wait:false } },
                    { team:"blue", name: "Open arm", method: "openSideArms", parameters:{ name:"ABB", wait:false } },
                    { team:"yellow", name: "Open arm", method: "openSideArms", parameters:{ name:"BCB", wait:false } },
                    { team:"yellow", name: "Open arm", method: "openSideArms", parameters:{ name:"BCC", wait:false } },
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyStartingNorth", speed: 0.2, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyStartingNorth", "buoyStartingFairwayNorth"] } },
                    //close
                    { team:"blue", name: "Close arm", method: "closeSideArms", parameters:{ name:"ABA" } },
                    { team:"blue", name: "Close arm", method: "closeSideArms", parameters:{ name:"ABB" } },
                    { team:"yellow", name: "Close arm", method: "closeSideArms", parameters:{ name:"BCB" } },
                    { team:"yellow", name: "Close arm", method: "closeSideArms", parameters:{ name:"BCC" } },
                    //vars
                    { team: "blue", name: "Vars", method: "setVariable", parameters:{ name:"buoyABA", value:1 } },
                    { team: "blue", name: "Vars", method: "setVariable", parameters:{ name:"buoyABB", value:1 } },
                    { team: "yellow", name: "Vars", method: "setVariable", parameters:{ name:"buoyBCB", value:1 } },
                    { team: "yellow", name: "Vars", method: "setVariable", parameters:{ name:"buoyBCC", value:1 } }
                ]
            },
            /*{
                name: "Rush",
                condition: ()=>{return true;
                }, 
                executionCount: 1,
                actions: [
                    { name: "forward",  method: "moveAtAngle", parameters:{ angle:-150, distance:850, speed: 0.5 } },
                    
                ]
            },*/
            
            {
                name: "Activate lighthouse",
                condition: ()=>{
                    return true;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "lighthouse", speed: 0.2 }
                    },
                    {
                        name: "Activate",
                        method: "activateLighthouse"
                    }
                ]
            },
            
            {
                name: "Buoys top",
                condition: ()=>{
                    if(this.app.robot.team=="blue")
                        return this.app.robot.variables.buoyBCB.value == 0 && this.app.robot.variables.buoyBCB.value == 0;
                    if(this.app.robot.team=="yellow")
                        return this.app.robot.variables.buoyABA.value == 0 && this.app.robot.variables.buoyABB.value == 0;
                    return false;
                }, 
                executionCount: 1,
                actions: [
                    //open
                    { team:"yellow", name: "Open arm", method: "openSideArms", parameters:{ name:"ABA" } },
                    { team:"yellow", name: "Open arm", method: "openSideArms", parameters:{ name:"ABB" } },
                    { team:"blue", name: "Open arm", method: "openSideArms", parameters:{ name:"BCB" } },
                    { team:"blue", name: "Open arm", method: "openSideArms", parameters:{ name:"BCC" } },
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyTop", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyMiddleTop", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyTop", "buoyMiddleTop"] } },
                    //close
                    { team:"yellow", name: "Close arm", method: "closeSideArms", parameters:{ name:"ABA" } },
                    { team:"yellow", name: "Close arm", method: "closeSideArms", parameters:{ name:"ABB" } },
                    { team:"blue", name: "Close arm", method: "closeSideArms", parameters:{ name:"BCB" } },
                    { team:"blue", name: "Close arm", method: "closeSideArms", parameters:{ name:"BCC" } },
                    //vars
                    { team: "yellow", name: "Vars", method: "setVariable", parameters:{ name:"buoyABA", value:1 } },
                    { team: "yellow", name: "Vars", method: "setVariable", parameters:{ name:"buoyABB", value:1 } },
                    { team: "blue", name: "Vars", method: "setVariable", parameters:{ name:"buoyBCB", value:1 } },
                    { team: "blue", name: "Vars", method: "setVariable", parameters:{ name:"buoyBCC", value:1 } }
                ]
            },
            
            {
                name: "Read weathervane",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= 5*1000
                      && this.app.robot.variables["endZone"].value == 0)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "weathervane", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    {
                        name: "Read",
                        method: "readWeathervane"
                    }
                ]
            },
            
            {
                name: "Buoys middle",
                condition: ()=>{
                    return this.app.robot.variables.buoyACA.value == 0 && this.app.robot.variables.buoyACC.value == 0;
                }, 
                executionCount: 1,
                actions: [
                    //open
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACA" } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACC" } },
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyMiddleBottom", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    { name: "forward",  method: "moveForward", parameters:{ distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyBottom", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    { name: "forward",  method: "moveForward", parameters:{ distance:200, speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyMiddleBottom","buoyBottom"] } },
                    //close
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACA" } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACC" } },
                    //vars
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACA", value:1 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACC", value:1 } }
                ]
            },
            
            {
                name: "Deposit small port",
                condition: ()=>{
                    let sum =
                          this.app.robot.variables.buoyACA.value
                        + this.app.robot.variables.buoyACC.value
                        + this.app.robot.variables.buoyABA.value
                        + this.app.robot.variables.buoyABB.value
                        + this.app.robot.variables.buoyBCB.value
                        + this.app.robot.variables.buoyBCC.value;
                        console.log("sum", sum);
                    return sum > 0;
                }, 
                //executionCount: 1,
                actions: [
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "bottomPort", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    //open
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACC", wait:false } },
                    { name: "forward",  method: "moveForward", parameters:{ distance:380, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACA", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACC", value:0 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:150, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACC", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:4 } },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyBottomPortFairwayLeft", "buoyBottomPortFairwayRight"] } },
                    
                    { name: "rotate",  method: "rotateToAngle", parameters:{ angle:-30, speed: this.defaultSpeed } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"BCB", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"BCC", wait:false } },
                    { name: "forward",  method: "moveAtAngle", parameters:{ angle:90, distance:70, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyBCB", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyBCC", value:0 } },
                    { name: "backward",  method: "moveAtAngle", parameters:{ angle:-90, distance:150, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"BCB", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"BCC", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:4 } },
                    
                    { name: "rotate",  method: "rotateToAngle", parameters:{ angle:210, speed: this.defaultSpeed } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ABA", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ABB", wait:false } },
                    { name: "forward",  method: "moveAtAngle", parameters:{ angle:90, distance:90, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyABA", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyABB", value:0 } },
                    { name: "backward",  method: "moveAtAngle", parameters:{ angle:-90, distance:200, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ABA", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ABB", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:4 } },
                    
                ]
            },
            
            {
                name: "Deposit start area port",
                condition: ()=>{
                    let sum =
                          this.app.robot.variables.buoyACA.value
                        + this.app.robot.variables.buoyACC.value
                        + this.app.robot.variables.buoyABA.value
                        + this.app.robot.variables.buoyABB.value
                        + this.app.robot.variables.buoyBCB.value
                        + this.app.robot.variables.buoyBCC.value;
                        console.log("sum", sum);
                    return sum > 0;
                }, 
                //executionCount: 1,
                actions: [
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingArea", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    //open
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACC", wait:false } },
                    { name: "forward",  method: "moveForward", parameters:{ distance:380, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACA", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACC", value:0 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:150, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACC", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:2 } },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyBottomPortFairwayLeft", "buoyBottomPortFairwayRight"] } },
                    
                    { name: "rotate",  method: "rotateToAngle", parameters:{ angle:-30, speed: this.defaultSpeed } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"BCB", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"BCC", wait:false } },
                    { name: "forward",  method: "moveAtAngle", parameters:{ angle:90, distance:70, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyBCB", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyBCC", value:0 } },
                    { name: "backward",  method: "moveAtAngle", parameters:{ angle:-90, distance:150, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"BCB", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"BCC", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:2 } },
                    
                    { name: "rotate",  method: "rotateToAngle", parameters:{ angle:210, speed: this.defaultSpeed } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ABA", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ABB", wait:false } },
                    { name: "forward",  method: "moveAtAngle", parameters:{ angle:90, distance:90, speed: this.defaultSpeed } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyABA", value:0 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyABB", value:0 } },
                    { name: "backward",  method: "moveAtAngle", parameters:{ angle:-90, distance:200, speed: this.defaultSpeed } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ABA", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ABB", wait:false } },
                    { name: "score", method: "addScore", parameters:{ score:2 } },
                    
                ]
            },
            
            //----
            /*{
                name: "Buoys reef side arms",
                condition: ()=>{
                    return this.app.robot.variables.buoyACA.value == 0 && this.app.robot.variables.buoyACC.value == 0;
                }, 
                executionCount: 1,
                actions: [
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "sharedReef", speed: this.defaultSpeed }
                    },
                    //arm
                    { name: "arm",  method: "setArmReef" },
                    { name: "Pump on",  method: "enablePump", parameters:{ name:"LEF" } },
                    { name: "Pump on",  method: "enablePump", parameters:{ name:"RIG" } },
                    //forward
                    { name: "forward",  method: "moveForward", parameters:{ distance:160, speed: 0.2 } },
                    //lift
                    { name: "lift",  method: "setArmReefLift" },
                    //backward
                    { name: "backward",  method: "moveBackward", parameters:{ distance:300, speed: 0.2 } },
                    //deposit
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACA", wait: false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACC", wait: false } },
                    { name: "lift",  method: "setArmReefDeposit" },
                    { name: "Pump off",  method: "disablePump", parameters:{ name:"LEF" } },
                    { name: "Pump off",  method: "disablePump", parameters:{ name:"RIG" } },
                    { name: "wait",  method: "delay", parameters:{ duration:300 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:50, speed: 0.2 } },
                    { name: "arm default",  method: "setArmDefault" },
                    //forward to grab
                    { name: "forward",  method: "moveForward", parameters:{ distance:300, speed: 0.2 } },
                    //grab
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACA" } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACC" } },
                    //vars
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACA", value:1 } },
                    { name: "Vars", method: "setVariable", parameters:{ name:"buoyACC", value:1 } },
                ]
            },*/
            //----
            
            {
                name: "Read weathervane 2",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= 25*1000
                      && this.app.robot.variables["endZone"].value == 0)
                        return true;
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "weathervane2", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    {
                        name: "Read",
                        method: "readWeathervane"
                    }
                ]
            },
            
            {
                name: "Activate windosck side",
                condition: ()=>{
                    if(this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000)
                    {
                        return this.app.robot.variables.buoyACA.value == 0 && this.app.robot.variables.buoyACC.value == 0
                    }
                    return false;
                },                
                executionCount: 1,
                actions: [
                    { name: "Move",  method: "moveToComponent",  parameters:{ component: "windsockSide", speed: 0.2, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle } },
                    //reposition
                    { team: "blue", name: "rotate",  method: "rotateToAngle", parameters:{ angle:180, speed: this.defaultSpeed } },
                    { team: "yellow", name: "rotate",  method: "rotateToAngle", parameters:{ angle:0, speed: this.defaultSpeed } },
                    
                    { team: "blue", name: "reposition X",  method: "moveRepositionning", parameters:{ axis:"x", value: 100, distance:200, speed: 0.2 } },
                    { team: "yellow", name: "reposition X",  method: "moveRepositionning", parameters:{ axis:"x", value: 2900, distance:200, speed: 0.2 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:350, angle: 90, speed: this.defaultSpeed } },
                    { name: "reposition Y",  method: "moveRepositionning", parameters:{ axis:"y", value: 1900, distance:350, speed: 0.2 } },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:350, speed: this.defaultSpeed } },
                    { name: "Move",  method: "moveToComponent",  parameters:{ component: "windsockSide", speed: 0.2 } },
                    
                    { name: "prepare", method: "setArmWindsockPrepare" },
                    { name: "forward",  method: "moveForward", parameters:{ distance:130, speed: this.defaultSpeed } },
                    { name: "ready", method: "setArmWindsockReady" },
                    { team: "yellow", name: "side",  method: "moveSideway", parameters:{ side:"right", distance:150, speed: 0.07 } },
                    { team: "blue", name: "side",  method: "moveSideway", parameters:{ side:"left", distance:150, speed: 0.07 } },
                    { name: "active", method: "setArmWindsockActive" },
                    { name: "validate", method: "validateWindsock" },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:75, speed: this.defaultSpeed } },
                    { name: "default", method: "setArmDefault" },
                ]
            },
            
            {
                name: "Activate windosck middle",
                condition: ()=>{
                    if(this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-15*1000)
                    {
                        return this.app.robot.variables.buoyACA.value == 0 && this.app.robot.variables.buoyACC.value == 0
                    }
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "windsockMiddle", speed: 0.2, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    { name: "prepare", method: "setArmWindsockPrepare" },
                    { name: "forward",  method: "moveForward", parameters:{ distance:120, speed: this.defaultSpeed } },
                    { name: "ready", method: "setArmWindsockReady" },
                    { team:"yellow", name: "side",  method: "moveSideway", parameters:{ side:"right", distance:150, speed: 0.07 } },
                    { team:"blue", name: "side",  method: "moveSideway", parameters:{ side:"left", distance:150, speed: 0.07 } },
                    { name: "active", method: "setArmWindsockActive" },
                    { name: "validate", method: "validateWindsock" },
                    { name: "backward",  method: "moveBackward", parameters:{ distance:75, speed: this.defaultSpeed } },
                    { name: "default", method: "setArmDefault" }
                ]
            },
            
    
            {
                name: "Buoys end",
                condition: ()=>{
                    return this.app.robot.variables.buoyACA.value == 0 && this.app.robot.variables.buoyACC.value == 0;
                }, 
                executionCount: 1,
                actions: [
                    //move
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "buoyStartingSouth", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    //open
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Open arm", method: "openSideArms", parameters:{ name:"ACC", wait:false } },
                    
                    { name: "forward",  method: "moveForward", parameters:{ distance:300, speed: 0.4 } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACA", wait:false } },
                    { name: "Close arm", method: "closeSideArms", parameters:{ name:"ACC", wait:false } },
                    //{ name: "backward",  method: "moveBackward", parameters:{ distance:400, speed: 0.4 } },
                    //remove
                    { name:"updateMap", method: "removeFromMap", parameters:{ list:["buoyStartingSouth","buoyStartingFairway"] } },
                    
                    { name: "score", method: "addScore", parameters:{ score:3 } },
                ]
            },
            
            
            {
                name: "Move to End",
                condition: ()=>{
                    if(this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-15*1000
                       && this.app.robot.variables["endZone"].value>0)
                        return true;  
                    if(this.app.intelligence.currentTime >= this.app.intelligence.matchDuration-13*1000){
                       this.app.robot.variables["endZone"].value = 1;
                        return true;
                    }
                    return false;
                },                
                executionCount: 1,
                actions: [
                    {
                        name: "Move",
                        method: "moveToComponent",
                        parameters:{ component: "startingArea", speed: this.defaultSpeed, nearDist: this.defaultNearDist, nearAngle: this.defaultNearAngle }
                    },
                    {
                        name: "orientRobot",
                        method: "performEndingMove"
                    }
                ]
            },
            
            
        ]
    }
}