'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');

//delete require.cache[require.resolve('./modules/lidarx2')]; //Delete require() cache
//const Lidar = require('./modules/lidarx2');

delete require.cache[require.resolve('./modules/lidarLD06')]; //Delete require() cache
const Lidar = require('./modules/lidarLD06');
delete require.cache[require.resolve('./modules/lidarLD06Loc')]; //Delete require() cache
const LidarLoc = require('./modules/lidarLD06Loc');


delete require.cache[require.resolve('./modules/lidarLocalisation')]; //Delete require() cache
const LidarLocalisation = require('./modules/lidarLocalisation');

delete require.cache[require.resolve('./modules/arm')]; //Delete require() cache
const Arm = require('./modules/arm');

delete require.cache[require.resolve('./modules/camera')]; //Delete require() cache
const Camera = require('./modules/camera');


const utils = require("../utils")

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
        this.name = "Robot Nesnes TDS"
        this.radius = 120+10;//margin
        this.startPosition = {
            blue:{x:265,y:650,angle:0},
            yellow:{x:150,y:542,angle:0},
            //violet:{x:2850,y:542,angle:180}
        }
        this.variables = {
            // value:{R|G|B|replica|artifact|''}, Side: 0=ready 1=flipped(not ready to drop) 
            // value: {"P"=plant|"PR"=resistante|"PF"=fragile|"M"=metal_pot|""}
            armCC: { value: "", label: "CCG" },  
            armAA: { value: "", label: "AAG" },  
            armC0: { value: "", label: "C0G" },
            armA0: { value: "", label: "A0G" },
            armC1: { value: "", label: "C1G" },
            armA1: { value: "", label: "A1G" },
            armC2: { value: "", label: "C2G" },
            armA2: { value: "", label: "A2G" },
            armC3: { value: "", label: "C3G" },
            armA3: { value: "", label: "A3G" },
            startZone: { value: "" },
            endReached: { value: 0, max: 1 },
            endZone: { value: "" },
            startRushed: { value: 0, max: 1 },
        }
        this.collisionAngle = 90;
        this.collisionDistance = this.radius+300;//450;
        this.slowdownAngle = 70;
        this.slowdownDistance = this.collisionDistance+350;
        this.slowdownDistanceOffset = 300; // multiplied by speed in m/s and added to slowdownDistance
        this.slowDownSpeed = 0.35;
        
        if(!this.app.parameters.simulate){
            this.modules.lidar = new Lidar(app)
            this.modules.lidarLoc = new LidarLoc(app);
            //this.modules.lidarLocalisation = new LidarLocalisation(app)
            this.modules.arm = new Arm(app);
            this.modules.camera = new Camera(app);
        }
    }

    async init(){
        await super.init();
        if(this.modules.arm/* && this.modules.robotLink*/){
            await this.modules.arm.init().catch((e)=>{
                this.modules.arm.close();
                this.modules.arm = null;
            })
        } else this.modules.arm = null;
        if(this.modules.arm){
            this.modules.arm.getActuators();
        }
        if(this.modules.camera){
            await this.modules.camera.init().catch((e)=>{
                this.modules.camera.close();
                this.modules.camera = null;
            })
        } else this.modules.camera = null;
        this.sendModules();
    }

    async close(){
        await super.close();
        //custom close here
        if(this.modules.camera) await this.modules.camera.close();
        if(this.modules.arm) await this.modules.arm.close();
    }

    async initArms(){
        
        // Set arms at default position
        await this.setArmsPacked({armList:["CC", "AA"], wait: false});
        await this.setArmsPacked({armList:["C0", "A0"], wait: false});
        await this.setArmsPacked({armList:["C1", "A1"], wait: true});
        await this.setArmsPacked({armList:["C2", "A2"], wait: true});
        await this.setArmsPacked({armList:["C3", "A3"], wait: true});
        
        return true;
    }

    async initMatch(){
        await super.initMatch();
        
        // Set arms at default position
        if(this.modules.arm) await this.modules.arm.setLed({ brightness: 0, color: 0});
        
        await this.initArms();
        await utils.sleep(500);
        //await this.setArmsPrepareFlag({});
        
        if(this.modules.base) await this.modules.base.enableMove();
        
        return;
    }

    async endMatch(){
        await super.endMatch();
        
        /*if(this.variables.endReached){
            this.app.logger.log("Adding end zone point");
            if(this.name == "Robot Nesnes TDS") this.addScore(8);
            else this.addScore(7);
        }*/
        
        /*if(this.modules.arm) await this.modules.arm.setServo({ name: "ABB", angle: 170, duration: 400, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ABA", angle: 170, duration: 400, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ACA", angle: 170, duration: 400, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ACC", angle: 170, duration: 400, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCB", angle: 170, duration: 400, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCC", angle: 170, duration: 400, wait:false});
        */
        
        /*while (!this.app.intelligence.stopExecution)
        {
            for(let i=0;i<255;i+=2) {
                if(this.modules.arm) await this.modules.arm.setLed({ brightness: 255, color: i});
                await utils.sleep(10);
                if(this.app.intelligence.stopExecution) break;
            }
        }*/
        
        if(this.modules.arm) await this.modules.arm.setLed({ brightness: 0, color: 0});
        
        
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "ACG", a1:330, a2:150, a3:150, a4:150 });
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "ABG", a1:330, a2:150, a3:150, a4:150 });
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "BCG", a1:330, a2:150, a3:150, a4:150 });
        /*if(this.modules.arm) await this.modules.arm.setMotor({ name: "ACM", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ACP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ABP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "BCP", value:0 });*/
    }

    getDescription(){
        return {
            functions:{
                initArms:{},
                setArmsPacked:{ },
                setArmsPreRelease:{ },
                setArmsRelease:{ },
                setArmsPreGrab:{ },
                setArmsGrab:{
                    liftOffset:{ legend:"lift offset", type:"number", min:-50, max:350, value:0 }
                },
                setArmsPrepareFlag:{},
                setArmsLowerFlag:{},
                setArmsReleaseFlag:{},
                draw:{},
                dance2023: {},
                testSetPosition: {},
                findLocalisation: {},
                testOrientation:{ speed:{ type:"range", min:0, max:3.0, value:0.4, step:0.1 }},
                testDistance:{
                    distance:{ legend:"distance (mm)", type:"number", min:-1000, max:1000, value:150 },
                    speed:{ type:"range", min:0, max:3.0, value:0.4, step:0.1 },
                    accelDist:{ type:"range", min:0, max:3.0, value:0.8, step:0.1 }
                    
                },
                testAngle:{
                    distance:{ legend:"angle (deg)", type:"number", min:-360, max:360, value:90 },
                    angleSpeed:{ type:"range", min:0, max:360, value:90, step:1 }
                },
                depositInZone:{},
                isMovementPossible:{}
            }
        }
    }
    
    async setArmsAt(parameters){
        let armList = []
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        if(!("pose" in parameters)) return false;
        let targetPose = Object.assign(parameters.pose, parameters);
        for(let targetArm of armList) {
            let pose = Object.assign({}, targetPose, {name: targetArm+"G"});
            if(this.modules.arm) await this.modules.arm.setPose(pose);
        }
        return true;
    }
    
    async setArmsPacked(parameters){
        let armList = ["CC","C0","C1", "C2", "C3", "AA", "A0", "A1", "A2", "A3"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        console.log("setArmsPacked", armList);
        for(let targetArm of armList) {
            let pose = { duration:300, wait:false };
            if (targetArm == "CC" || targetArm == "AA") { pose.a1 = 10; }
            if (targetArm == "C0" || targetArm == "A0") { pose.a1 = 90; pose.a2 = 180; pose.a3 = 150; }
            if (targetArm == "C1" || targetArm == "A1") { pose.a1 = 50; pose.a2 = 70; pose.a3 = 150; }
            if (targetArm == "C2" || targetArm == "A2") { pose.a1 = 270; pose.a2 = 65; pose.a3 = 150; }
            if (targetArm == "C3" || targetArm == "A3") { pose.a1 = 270; pose.a2 = 125; pose.a3 = 90; pose.a4 = 150; }
            if(this.variables["arm"+targetArm].value != ""){
                //await this.setArmsStore({armList:[targetArm], duration: 300, wait:false });   
            }
            else {
                await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
            }
        }
        return true;
    }
    
    async setArmsPreGrab(parameters){
        //let armList = ["CC","C0","C1", "C2", "C3", "AA", "A0", "A1", "A2", "A3"]
        let armList = ["CC","C0","C1", "AA", "A0", "A1"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        console.log("setArmsPreGrab", armList);
        for(let targetArm of armList) {
            let pose = { duration:300, wait:false };
            if (targetArm == "CC" || targetArm == "AA") { pose.a1 = 45; }
            if (targetArm == "C0" || targetArm == "A0") { pose.a1 = 40; pose.a2 = 95; pose.a3 = 190; }
            if (targetArm == "C1" || targetArm == "A1") { pose.a1 = 5; pose.a2 = 130; pose.a3 = 140; }
            if (targetArm == "C2" || targetArm == "A2") { pose.a1 = 5; pose.a2 = 110; pose.a3 = 140; }
            if (targetArm == "C3" || targetArm == "A3") { pose.a1 = 5; pose.a2 = 120; pose.a3 = 125; pose.a4 = 140; }
            await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
        }
        return true;
    }
    
    async setArmsGrab(parameters){
        //let armList = ["CC","C0","C1", "C2", "C3", "AA", "A0", "A1", "A2", "A3"]
        let armList = ["CC","C0","C1", "AA", "A0", "A1"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        let liftOffset = 0;
        if("liftOffset" in parameters) liftOffset = parameters.liftOffset;
        console.log("setArmsGrab", armList);
        for(let targetArm of armList) {
            let pose = { duration:300, wait:false };
            if (targetArm == "CC" || targetArm == "AA") { pose.a1 = 45; }
            if (targetArm == "C0" || targetArm == "A0") { pose.a1 = 40+liftOffset; pose.a2 = 90; pose.a3 = 130; }
            if (targetArm == "C1" || targetArm == "A1") { pose.a1 = 5+liftOffset; pose.a2 = 105; pose.a3 = 145; }
            if (targetArm == "C2" || targetArm == "A2") { pose.a1 = 5+liftOffset; pose.a2 = 110; pose.a3 = 145; }
            if (targetArm == "C3" || targetArm == "A3") { pose.a1 = 5+liftOffset; pose.a2 = 120; pose.a3 = 125; pose.a4 = 145; }
            await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
        }
        return true;
    }
    
    async setArmsPreRelease(parameters){
        //let armList = ["CC","C0","C1", "C2", "C3", "AA", "A0", "A1", "A2", "A3"]
        let armList = ["CC","C0","C1", "AA", "A0", "A1"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        console.log("setArmsPreRelease", armList);
        for(let targetArm of armList) {
            let pose = { duration:300, wait:false };
            if (targetArm == "CC" || targetArm == "AA") { pose.a1 = 60; }
            if (targetArm == "C0" || targetArm == "A0") { pose.a1 = 50; pose.a2 = 95; pose.a3 = 190; }
            if (targetArm == "C1" || targetArm == "A1") { pose.a1 = 5; pose.a2 = 130; pose.a3 = 125; }
            if (targetArm == "C2" || targetArm == "A2") { pose.a1 = 5; pose.a2 = 110; pose.a3 = 125; }
            if (targetArm == "C3" || targetArm == "A3") { pose.a1 = 5; pose.a2 = 120; pose.a3 = 125; pose.a4 = 125; }
            await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
        }
        return true;
    }
    
    async setArmsRelease(parameters){
        //let armList = ["CC","C0","C1", "C2", "C3", "AA", "A0", "A1", "A2", "A3"]
        let armList = ["CC","C0","C1", "AA", "A0", "A1"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        console.log("setArmsRelease", armList);
        for(let targetArm of armList) {
            let pose = { duration:0, wait:false };
            if (targetArm == "CC" || targetArm == "AA") { pose.a1 = 10; }
            if (targetArm == "C0" || targetArm == "A0") { pose.a1 = 50; pose.a2 = 95; pose.a3 = 190; }
            if (targetArm == "C1" || targetArm == "A1") { pose.a1 = 5; pose.a2 = 130; pose.a3 = 190; }
            if (targetArm == "C2" || targetArm == "A2") { pose.a1 = 5; pose.a2 = 110; pose.a3 = 190; }
            if (targetArm == "C3" || targetArm == "A3") { pose.a1 = 5; pose.a2 = 120; pose.a3 = 125; pose.a4 = 190; }
            await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
        }
        return true;
    }
    
    async setArmsPrepareFlag(parameters){
        if (this.modules.arm) {
            await this.modules.arm.setServo({name:"A3S", angle: 150});
            await this.modules.arm.setServo({name:"A2S", angle: 110});
        }
        await utils.sleep(150);
        await this.setArmsAt(Object.assign({}, {pose:{a1:190, a2:70, a3:160, duration:300, wait:false}}, parameters, {armList:["A1"]}));
        return true;
    }
    
    async setArmsLowerFlag(parameters){
        await this.setArmsAt(Object.assign({}, {pose:{a1:50, a2:70, a3:160, duration:0, wait:false}}, parameters, {armList:["A1"]}));
        return true;
    }
    
    async setArmsReleaseFlag(parameters){
        await this.setArmsAt(Object.assign({}, {pose:{a1:50, a2:80, a3:130, duration:0, wait:false}}, parameters, {armList:["A1"]}));
        await utils.sleep(300);
        await this.setArmsAt(Object.assign({}, {pose:{a1:50, a2:40, a3:190, duration:0, wait:false}}, parameters, {armList:["A1"]}));
        return true;
    }
    
    async identifyStartZone(parameters){
        let result = true;
        // Get zone list
        let zoneTypes = ["buildReserved", "buildMiddle", "buildBottom"]
        let zoneList = [];
        for(let type of zoneTypes) {
            zoneList.push(...this.app.map.getComponentList(type, this.team));
        }
        // Find if inside
        for(let zone of zoneList){
            let isInZone = this.app.map.isContainedIn(this.x, this.y, zone);
            if(isInZone) {
                this.variables.startZone.value = zone.name;
                break;
            }
        }
        return result;
    }

    async depositFlag(parameters){
        let result = true;

        // Forward
        this.disableColisions = true;
        result = await this.moveAtAngle({
            angle: this.angle,
            distance:   150,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   10||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  3||parameters.nearAngle||this.app.goals.defaultNearAngle,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            preventLocalisation: true,
            preventPathFinding: true
        });
        this.disableColisions = false;

        await this.setArmsLowerFlag({});
        await this.setArmsReleaseFlag({});

        // Backward
        result = await this.moveAtAngle({
            angle: this.angle,
            distance:   -300,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            preventLocalisation: true,
            preventPathFinding: true
        });
        
        return result;
    }
    
    
    async goGrabElements(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "goGrabElements params", parameters);
        await this.setArmsPacked({});
        
        // Find arm
        let armList = ["C1","A1","C2", "A2", "CC","AA", "C3", "A3"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;    
        
        let targetArm_CInside = "";
        let targetArm_AInside = "";
        let targetArm_COutside = "";
        let targetArm_AOutside = "";
        let targetAngleOffset = 0;
        for(let targetArm of armList) {
            if(this.variables["arm"+targetArm].value == ""){
                if (targetArm_CInside=="" && targetArm.startsWith("C")) { targetArm_CInside=targetArm; continue; }
                if (targetArm_AInside=="" && targetArm.startsWith("A")) { targetArm_AInside=targetArm; continue; }
                if (targetArm_COutside=="" && targetArm.startsWith("C")) { targetArm_COutside=targetArm; continue; }
                if (targetArm_AOutside=="" && targetArm.startsWith("A")) { targetArm_AOutside=targetArm; continue; }
            }
        }
        let targetArm_Planche = ["C0", "A0"];
        /*if(this.variables["armC0"].value != "") {
            if(this.variables["armA0"].value = "") { targetArm_Planche = "A0"; }
            else {
                this.app.logger.log(this.app.intelligence.currentTime, "No arm available for planche");
                return false;
            }
        }*/
        this.app.logger.log(this.app.intelligence.currentTime, "Inside", targetArm_CInside, targetArm_AInside, "Outside", targetArm_COutside, targetArm_AOutside, "Planche",targetArm_Planche );

        if(targetArm_CInside == "" || targetArm_AInside == "") return false;
        if(targetArm_COutside == "" || targetArm_AOutside == "") return false;
        if(targetArm_Planche.length == 0) return false;
        
        
        // List elements
        let teamColor = parameters.color||this.team;
        let opposit = "blue";
        if (this.team=="blue") opposit = "yellow";
        if(parameters.opposit) teamColor=opposit;
        let elementList = []
        this.app.logger.log("team color", teamColor);
        if(parameters.zoneName) {
            elementList.push(this.app.map.getComponentByName(parameters.zoneName));
        }
        else {
            let elementTypes = ["element"];
            if(parameters.elementTypes) {
                elementTypes = parameters.elementTypes;
                for(let type of elementTypes) {
                    elementList.push(...this.app.map.getComponentList(type, teamColor));
                }
            }
            else {
                for(let type of elementTypes) {
                    elementList.push(...this.app.map.getComponentList(type));
                }
            }
        }
        this.app.logger.log("elementList ", elementList)
        // Indentify closest element and access point
        let accessTag = "" || parameters.accessTag;
        let targetElement = null;
        let targetAccess = null
        let minLength = 99999999999;
        let targetDist = 0;
        for(let element of elementList){
            let accessList = []
            let distMalus = 0;
            if(element.attempts) distMalus = 2800*element.attempts;
            if(parameters.opposit) {
                // Aim for zone where ennemy went
                let historyX = element.access.x;
                let historyY = element.access.y;
                let historyValue = this.app.map.getHistoryAt(historyX, historyY).value
                distMalus -= 20 * historyValue;
                this.app.logger.log("HISTORY of", element.name, "is", historyValue, "at", historyX, historyY, "stolen", element.alreadyStolen); 
                if(element.alreadyStolen) continue;
            }
            if(element.access) accessList.push(element.access);
            if(element.otherAccess) accessList.push(...element.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                if(accessTag){
                   if(access.tags && access.tags.includes(accessTag)){
                        minLength = utils.getDistance(this.x, this.y, access.x, access.y);//dist
                        targetAccess = access;
                        targetElement = element;
                        break;
                   } 
                }
                else {
                    let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                    
                    if(path.length<2) continue;
                    if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                    let pathLength = this.app.map.getPathLength(path);
                    if((pathLength+distMalus)<minLength/* && pathLength > 50*/){
                        minLength = pathLength+distMalus;
                        targetDist = pathLength;
                        targetAccess = access;
                        targetElement = element;
                    }
                }
            }
        }
        
        if(targetElement === null){
            this.app.logger.log("  -> Target element not found ");
            return false
        }
        if(targetAccess === null){
            this.app.logger.log("  -> No access found for component "+targetElement.name);
            return false
        }
        
        if(targetElement.attempts)  targetElement.attempts += 1;
        else targetElement.attempts = 1;
        
        this.app.logger.log("goGrabElements", targetElement.name);
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        
        // Compute move speed
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(targetDist>0 && targetDist < 600) moveSpeed *= 0.5;
        this.app.logger.log({targetDist},{moveSpeed},{grabOrientation})
        
            
        {
            
            // Move to target
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      grabOrientation,
                speed:      moveSpeed,
                angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
                accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
                nearDist:   250||parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  20||parameters.nearAngle||this.app.goals.defaultNearAngle,
                preventBreak: true
            });
            if(!result) return result;

            // Refine end position
            result = await this.moveCorrectPosition({
                speed: (parameters.speed||this.app.goals.defaultSpeed)/2
            });

            await this.setArmsPreGrab({armList:targetArm_Planche, duration:200, wait:false});
            await this.setArmsPreGrab({armList:[targetArm_CInside, targetArm_AInside], duration:200, wait:false});
            await this.setArmsPreGrab({armList:[targetArm_COutside, targetArm_AOutside], duration:200, wait:false});
            
            // Move forward (no wait)
            result = await this.moveAtAngle({
                angle: targetAccess.angle,
                distance: 250,
                speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   50,
                nearAngle:  5,
                preventLocalisation: true,
                preventBreak: false
            })
            if(!result) return result;

            result = await this.grabElements({startDelay:0, armList:[targetArm_CInside, targetArm_AInside, targetArm_COutside, targetArm_AOutside, targetArm_Planche], startDelay: 0});
            if(!result) return result;
        }
        
        this.removeFromMap({component:targetElement});
        
        if(!result) return false;
        
        return true;
    }
    
    async grabElements(parameters){
        let armList = []
        if("armList" in parameters) armList = parameters.armList;
        this.app.logger.log("grabElements", armList);
        if(armList.length == 0) return false;
        
        // Start delay
        if("startDelay" in parameters) await utils.sleep(parameters.startDelay);

        // Remove stress on arms
        await this.setArmsPreRelease({});
        await utils.sleep(300);
        
        // Check has element
        /*let checkList = {}
        for(let currArm of armList){
            // Move arm to test point slowly
            checkList[currArm] = {arm:currArm, checkAngle:150, clampName:""};
            if(currArm=="CC" || currArm=="AA") {checkList[currArm].checkAngle = 20;  checkList[currArm].clampName = "AC"+currArm[0]; }
            if(currArm=="C0" || currArm=="A0") {checkList[currArm].checkAngle = 130; checkList[currArm].clampName = currArm+"C"; }
            if(currArm=="C1" || currArm=="A1") {checkList[currArm].checkAngle = 170; checkList[currArm].clampName = currArm+"C"; }
            if(currArm=="C2" || currArm=="A2") {checkList[currArm].checkAngle = 170; checkList[currArm].clampName = currArm+"C"; }
            if(currArm=="C3" || currArm=="A3") {checkList[currArm].checkAngle = 170; checkList[currArm].clampName = currArm+"C"; }
            if(this.modules.arm){
                await this.modules.arm.setServo({ name: checkList[currArm].clampName, angle: checkList[currArm].checkAngle, duration: 500, wait:false});
            }
        }
        await utils.sleep(500);
        // Check prehension
        for(let checkArmName in checkList){
            let checkArm = checkList[checkArmName];
            let hasElement = true;
            if(this.modules.arm){
                let servo1 = await this.modules.arm.getServo({ name: checkArm.clampName });
                let diff1 = Math.abs(servo1.position - checkArm.checkAngle);
                hasElement = (diff1 >= 10);
                this.app.logger.log("clamp", checkArm.clampName, "hasElement", hasElement, servo1, checkArm.checkAngle, diff1 )
            }
            if(hasElement) {
                this.setVariable({name:"arm"+checkArm.arm, value:"E"});
            }
        }*/
        
        for(let currArm of armList){
            this.setVariable({name:"arm"+currArm, value:"E"});
        }

        await this.setArmsGrab({duration: 300, wait:false});
        await utils.sleep(300);
        
        // Lift
        await this.setArmsGrab({liftOffset: 10, duration: 300});

        return true;
    }
    
    async depositInBuildZone(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "deposit in build zone");

        // List deposit sites
        let teamColor = parameters.color||this.team;
        let targetList = []
        let targetTypes = ["buildMiddle", "buildBottom", "buildBottomSide", "buildBottomCenter"];
        if(parameters.targetTypes) targetTypes = parameters.targetTypes;
        for(let type of targetTypes) {
            targetList.push(...this.app.map.getComponentList(type, teamColor));
        }
        this.app.logger.log("targetList", targetList)
        // Indentify closest deposit site
        let targetElement = null;
        let targetAccess = null
        let minLength = 99999999999;
        let targetDist = 0;
        for(let elem of targetList){
            let accessList = []
            let distMalus = 0;
            if(elem.elementCount) distMalus = 2600*elem.elementCount;
            if(elem.elementCount && elem.maxElem && elem.elementCount>=elem.maxElem) continue;
            if(elem.access) accessList.push(elem.access);
            if(elem.otherAccess) accessList.push(...elem.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength+distMalus<minLength/* && pathLength > 50*/){
                    minLength = pathLength+distMalus;
                    targetDist = pathLength;
                    targetAccess = access;
                    targetElement = elem;
                }
            }
        }
        
        if(targetElement === null){
            this.app.logger.log("  -> Target element not found ");
            return false
        }
        if(targetAccess === null){
            this.app.logger.log("  -> No access found for component "+targetElement.name);
            return false
        }
        
        //Adapt speed to proximity
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(minLength < 800) moveSpeed *= 0.5;

        let targetAngleOffset = 0;
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        // Refine end position
        result = await this.moveCorrectPosition({
            speed: (parameters.speed||this.app.goals.defaultSpeed)/2
        });
        
        // Simple deposit
        // Find arms with elements
        let armList = ["C0","A0","C1","A1","C2", "A2", "CC","AA", "C3", "A3"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;    
        
        let armsWithElem = [];
        for(let targetArm of armList) {
            if(this.variables["arm"+targetArm].value != ""){
                armsWithElem.push(targetArm);
            }
        }
        // Lower arms
        /*for(let currArm of armsWithElem) {
            let liftHeight = 180;
            let liftName="";
            if(currArm=="CC" || currArm=="AA") { continue; }
            if(currArm=="C0" || currArm=="A0") { liftHeight = 45; liftName = currArm+"L"; }
            if(currArm=="C1" || currArm=="A1") { liftHeight = 5; liftName = currArm+"L"; }
            if(currArm=="C2" || currArm=="A2") { liftHeight = 5; liftName = currArm+"L"; }
            if(currArm=="C3" || currArm=="A3") { liftHeight = 5; liftName = currArm+"L"; }
            if(this.modules.arm){
                await this.modules.arm.setServo({ name: liftName, angle: liftHeight, duration: 500, wait:false});
            }
        }*/

        // Move forward
        let forwardDist = 300;
        if(targetElement.maxElem==1) forwardDist = 150
        if(targetElement.elementCount) forwardDist-= 50 * targetElement.elementCount;
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: forwardDist ,
            speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   25,
            nearAngle:  5,
            preventLocalisation: true
        });
        if(!result) return result;
        
        // Prepare release
        await this.setArmsPreRelease({});
        await utils.sleep(500);

        // Release elements
        await this.setArmsRelease({});
        for(let currArm of armsWithElem) {
            this.setVariable({name:"arm"+currArm, value:""});
        }

        if(targetElement.elementCount)  targetElement.elementCount += 1;
        else targetElement.elementCount = 1;

        this.addScore(4);
        
        // Backward
        await this.moveAtAngle({
            angle: grabOrientation,
            distance: -200,
            speed: 0.5,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: true
        });
        await this.setArmsPacked({armList:armsWithElem, wait: false});
        
        if(!result) return result;
        return result;
    }
    
    
    async testSetPosition(parameters){
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:true});
    }
    
    async testOrientation(parameters){
        this.setArmsPacked({});
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:true});
        
        let speed = parameters.speed||this.app.goals.defaultSpeed;
        for(let i=0;i<5;i++){
            let result = await this.rotateToAngle({ angle: 90, speed, preventLocalisation: true });
            result = await this.rotateToAngle({ angle: 180, speed, preventLocalisation: true });
            result = await this.rotateToAngle({ angle: -90, speed, preventLocalisation: true });
            result = await this.rotateToAngle({ angle: 0, speed, preventLocalisation: true });
            await utils.sleep(3000);
        }
        
        return true;
    }
    
    async testDistance(parameters){
        this.setArmsPacked({});
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:true});
        
        // Move Forward
        let result = await this.moveAtAngle({
            angle: 0,
            distance:   parameters.distance,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            preventLocalisation: true
        });
        
        return true;
    }
    
    async testAngle(parameters){
        this.setArmsPacked({});
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:true});
        
        // Spin
        let result = await this.moveAtAngle({
            endAngle: parameters.distance,
            angle: this.angle,
            distance:   0,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultSpeed*180,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        
        return true;
    }
    
    async testFindAndGrabCake(parameters){
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        //return true;
        return await this.findAndGrabCake({doNotMoveToSite:true});
    }
    
    async delay(parameters){
        await utils.sleep(parameters.duration);
        return true;
    }
    
    async returnToEndZone(parameters){
        let result = true;
        this.setVariable({name:"endReached", value:false});
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let platesTypes = ["plateProtected", "plateMiddleTop", "plateMiddleBottom", "plateBottomSide", "plateBottom"];
        if(parameters.plateTypes) platesTypes = parameters.plateTypes;
        for(let type of platesTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        // Identify if we're already in the good end zone
        let actualEndZoneValue = 0;
        let maxZoneValue = 0;
        let maxZone = null;
        for(let zone of plateList){
            if(zone.name == this.variables.endZone.value){
                if(zone.endZone) actualEndZoneValue = zone.endZone;
            }
            let zoneValue = 0;
            if(zone.endZone) zoneValue = zone.endZone;
            if(maxZoneValue<zoneValue){
                maxZoneValue = zoneValue;
                maxZone = zone;
            }
        }
        if(actualEndZoneValue != maxZoneValue && !parameters.ignoreSelected){
            plateList = [maxZone];
        }
        
        // Indentify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            if(plate.cakes) continue;
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(plate.endAccess) accessList = [...plate.endAccess];
            if(accessList.length == 0) continue;
            let isActualZone = this.variables.endZone.value == plate.name;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if (pathLength<minLength && !isActualZone && pathLength > 50){
                    minLength = pathLength;
                    targetAccess = access;
                    targetPlate = plate;
                }
            }
        }
        
        if(targetPlate === null){
            this.app.logger.log("  -> Target plate not found ");
            return false
        }
        if(targetAccess === null){
            this.app.logger.log("  -> No access found for component "+targetPlate.name);
            return false
        }
        
        // Send new end zone info
        if(parameters.ignoreSelected || maxZoneValue==0){
            this.updateMapComponent({component: targetPlate, diff:{endZone: maxZoneValue+1}});
        }
        this.setVariable({name:"endZone", value:targetPlate.name});
        
        // Lower arms before deposit
        await this.setArmToLayer({name:"ACG", layer:0, open:false, transport: true});
        await this.setArmToLayer({name:"ABG", layer:0, open:false, transport: true});
        await this.setArmToLayer({name:"BCG", layer:0, open:false, transport: true});
        
        // Move to plate
        this.app.logger.log("  -> Moving to end zone "+targetPlate.name);
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   200,
            nearAngle:  20
        });
        if(!result) return result;
        
        let collisionDistanceBackup = this.collisionDistance;
        this.collisionDistance = this.radius+50;
        result = await this.moveCorrectPosition({
            speed: parameters.speed||this.app.goals.defaultSpeed
        });
        if(!result){
            this.collisionDistance = collisionDistanceBackup;
            return result;
        }
        
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 75,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        this.collisionDistance = collisionDistanceBackup;
        if(!result) return result;
        this.setVariable({name:"endReached", value:true});
        return result;
    }
    
    async returnToSpecificEndZone(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "return to specific end zone", parameters)
        
        //Remove every element on the map
        let plantList = this.app.map.getComponentList(["element"]);
        for(let plant of plantList){
            this.app.logger.log("remove before end zone", plant.name);
            this.removeFromMap({component: plant});
        }
        
        //await this.armFreePlants({});
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let zoneList = []
        let zonesTypes = ["buildReserved"];
        if(parameters.zoneTypes) zonesTypes = parameters.zoneTypes;
        for(let type of zonesTypes) {
            zoneList.push(...this.app.map.getComponentList(type, teamColor));
        }
        
        
        // Indentify closest zone
        let targetZone = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let zone of zoneList){
            if(zone.name == this.variables.startZone.value) continue;
            //if(zone.cakes) continue;
            let accessList = []
            if(zone.access) accessList.push(zone.access);
            if(zone.otherAccess) accessList.push(...zone.otherAccess);
            if(zone.endAccess) accessList = [...zone.endAccess];
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if (pathLength<minLength && pathLength > 50){
                    minLength = pathLength;
                    targetAccess = access;
                    targetZone = zone;
                }
            }
        }
        
        if(targetZone === null){
            this.app.logger.log("  -> Target zone not found ");
            return false
        }
        if(targetAccess === null){
            this.app.logger.log("  -> No access found for component "+targetZone.name);
            return false
        }
        
        
        // Move to zone
        this.app.logger.log("  -> Moving to end zone "+targetZone.name);
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            accelDist:  parameters.accelDist||this.defaultAccel,
            deccelDist:  2*(parameters.accelDist||this.defaultAccel),
            nearDist:   200,
            nearAngle:  20
        });
        if(!result) return result;
        
        let collisionDistanceBackup = this.collisionDistance;
        this.collisionDistance = this.radius;
        result = await this.moveCorrectPosition({
            speed: parameters.speed||this.app.goals.defaultSpeed
        });
        if(!result){
            this.collisionDistance = collisionDistanceBackup;
            return result;
        }

        await this.setArmsPreGrab({armList:["C0", "A0"], duration:200, wait:false});
        
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 100,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        this.collisionDistance = collisionDistanceBackup;
        if(!result) return result;
        this.setVariable({name:"endReached", value:true});
        
        /*result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: -200,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });*/
        
        // Wait for other robot to reach zone
        /*while(this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-200){ //ms            
            //Search for other robot on map
            let friendList = this.app.map.getComponentList("robotfriend");
            for(friend in friendList){
                console.log(friend)
                let dx = x-friend.shape.x;
                let dy = y-friend.shape.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                if(distance < 800){
                    // add score
                    this.app.logger.log("Adding 15 point for end zone with friend");
                    this.addScore(15);
                    break;
                }
            }
            await utils.sleep(200);
        }*/
        this.app.logger.log("Adding end zone point");
        this.addScore(10);
        
        
        //this.app.logger.log("Adding funny action point");
        //this.addScore(5);
                    
        return result;
    }
    
    /*async performEndingMove(parameters){
        if(this.variables.endZone.value==0) return false;
        let result = true;
        
        let armPose = { a1:90, a2:90, a3:90, a4:90, a5:90, duration:200 };
        if(this.modules.arm) result = await this.modules.arm.setPose(armPose);
        if(!result) return result;
        
        let endingArea = this.variables.endZone.value==1?"endingAreaNorth":"endingAreaSouth";
        result = await this.moveToComponent({ component: endingArea, speed: 0.4 });
        if(!result) return result;
        
        this.addScore(20);
        return true;
    }*/
    async dance2023(){
        //let status = await this.modules.controlPanel.getStart();
        //while(!status.start){ await utils.sleep(50); };
        await this.modules.base.enableManual();
        await this.modules.base.enableMove();
        let packedAngle = 110;
        let openAngle = 170;
        
        for(let u=0;u<2;u++){
            this.setArmsPacked({});
            if(this.modules.arm) await this.modules.arm.setLed({ brightness: 0, color: 0});
            //await utils.sleep(650);
                
            for(let i=0;i<4;i++){
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 40 });
                await utils.sleep(780);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -40 });
                await utils.sleep(780);
            }
            //6.5s
            await this.modules.base.moveManual({ moveAngle: 90, moveSpeed: 0.2, angleSpeed: 0 });
            await utils.sleep(780);
            await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
            
            let servoSpeed = 500;
            for(let i=0;i<6;i++){
                let delay = 390;
                await this.setDoorsPreGrab({duration:servoSpeed, wait:false});
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 80 });
                await utils.sleep(delay);
                
                await this.setDoorsFlat({duration:servoSpeed, wait:false});
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -80 });
                await utils.sleep(delay);
            }
            /*await this.modules.arm.setServo({ name: "ACC", angle: packedAngle, duration: 0, wait:false});
            await this.modules.arm.setServo({ name: "BCB", angle: packedAngle, duration: 0, wait:false});
            await this.modules.arm.setServo({ name: "ABA", angle: packedAngle, duration: 0, wait:false});
            await this.modules.arm.setServo({ name: "ACA", angle: packedAngle, duration: 0, wait:false});
            await this.modules.arm.setServo({ name: "BCC", angle: packedAngle, duration: 0, wait:false});
            await this.modules.arm.setServo({ name: "ABB", angle: packedAngle, duration: 0, wait:false});
            */
            await this.setDoorsFlat({duration:servoSpeed, wait:false});
            await this.modules.base.moveManual({ moveAngle: 180, moveSpeed: 0.2, angleSpeed: 0 });
            await utils.sleep(780);
            //16s
            for(let i=0;i<6;i++){
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0.0, angleSpeed: 80 });
                await this.setDoorsGroup({duration:servoSpeed, wait:false});
                await this.setArmsPacked({duration:servoSpeed, wait:false});
                await utils.sleep(390);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0.0, angleSpeed: -80 });
                await this.setDoorsFlat({duration:servoSpeed, wait:false});
                await this.setArmsStore({duration:servoSpeed, wait:false});
                await utils.sleep(390);
            }
            
            await this.setDoorsFlat({duration:servoSpeed, wait:false});
            await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 160 });
            await utils.sleep(780);
            await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
            
            //19s
            for(let i=0;i<4;i++){
                await this.setArmsStore({armList:["AC"], duration:servoSpeed, wait:false});
                await utils.sleep(333);
                await this.setArmsPacked({armList:["AC"], duration:servoSpeed, wait:false});
                await utils.sleep(333);
                
                await this.setArmsStore({armList:["BC"], duration:servoSpeed, wait:false});
                await utils.sleep(333);
                await this.setArmsPacked({armList:["BC"], duration:servoSpeed, wait:false});
                await utils.sleep(333);
                
                //await this.setArmsPreStealPlanter({armList:["AB"], duration:servoSpeed, wait:false});
                await this.setArmsPacked({armList:["AB"], duration:servoSpeed, wait:false});
                await utils.sleep(333);
            }
            await this.setArmsPacked({duration:servoSpeed, wait:false});
            await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0.2, angleSpeed: 0 });
            await utils.sleep(100);
            
            //laser
            for(let i=0;i<4;i++) {
                await this.modules.base.moveManual({ moveAngle: 90, moveSpeed: 0.2, angleSpeed: 0 });
                await utils.sleep(350);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
                await utils.sleep(40);
            }
            for(let i=0;i<4;i++) {
                await this.modules.base.moveManual({ moveAngle: -90, moveSpeed: 0.2, angleSpeed: 0 });
                await utils.sleep(350);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
                await utils.sleep(40);
            }
            for(let i=0;i<4;i++) {
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 160 });
                await utils.sleep(350);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
                await utils.sleep(40);
            }
            for(let i=0;i<2;i++) {
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -160 });
                await utils.sleep(350);
                await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
                await utils.sleep(40);
            }
            await utils.sleep(4000);
        }
        
        await this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 0 });
        await this.modules.base.disableMove();
        return false;
    }
    
    async danc1(temporisation=376, iterations=6, high=false){
        let side = true;
        for(let i = 0;i<iterations;i++){
            if(high){
                this.setArmDGH({name:"ACG", duration:0, wait:false});
                this.setArmDGH({name:"ABG", duration:0, wait:false});
                this.setArmDGH({name:"BCG", duration:0, wait:false});
            }
            else
            {
                this.setArmDefault({name:"ACG", duration:0, wait:false});
                this.setArmDefault({name:"ABG", duration:0, wait:false});
                this.setArmDefault({name:"BCG", duration:0, wait:false});
            }
            this.modules.base.moveManual({
                moveAngle: 0,
                moveSpeed: 0,
                angleSpeed: 100
            });
            await utils.sleep(temporisation);
            i++;
            if(i>=iterations){break;}
            if(high){
                this.setArmUH({name:"ACG", duration:0, wait:false});
                this.setArmUH({name:"ABG", duration:0, wait:false});
                this.setArmUH({name:"BCG", duration:0, wait:false});
            }
            else{
                this.setArmUH({name:"ACG", duration:0, wait:false});
                this.setArmUH({name:"ABG", duration:0, wait:false});
                this.setArmUH({name:"BCG", duration:0, wait:false});
            }
            this.modules.base.moveManual({
                moveAngle: 0,
                moveSpeed: 0,
                angleSpeed: -50
            });
            await utils.sleep(temporisation);
        }
        this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0.0,
            angleSpeed: 0
        });
    }
    
    async dance(parameters){
        await this.modules.base.enableManual();
        await this.modules.base.enableMove();
        
        this.setArmUH({name:"ACG", duration:0, wait:false});
        this.setArmUH({name:"ABG", duration:0, wait:false});
        this.setArmUH({name:"BCG", duration:0, wait:false});
        if(this.modules.controlPanel){
            await this.modules.controlPanel.setScore({score:"72"});
            this.app.map.teams = ["TDS", "TDS"];
            await this.modules.controlPanel.setColors();
        }
        
        while(true){
            let status = await this.modules.controlPanel.getStart();
            if(status.start) break;
        }
        await utils.sleep(1900);
        
        let tempo = 376;
        
        for(let i=0;i<3;i++){
            await this.danc1(tempo, 12);
            await this.danc1(tempo/2, 6, true);
            this.setArmSL({name:"ACG", duration:0, wait:false});
            this.setArmSL({name:"ABG", duration:0, wait:false});
            this.setArmSL({name:"BCG", duration:0, wait:false});
            await utils.sleep(tempo);
        }
        this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0,
            angleSpeed: 200
        });
        await utils.sleep(4500);
        await this.danc1(tempo, 2);
        this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0,
            angleSpeed: -200
        });
        await utils.sleep(4500);
        await this.danc1(tempo, 9);
        await utils.sleep(1000);
        this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0,
            angleSpeed: 200
        });
        await utils.sleep(300);
        this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0.0,
            angleSpeed: 0
        });
        return true;
        
        
        
        
        return true;
        for(let i = 0;i<4;i++){
            let repetitions = 9;
            if(i==0) repetitions = 8;
            for(var t=0; t<repetitions;t++)
            {
                side = !side;
                await this.modules.arm.setServo({name:"ACA", angle: side?110:80});
                await this.modules.arm.setServo({name:"ACC", angle: side?110:80});
                await this.modules.arm.setServo({name:"ABA", angle: side?110:80});
                await this.modules.arm.setServo({name:"ABB", angle: side?110:80});
                await this.modules.arm.setServo({name:"BCB", angle: side?110:80});
                await this.modules.arm.setServo({name:"BCC", angle: side?110:80});
                if(t>repetitions-3){
                    await utils.sleep(240);
                }
                else await utils.sleep(480);
                if(i==2 && t==0){
                    await this.modules.base.moveManual({
                    moveAngle: side?90:-90,
                    moveSpeed: 0.3,
                    angleSpeed: side?45:-45
                });
                }
            }
        }
        await this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0,
            angleSpeed: 0
        });
        await utils.sleep(3000);
        
        let armPose = { a1:90, a2:60, a3:90, a4:90, a5:90, duration:200 };
        for(let i = 0;i<5;i++){
            let repetitions = 9;
            if(i==0) repetitions = 8;
            for(var t=0; t<repetitions;t++)
            {
                side = !side;
                armPose.a1 = side?20:110;
                armPose.a2 = side?80:110;
                armPose.a3 = side?80:110;
                armPose.a4 = side?80:110;
                await this.modules.arm.setPose(armPose);
                await this.modules.base.moveManual({
                    moveAngle: side?90:-90,
                    moveSpeed: 0.4,
                    angleSpeed: side?45:-45
                });
                /*if(t>repetitions-3){
                    await utils.sleep(480);
                }
                else*/ await utils.sleep(450);
            }
        }
        await this.modules.base.moveManual({
            moveAngle: 0,
            moveSpeed: 0,
            angleSpeed: 0
        });
        
        
    }
    
    async draw(parameters){
       let path = [ {x : 105.0,y : 452.0},
{x : 89.0,y : 452.0},
{x : 74.0,y : 449.0},
{x : 59.0,y : 450.0},
{x : 47.0,y : 440.0},
{x : 45.0,y : 425.0},
{x : 47.0,y : 410.0},
{x : 57.0,y : 397.0},
{x : 67.0,y : 385.0},
{x : 80.0,y : 375.0},
{x : 67.0,y : 367.0},
{x : 52.0,y : 368.0},
{x : 37.0,y : 369.0},
{x : 22.0,y : 371.0},
{x : 7.0,y : 372.0},
{x : -8.0,y : 374.0},
{x : -23.0,y : 378.0},
{x : -15.0,y : 392.0},
{x : -6.0,y : 405.0},
{x : -4.0,y : 420.0},
{x : -6.0,y : 435.0},
{x : -9.0,y : 450.0},
{x : -24.0,y : 447.0},
{x : -39.0,y : 445.0},
{x : -55.0,y : 445.0},
{x : -70.0,y : 444.0},
{x : -81.0,y : 433.0},
{x : -83.0,y : 418.0},
{x : -79.0,y : 403.0},
{x : -69.0,y : 390.0},
{x : -55.0,y : 383.0},
{x : -70.0,y : 384.0},
{x : -85.0,y : 385.0},
{x : -100.0,y : 387.0},
{x : -115.0,y : 389.0},
{x : -130.0,y : 390.0},
{x : -145.0,y : 393.0},
{x : -132.0,y : 402.0},
{x : -122.0,y : 414.0},
{x : -116.0,y : 429.0},
{x : -113.0,y : 444.0},
{x : -128.0,y : 446.0},
{x : -143.0,y : 445.0},
{x : -158.0,y : 442.0},
{x : -174.0,y : 442.0},
{x : -189.0,y : 443.0},
{x : -204.0,y : 442.0},
{x : -220.0,y : 443.0},
{x : -225.0,y : 428.0},
{x : -220.0,y : 413.0},
{x : -207.0,y : 404.0},
{x : -193.0,y : 397.0},
{x : -208.0,y : 393.0},
{x : -223.0,y : 396.0},
{x : -232.0,y : 383.0},
{x : -232.0,y : 367.0},
{x : -233.0,y : 350.0},
{x : -240.0,y : 335.0},
{x : -243.0,y : 320.0},
{x : -244.0,y : 305.0},
{x : -244.0,y : 289.0},
{x : -245.0,y : 274.0},
{x : -246.0,y : 259.0},
{x : -246.0,y : 242.0},
{x : -243.0,y : 227.0},
{x : -239.0,y : 211.0},
{x : -234.0,y : 195.0},
{x : -231.0,y : 180.0},
{x : -229.0,y : 164.0},
{x : -229.0,y : 148.0},
{x : -228.0,y : 133.0},
{x : -229.0,y : 118.0},
{x : -231.0,y : 103.0},
{x : -233.0,y : 88.0},
{x : -234.0,y : 72.0},
{x : -235.0,y : 57.0},
{x : -236.0,y : 42.0},
{x : -237.0,y : 26.0},
{x : -238.0,y : 11.0},
{x : -238.0,y : -5.0},
{x : -237.0,y : -20.0},
{x : -238.0,y : -36.0},
{x : -236.0,y : -51.0},
{x : -233.0,y : -66.0},
{x : -229.0,y : -82.0},
{x : -229.0,y : -98.0},
{x : -230.0,y : -113.0},
{x : -232.0,y : -128.0},
{x : -235.0,y : -143.0},
{x : -234.0,y : -158.0},
{x : -234.0,y : -175.0},
{x : -233.0,y : -190.0},
{x : -231.0,y : -205.0},
{x : -231.0,y : -221.0},
{x : -233.0,y : -237.0},
{x : -235.0,y : -252.0},
{x : -237.0,y : -267.0},
{x : -238.0,y : -282.0},
{x : -241.0,y : -298.0},
{x : -242.0,y : -313.0},
{x : -244.0,y : -328.0},
{x : -245.0,y : -343.0},
{x : -244.0,y : -360.0},
{x : -242.0,y : -375.0},
{x : -243.0,y : -390.0},
{x : -245.0,y : -405.0},
{x : -247.0,y : -420.0},
{x : -249.0,y : -435.0},
{x : -256.0,y : -449.0},
{x : -260.0,y : -464.0},
{x : -261.0,y : -479.0},
{x : -258.0,y : -494.0},
{x : -254.0,y : -510.0},
{x : -249.0,y : -526.0},
{x : -248.0,y : -541.0},
{x : -263.0,y : -542.0},
{x : -278.0,y : -546.0},
{x : -290.0,y : -556.0},
{x : -296.0,y : -570.0},
{x : -301.0,y : -585.0},
{x : -306.0,y : -600.0},
{x : -308.0,y : -615.0},
{x : -308.0,y : -631.0},
{x : -311.0,y : -646.0},
{x : -313.0,y : -661.0},
{x : -312.0,y : -677.0},
{x : -310.0,y : -693.0},
{x : -306.0,y : -708.0},
{x : -300.0,y : -723.0},
{x : -295.0,y : -738.0},
{x : -287.0,y : -751.0},
{x : -279.0,y : -764.0},
{x : -270.0,y : -778.0},
{x : -261.0,y : -791.0},
{x : -252.0,y : -804.0},
{x : -240.0,y : -815.0},
{x : -229.0,y : -826.0},
{x : -216.0,y : -834.0},
{x : -203.0,y : -842.0},
{x : -189.0,y : -852.0},
{x : -176.0,y : -860.0},
{x : -162.0,y : -867.0},
{x : -147.0,y : -871.0},
{x : -132.0,y : -873.0},
{x : -117.0,y : -874.0},
{x : -102.0,y : -869.0},
{x : -89.0,y : -859.0},
{x : -79.0,y : -846.0},
{x : -70.0,y : -833.0},
{x : -61.0,y : -819.0},
{x : -53.0,y : -806.0},
{x : -43.0,y : -794.0},
{x : -35.0,y : -781.0},
{x : -28.0,y : -767.0},
{x : -22.0,y : -753.0},
{x : -19.0,y : -738.0},
{x : -18.0,y : -723.0},
{x : -17.0,y : -708.0},
{x : -15.0,y : -693.0},
{x : -11.0,y : -678.0},
{x : -5.0,y : -664.0},
{x : -1.0,y : -649.0},
{x : 0.0,y : -633.0},
{x : 0.0,y : -617.0},
{x : 0.0,y : -600.0},
{x : -2.0,y : -585.0},
{x : -4.0,y : -570.0},
{x : -7.0,y : -555.0},
{x : -13.0,y : -541.0},
{x : -19.0,y : -527.0},
{x : -21.0,y : -512.0},
{x : -27.0,y : -498.0},
{x : -42.0,y : -497.0},
{x : -58.0,y : -497.0},
{x : -67.0,y : -484.0},
{x : -64.0,y : -469.0},
{x : -62.0,y : -454.0},
{x : -57.0,y : -439.0},
{x : -52.0,y : -424.0},
{x : -50.0,y : -409.0},
{x : -51.0,y : -394.0},
{x : -53.0,y : -379.0},
{x : -50.0,y : -363.0},
{x : -46.0,y : -347.0},
{x : -41.0,y : -331.0},
{x : -37.0,y : -316.0},
{x : -34.0,y : -301.0},
{x : -31.0,y : -285.0},
{x : -30.0,y : -269.0},
{x : -29.0,y : -254.0},
{x : -27.0,y : -238.0},
{x : -25.0,y : -222.0},
{x : -24.0,y : -207.0},
{x : -21.0,y : -190.0},
{x : -19.0,y : -175.0},
{x : -15.0,y : -160.0},
{x : -11.0,y : -145.0},
{x : -8.0,y : -130.0},
{x : -4.0,y : -115.0},
{x : 0.0,y : -99.0},
{x : 4.0,y : -84.0},
{x : 9.0,y : -69.0},
{x : 13.0,y : -53.0},
{x : 17.0,y : -38.0},
{x : 22.0,y : -21.0},
{x : 28.0,y : -4.0},
{x : 35.0,y : 12.0},
{x : 41.0,y : 28.0},
{x : 47.0,y : 45.0},
{x : 54.0,y : 60.0},
{x : 61.0,y : 77.0},
{x : 66.0,y : 92.0},
{x : 73.0,y : 106.0},
{x : 81.0,y : 122.0},
{x : 87.0,y : 136.0},
{x : 93.0,y : 151.0},
{x : 98.0,y : 167.0},
{x : 102.0,y : 183.0},
{x : 107.0,y : 198.0},
{x : 110.0,y : 214.0},
{x : 114.0,y : 230.0},
{x : 120.0,y : 246.0},
{x : 126.0,y : 260.0},
{x : 132.0,y : 275.0},
{x : 138.0,y : 289.0},
{x : 143.0,y : 304.0},
{x : 149.0,y : 319.0},
{x : 157.0,y : 332.0},
{x : 166.0,y : 345.0},
{x : 153.0,y : 353.0},
{x : 138.0,y : 358.0},
{x : 123.0,y : 362.0},
{x : 107.0,y : 362.0},
{x : 120.0,y : 370.0},
{x : 135.0,y : 374.0},
{x : 147.0,y : 385.0},
{x : 154.0,y : 399.0},
{x : 158.0,y : 415.0},
{x : 160.0,y : 430.0},
{x : 162.0,y : 445.0},
{x : 149.0,y : 454.0},
{x : 134.0,y : 452.0},
{x : 119.0,y : 451.0},
{x : 104.0,y : 450.0},
{x : 118.0,y : 456.0},
{x : 133.0,y : 461.0},
{x : 148.0,y : 454.0},
{x : 162.0,y : 445.0},
{x : 180.0,y : 440.0},
{x : 199.0,y : 438.0},
{x : 219.0,y : 439.0},
{x : 236.0,y : 442.0},
{x : 252.0,y : 447.0},
{x : 267.0,y : 456.0},
{x : 277.0,y : 470.0},
{x : 279.0,y : 485.0},
{x : 271.0,y : 501.0},
{x : 257.0,y : 511.0},
{x : 241.0,y : 513.0},
{x : 229.0,y : 502.0},
{x : 228.0,y : 484.0},
{x : 241.0,y : 474.0},
{x : 256.0,y : 472.0},
{x : 271.0,y : 473.0},
{x : 290.0,y : 479.0},
{x : 303.0,y : 487.0},
{x : 322.0,y : 505.0},
{x : 333.0,y : 521.0},
{x : 339.0,y : 535.0},
{x : 337.0,y : 551.0},
{x : 327.0,y : 566.0},
{x : 312.0,y : 576.0},
{x : 298.0,y : 570.0},
{x : 295.0,y : 554.0},
{x : 295.0,y : 537.0},
{x : 301.0,y : 519.0},
{x : 316.0,y : 507.0},
{x : 333.0,y : 499.0},
{x : 349.0,y : 497.0},
{x : 366.0,y : 498.0},
{x : 382.0,y : 502.0},
{x : 396.0,y : 508.0},
{x : 409.0,y : 518.0},
{x : 420.0,y : 535.0},
{x : 427.0,y : 555.0},
{x : 426.0,y : 571.0},
{x : 422.0,y : 586.0},
{x : 413.0,y : 600.0},
{x : 400.0,y : 610.0},
{x : 384.0,y : 616.0},
{x : 369.0,y : 617.0},
{x : 352.0,y : 609.0},
{x : 344.0,y : 596.0},
{x : 342.0,y : 580.0},
{x : 348.0,y : 562.0},
{x : 364.0,y : 558.0},
{x : 379.0,y : 564.0},
{x : 391.0,y : 576.0},
{x : 400.0,y : 594.0},
{x : 404.0,y : 611.0},
{x : 407.0,y : 626.0},
{x : 407.0,y : 643.0},
{x : 405.0,y : 658.0},
{x : 398.0,y : 678.0},
{x : 387.0,y : 690.0},
{x : 372.0,y : 698.0},
{x : 357.0,y : 692.0},
{x : 351.0,y : 677.0},
{x : 349.0,y : 662.0},
{x : 352.0,y : 646.0},
{x : 367.0,y : 636.0},
{x : 383.0,y : 640.0},
{x : 398.0,y : 653.0},
{x : 405.0,y : 670.0},
{x : 409.0,y : 690.0},
{x : 409.0,y : 709.0},
{x : 404.0,y : 730.0},
{x : 398.0,y : 745.0},
{x : 389.0,y : 759.0},
{x : 368.0,y : 777.0},
{x : 351.0,y : 782.0},
{x : 325.0,y : 783.0},
{x : 299.0,y : 773.0},
{x : 278.0,y : 755.0},
{x : 269.0,y : 741.0},
{x : 267.0,y : 726.0},
{x : 281.0,y : 720.0},
{x : 300.0,y : 724.0},
{x : 317.0,y : 737.0},
{x : 329.0,y : 752.0},
{x : 334.0,y : 767.0},
{x : 336.0,y : 786.0},
{x : 331.0,y : 802.0},
{x : 318.0,y : 818.0},
{x : 301.0,y : 826.0},
{x : 284.0,y : 830.0},
{x : 266.0,y : 828.0},
{x : 248.0,y : 822.0},
{x : 234.0,y : 809.0},
{x : 227.0,y : 792.0},
{x : 227.0,y : 774.0},
{x : 237.0,y : 759.0},
{x : 251.0,y : 751.0},
{x : 272.0,y : 749.0},
{x : 286.0,y : 756.0},
{x : 292.0,y : 770.0},
{x : 291.0,y : 786.0},
{x : 285.0,y : 800.0},
{x : 268.0,y : 822.0},
{x : 253.0,y : 830.0},
{x : 234.0,y : 835.0},
{x : 212.0,y : 833.0},
{x : 196.0,y : 828.0},
{x : 180.0,y : 820.0},
{x : 159.0,y : 802.0},
{x : 144.0,y : 781.0},
{x : 139.0,y : 760.0},
{x : 142.0,y : 745.0},
{x : 159.0,y : 740.0},
{x : 176.0,y : 742.0},
{x : 191.0,y : 755.0},
{x : 198.0,y : 772.0},
{x : 197.0,y : 789.0},
{x : 185.0,y : 802.0},
{x : 168.0,y : 803.0},
{x : 151.0,y : 797.0},
{x : 132.0,y : 785.0},
{x : 120.0,y : 774.0},
{x : 108.0,y : 761.0},
{x : 95.0,y : 744.0},
{x : 88.0,y : 729.0},
{x : 86.0,y : 714.0},
{x : 98.0,y : 704.0},
{x : 116.0,y : 703.0},
{x : 133.0,y : 709.0},
{x : 143.0,y : 722.0},
{x : 140.0,y : 737.0},
{x : 126.0,y : 743.0},
{x : 110.0,y : 742.0},
{x : 96.0,y : 731.0},
{x : 85.0,y : 719.0},
{x : 74.0,y : 698.0},
{x : 70.0,y : 680.0},
{x : 73.0,y : 665.0},
{x : 83.0,y : 652.0},
{x : 100.0,y : 645.0},
{x : 118.0,y : 646.0},
{x : 131.0,y : 657.0},
{x : 131.0,y : 674.0},
{x : 119.0,y : 687.0},
{x : 103.0,y : 688.0},
{x : 85.0,y : 678.0},
{x : 69.0,y : 662.0},
{x : 59.0,y : 649.0},
{x : 47.0,y : 627.0},
{x : 42.0,y : 609.0},
{x : 48.0,y : 594.0},
{x : 63.0,y : 588.0},
{x : 78.0,y : 590.0},
{x : 88.0,y : 605.0},
{x : 82.0,y : 621.0},
{x : 67.0,y : 625.0},
{x : 48.0,y : 618.0},
{x : 32.0,y : 605.0},
{x : 22.0,y : 593.0},
{x : 5.0,y : 567.0},
{x : -2.0,y : 550.0},
{x : -4.0,y : 533.0},
{x : 6.0,y : 520.0},
{x : 22.0,y : 518.0},
{x : 37.0,y : 529.0},
{x : 46.0,y : 543.0},
{x : 49.0,y : 558.0},
{x : 34.0,y : 560.0},
{x : 21.0,y : 551.0},
{x : 7.0,y : 536.0},
{x : -9.0,y : 519.0},
{x : -26.0,y : 497.0},
{x : -30.0,y : 482.0},
{x : -11.0,y : 480.0},
{x : 9.0,y : 491.0},
{x : 23.0,y : 503.0},
{x : 35.0,y : 518.0},
{x : 25.0,y : 530.0},
{x : 11.0,y : 520.0},
{x : -2.0,y : 503.0},
{x : -7.0,y : 488.0},
{x : -9.0,y : 473.0},
{x : 7.0,y : 478.0},
{x : 18.0,y : 493.0},
{x : 27.0,y : 512.0},
{x : 31.0,y : 528.0},
{x : 32.0,y : 544.0},
{x : 28.0,y : 560.0},
{x : 18.0,y : 572.0},
{x : -1.0,y : 577.0},
{x : -17.0,y : 573.0},
{x : -29.0,y : 560.0},
{x : -14.0,y : 559.0},
{x : -6.0,y : 573.0},
{x : -1.0,y : 589.0},
{x : -1.0,y : 608.0},
{x : -4.0,y : 624.0},
{x : -11.0,y : 639.0},
{x : -25.0,y : 646.0},
{x : -41.0,y : 633.0},
{x : -48.0,y : 619.0},
{x : -55.0,y : 599.0},
{x : -44.0,y : 587.0},
{x : -29.0,y : 593.0},
{x : -16.0,y : 609.0},
{x : -9.0,y : 631.0},
{x : -9.0,y : 649.0},
{x : -13.0,y : 665.0},
{x : -20.0,y : 680.0},
{x : -35.0,y : 697.0},
{x : -53.0,y : 707.0},
{x : -73.0,y : 710.0},
{x : -89.0,y : 706.0},
{x : -104.0,y : 698.0},
{x : -113.0,y : 684.0},
{x : -97.0,y : 680.0},
{x : -84.0,y : 688.0},
{x : -72.0,y : 701.0},
{x : -62.0,y : 719.0},
{x : -59.0,y : 737.0},
{x : -61.0,y : 757.0},
{x : -67.0,y : 771.0},
{x : -77.0,y : 785.0},
{x : -92.0,y : 796.0},
{x : -109.0,y : 801.0},
{x : -126.0,y : 802.0},
{x : -150.0,y : 796.0},
{x : -166.0,y : 788.0},
{x : -182.0,y : 773.0},
{x : -185.0,y : 757.0},
{x : -173.0,y : 747.0},
{x : -159.0,y : 754.0},
{x : -155.0,y : 771.0},
{x : -157.0,y : 787.0},
{x : -163.0,y : 803.0},
{x : -176.0,y : 815.0},
{x : -196.0,y : 822.0},
{x : -211.0,y : 823.0},
{x : -231.0,y : 820.0},
{x : -253.0,y : 812.0},
{x : -273.0,y : 796.0},
{x : -284.0,y : 782.0},
{x : -287.0,y : 764.0},
{x : -274.0,y : 754.0},
{x : -257.0,y : 757.0},
{x : -242.0,y : 766.0},
{x : -238.0,y : 781.0},
{x : -240.0,y : 796.0},
{x : -250.0,y : 810.0},
{x : -265.0,y : 817.0},
{x : -284.0,y : 818.0},
{x : -300.0,y : 813.0},
{x : -316.0,y : 807.0},
{x : -332.0,y : 797.0},
{x : -347.0,y : 785.0},
{x : -358.0,y : 772.0},
{x : -363.0,y : 757.0},
{x : -348.0,y : 746.0},
{x : -328.0,y : 747.0},
{x : -310.0,y : 753.0},
{x : -303.0,y : 768.0},
{x : -312.0,y : 781.0},
{x : -326.0,y : 787.0},
{x : -345.0,y : 785.0},
{x : -360.0,y : 780.0},
{x : -376.0,y : 769.0},
{x : -400.0,y : 748.0},
{x : -415.0,y : 727.0},
{x : -426.0,y : 702.0},
{x : -427.0,y : 676.0},
{x : -414.0,y : 656.0},
{x : -398.0,y : 645.0},
{x : -382.0,y : 640.0},
{x : -367.0,y : 646.0},
{x : -359.0,y : 661.0},
{x : -359.0,y : 678.0},
{x : -367.0,y : 692.0},
{x : -384.0,y : 694.0},
{x : -398.0,y : 687.0},
{x : -413.0,y : 676.0},
{x : -428.0,y : 660.0},
{x : -443.0,y : 642.0},
{x : -455.0,y : 621.0},
{x : -453.0,y : 605.0},
{x : -443.0,y : 593.0},
{x : -429.0,y : 585.0},
{x : -412.0,y : 580.0},
{x : -392.0,y : 580.0},
{x : -375.0,y : 584.0},
{x : -361.0,y : 593.0},
{x : -350.0,y : 609.0},
{x : -351.0,y : 625.0},
{x : -365.0,y : 634.0},
{x : -380.0,y : 629.0},
{x : -396.0,y : 617.0},
{x : -408.0,y : 603.0},
{x : -421.0,y : 576.0},
{x : -424.0,y : 547.0},
{x : -418.0,y : 533.0},
{x : -404.0,y : 515.0},
{x : -383.0,y : 502.0},
{x : -366.0,y : 496.0},
{x : -346.0,y : 496.0},
{x : -328.0,y : 503.0},
{x : -314.0,y : 514.0},
{x : -304.0,y : 528.0},
{x : -297.0,y : 543.0},
{x : -296.0,y : 558.0},
{x : -311.0,y : 563.0},
{x : -323.0,y : 552.0},
{x : -331.0,y : 533.0},
{x : -333.0,y : 517.0},
{x : -326.0,y : 499.0},
{x : -313.0,y : 488.0},
{x : -293.0,y : 479.0},
{x : -265.0,y : 475.0},
{x : -249.0,y : 479.0},
{x : -233.0,y : 490.0},
{x : -222.0,y : 504.0},
{x : -221.0,y : 519.0},
{x : -235.0,y : 525.0},
{x : -252.0,y : 514.0},
{x : -263.0,y : 500.0},
{x : -270.0,y : 482.0},
{x : -272.0,y : 465.0},
{x : -265.0,y : 449.0},
{x : -252.0,y : 441.0},
{x : -235.0,y : 437.0},
{x : -208.0,y : 440.0},
{x : -192.0,y : 447.0},
{x : -179.0,y : 457.0}];

        
        this.setArmsPacked({});
        this._updatePosition(0, 0, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:true});
        

        let offset = path[0];
        let ratio = 0.2;
        let i=0;
        for(let point of path){
            let result = await this.moveToPosition({
                x: (point.x - offset.x)*ratio,
                y: (point.y - offset.y)*ratio,
                preventPathFinding: true,
                angle: 0,
                speed: 0.2,
                angleSpeed: 30,
                accelDist: 0.2,
                preventLocalisation: true,
                nearDist: 20,
                nearAngle: 3
            });
            // Move arms
            try{
                if((i%100)==20||(i%100)==40||(i%100)==60||(i%100)==80||(i%100)==100){
                    await this.setArmsPacked({duration:1000, wait:false});
                }
                else if((i%100)==10||(i%100)==30||(i%100)==50||(i%100)==70||(i%100)==90){
                    await this.setArmsGroup({duration:1000, wait:false});
                }
            }
            catch (error){
                
            }
            i++;
            //if(!result) return result;
        }


    }
    
    
    async testMove(parameters){
        await this.modules.arm.setPose({ name: "ACG", a1:62, a2:5, a3:170, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPose({ name: "ACG", a1:172, a2:90, a3:90, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPose({ name: "ACG", a1:172, a2:145, a3:130, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPump({ name: "ACP", value:255 });
        await this.modules.arm.setPose({ name: "ACG", a1:172, a2:158, a3:100, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPose({ name: "ACG", a1:172, a2:145, a3:130, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPose({ name: "ACG", a1:172, a2:90, a3:90, duration:200 });
        await utils.sleep(500);
        await this.modules.arm.setPose({ name: "ACG", a1:62, a2:5, a3:170, duration:200 });
        await utils.sleep(500);
        //await this.modules.arm.setPump({ name: "ACP", value:0 });
        return true;
    }

}

