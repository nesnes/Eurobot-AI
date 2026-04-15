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

delete require.cache[require.resolve('./modules/cameraAI')]; //Delete require() cache
const CameraAI = require('./modules/cameraAI');


const utils = require("../utils")

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
        this.name = "Robot Nesnes TDS"
        this.radius = 120+20;//margin
        this.startPosition = {
            blue:{x:265,y:650,angle:0},
            yellow:{x:150,y:542,angle:0},
            //violet:{x:2850,y:542,angle:180}
        }
        this.variables = {
            // value:{R|G|B|replica|artifact|''}, Side: 0=ready 1=flipped(not ready to drop) 
            // value: {"P"=plant|"PR"=resistante|"PF"=fragile|"M"=metal_pot|""}
            clampAFC: { value: "", label: "AFC" },  
            clampFAC: { value: "", label: "FAC" },  
            clampFCC: { value: "", label: "FCC" },  
            clampCFC: { value: "", label: "CFC" },  
            clampAS4: { value: "", label: "AS4" },  
            clampAS5: { value: "", label: "FS5" },  
            clampCS4: { value: "", label: "CS4" },  
            clampCS5: { value: "", label: "CS5" }, 
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
        this.asyncTaskList = [];
        
        if(!this.app.parameters.simulate){
            this.modules.lidar = new Lidar(app)
            this.modules.lidarLoc = new LidarLoc(app);
            //this.modules.lidarLocalisation = new LidarLocalisation(app)
            this.modules.arm = new Arm(app);
            //this.modules.camera = new Camera(app);
            this.modules.cameraAIFront = new CameraAI(app, "CamAI_AB");
        }
        this.poseList = {
            //##### DEFAULT ########
            "FAG_FCG_default1": {duration:1000, a1:0, a2:180, a3:180, a4:25, a5:180},

            //##### FRONT GRAB ########
            "FFG_frontPreGrab1": {duration:350, a1:187},
            "FCG_frontPreGrab1": {duration:350, a1:93,a2:93},
            "FSG_frontPreGrab1": {duration:350, a1:150,a2:92,a3:0},
            "AFG_CFG_frontPreGrab1": {duration:350, a1:116,a2:111,a3:146,a4:120},
            "FFG_frontGrab1": {duration:350, a1:150},
            "FSG_frontGrab1": {duration:350, a1:174,a2:88,a3:1},
            "FCG_frontGrab1": {duration:30, a1:120,a2:120},
            "AFG_CFG_frontGrab1": {duration:350, a1:116,a2:111,a3:110,a4:100},
            "FSG_frontGrab2": {duration:350, a1:179,a2:98,a3:1},
            "AFG_CFG_frontGrab2": {duration:350, a1:116,a2:111,a3:120,a4:120},
            "FSG_frontGrab3": {duration:100, a1:175,a2:91,a3:1},

            //##### FRONT GRAB TIGHT ########
            "AFG_CFG_frontPreGrabTight1": {duration:350, a1:116,a2:111,a3:113,a4:126},
            "FFG_frontPreGrabTight1": {duration:350, a1:187},
            "FCG_frontPreGrabTight1": {duration:350, a1:93,a2:93},
            "FSG_frontPreGrabTight1": {duration:350, a1:150,a2:92,a3:0},
            "AFG_CFG_frontGrabTight1": {duration:350, a1:116,a2:111,a3:126,a4:126},
            "FSG_frontGrabTight2": {duration:350, a1:179,a2:98,a3:1},
            "FSG_frontGrabTight3": {duration:100, a1:175,a2:91,a3:1},

            //##### FRONT FREE ALL ########
            "AFG_CFG_frontFreeAll1": {duration:600, a1:218,a2:157,a3:134,a4:150},
            "AFG_CFG_frontFreeAll2": {duration:600, a1:116,a2:111,a3:146,a4:150},
                "AFG_frontFreeAll3": {duration:350, a1:110,a2:102,a3:272,a4:150},
                "CFG_frontFreeAll4": {duration:350, a1:110,a2:102,a3:272,a4:150},
            "FFG_frontFreeAll4": {duration:350, a1:206},
            "FSG_frontFreeAll4": {duration:350, a1:174,a2:88,a3:0},
            "FCG_frontFreeAll4": {duration:350, a1:208,a2:208},

            //###### FRONT STORE ######
            "AFG_frontStore1": {duration:500, a1:93,a2:89,a3:274,a4:120},
            "CFG_frontStore2": {duration:500, a1:93,a2:89,a3:274,a4:120},
            "AFG_CFG_frontStore3": {duration:500, a1:97,a2:29,a3:216,a4:120},
            "AFG_CFG_frontStore4": {duration:500, a1:153,a2:58,a3:182,a4:120},
            "AFG_CFG_frontStore5": {duration:500, a1:194,a2:103,a3:158,a4:120},
            "AFG_CFG_frontStore6": {duration:500, a1:268,a2:183,a3:118,a4:120},
            "AFG_CFG_frontStore7": {duration:500, a1:279,a2:191,a3:88,a4:120},
            //"AFG_CFG_frontStore5": {duration:500, a1:268,a2:173,a3:111,a4:120},
            //"AFG_CFG_frontStore6": {duration:500, a1:278,a2:210,a3:113,a4:120},

            //###### FRONT BUILD ######
            "FFG_frontBuild1": {duration:500, a1:206}, // 1st stage planche released
            "FCG_frontBuild1": {duration:500, a1:208,a2:208}, // Open 1st stage
            "AFG_CFG_frontBuild1": {duration:200, a1:279,a2:197,a3:108,a4:120},
            "FSG_frontBuild1": {duration:500, a1:150,a2:63,a3:1}, // 2nd stage planche high
            "FSG_frontBuild2": {duration:500, a1:162,a2:160,a3:1}, // 2nd stage planche vertical
            "FCG_frontBuild2": {duration:500, a1:208,a2:208}, // Make sure to open 1st stage
            "AFG_CFG_frontBuild3": {duration:500, a1:295,a2:300,a3:147,a4:115}, // 2nd stage cans on 1st stage
            "FSG_frontBuild4": {duration:500, a1:157,a2:243,a3:1}, // Planche above cans 2nd stage
            "FSG_frontBuild5": {duration:200, a1:157,a2:243,a3:1}, // Pause above cans 2nd stage
            "FSG_frontBuild6": {duration:500, a1:193,a2:278,a3:1}, // Compress 2nd stage
            "AFG_CFG_frontBuild5": {duration:500, a1:295,a2:300,a3:147,a4:162}, // 2nd stage cans release
            "FSG_frontBuild7": {duration:500, a1:201,a2:281,a3:0}, // Release planche 2nd stage
            "AFG_CFG_frontBuild8": {duration:500, a1:295,a2:297,a3:160,a4:162}, // 2nd stage cans cleared
            "FSG_frontBuild8": {duration:500, a1:201,a2:281,a3:0}, // Make sure release planche 2nd stage
            "AFG_CFG_frontPostBuild1": {duration:750, a1:211,a2:165,a3:255,a4:96}, // 2nd stage cans cleared
            "AFG_CFG_frontPostBuild2": {duration:500, a1:144,a2:65,a3:191,a4:134}, // 2nd stage cans cleared

            //##### BACK GRAB ########
            "BBG_backPreGrab1": {duration:300, a1:178},
            "BSG_backPreGrab1": {duration:300, a1:180,a2:156,a3:73,a4:0},
            "ASG_CSG_backPreGrab2": {duration:400, a1:166,a2:226,a3:297,a4:190,a5:100,a6:120},
            "ASG_CSG_backPreGrab3": {duration:400, a1:175,a2:160,a3:259,a4:165,a5:100,a6:120},
            "ASG_CSG_backPreGrab4": {duration:400, a1:170,a2:149,a3:235,a4:92,a5:100,a6:120},
            "BBG_backPreGrab4": {duration:500, a1:190},
            "BBG_backGrab1": {duration:550, a1:150},
            "BSG_backGrab1": {duration:500, a1:180,a2:191,a3:96,a4:1},
            "BSG_backGrab2": {duration:500, a1:180,a2:192,a3:114,a4:1},
            "ASG_CSG_backGrab2": {duration:500, a1:151,a2:157,a3:242,a4:61,a5:100,a6:120},
            "BSG_backGrab3": {duration:300, a1:180,a2:179,a3:95,a4:1},

            //##### BACK STORE ########
            "BSG_backStore1": {duration:500, a1:180,a2:152,a3:79,a4:1},
            "BBG_backStore1": {duration:500, a1:140},
            "ASG_CSG_backStore1": {duration:500, a1:168,a2:140,a3:224,a4:90,a5:100,a6:120},
            "ASG_CSG_backStore2": {duration:600, a1:168,a2:135,a3:208,a4:89,a5:100,a6:120},
            "ASG_CSG_backStore3": {duration:350, a1:184,a2:138,a3:228,a4:198,a5:100,a6:120},
            "ASG_CSG_backStore4": {duration:350, a1:169,a2:177,a3:290,a4:196,a5:100,a6:120},
            //"BBG_backStore5": {duration:500, a1:183},
            "BSG_backStore5": {duration:350, a1:180,a2:173,a3:89,a4:1},
            "ASG_CSG_backStore6": {duration:750, a1:169,a2:278,a3:227,a4:199,a5:100,a6:120},
            "ASG_CSG_backStore7": {duration:350, a1:224,a2:278,a3:209,a4:203,a5:100,a6:120},

            //##### BACK BUILD ########
            "BBG_backBuild1": {duration:250, a1:166},
            "BSG_backBuild2": {duration:300, a1:180,a2:152,a3:72,a4:1},
            "BSG_backBuild3": {duration:300, a1:180,a2:152,a3:189,a4:1},
            "ASG_CSG_backBuild4": {duration:350, a1:155,a2:259,a3:159,a4:279,a5:100,a6:120},
            "ASG_CSG_backBuild5": {duration:750, a1:128,a2:158,a3:60,a4:316,a5:100,a6:120},
            "BSG_backBuild6": {duration:400, a1:180,a2:158,a3:272,a4:1},
            "BSG_backBuild7": {duration:400, a1:180,a2:184,a3:293,a4:1},
            "BSG_backBuild8": {duration:400, a1:180,a2:200,a3:301,a4:0},
            "BSG_backBuild9": {duration:400, a1:180,a2:217,a3:300,a4:0},
            "BBG_backBuild10": {duration:400, a1:179},
            "ASG_CSG_backBuild11": {duration:250, a1:155,a2:259,a3:159,a4:279,a5:130,a6:150},
            "ASG_CSG_backBuild11": {duration:500, a1:128,a2:158,a3:60,a4:316,a5:130,a6:150},

            "ASG_CSG_backPostBuild1": {duration:500, a1:128,a2:158,a3:60,a4:316,a5:130,a6:150},
            "ASG_CSG_backPostBuild2": {duration:500, a1:177,a2:257,a3:165,a4:243,a5:130,a6:150},

            //##### BACK FREE ALL ########
            "BBG_backFreeAll1": {duration:300, a1:127},
            "ASG_CSG_backFreeAll1": {duration:500, a1:184,a2:149,a3:240,a4:188,a5:130,a6:150},

        }
    }

    addAsyncTask(task){
        this.asyncTaskList.push(task);
        return true;
    }

    async waitAsyncTasks(){
        await Promise.all(this.asyncTaskList);
        this.asyncTaskList.length = 0;
        return true;
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
        // cameraAIFront
        if(this.modules.cameraAIFront){
            await this.modules.cameraAIFront.init().catch((e)=>{
                this.modules.cameraAIFront.close();
                this.modules.cameraAIFront = null;
            })
        } else this.modules.cameraAIFront = null;
        this.sendModules();
    }

    async close(){
        await super.close();
        //custom close here
        if(this.modules.camera) await this.modules.camera.close();
        if(this.modules.cameraAIFront) await this.modules.cameraAIFront.close();
        if(this.modules.arm) await this.modules.arm.close();
    }

    async initArms(){
        // Set arms at default position
        await this.playPoseSequence({posePrefix:"default"});
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
            if(this.name == "Robot Nesnes TDS") await this.addScore(8);
            else await this.addScore(7);
        }*/
        
        /*while (!this.app.intelligence.stopExecution)
        {
            for(let i=0;i<255;i+=2) {
                if(this.modules.arm) await this.modules.arm.setLed({ brightness: 255, color: i});
                await utils.sleep(10);
                if(this.app.intelligence.stopExecution) break;
            }
        }*/
        
        if(this.modules.arm) await this.modules.arm.setLed({ brightness: 0, color: 0});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "FFP", angle: 0, duration: 0, wait:false});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BBP", angle: 0, duration: 0, wait:false});
    }

    getDescription(){
        return {
            functions:{
                initArms:{},
                playPoseSequence:{
                    armRawList:{ legend:"Arms(Comma-separated)", type:"text"},
                    posePrefix:{ legend:"Pose prefix", type:"text"}
                },
                setArmsNamedPose:{
                    armRawList:{ legend:"Arms(Comma-separated)", type:"text"},
                    poseName:{ legend:"Pose name", type:"text"},
                    duration:{ type:"range", min:0, max:3000, value:500, step:50 },
                },
                checkHasElements:{
                    clamp:{ legend:"Clamp", type:"text" },
                    value:{ legend:"Set clamp variable to", type:"text" },
                },
                draw:{},
                dance2023: {},
                testSetPosition: {},
                findLocalisation: {},
                testOrientation:{ speed:{ type:"range", min:0, max:3.0, value:0.4, step:0.1 }},
                testDistance:{
                    distance:{ legend:"distance (mm)", type:"number", min:-5000, max:5000, value:150 },
                    speed:{ type:"range", min:0, max:10.0, value:0.4, step:0.1 },
                    accelDist:{ type:"range", min:0, max:10.0, value:0.8, step:0.1 },
                    accelAngle:{ type:"range", min:0, max:360, value:50, step:1 }
                    
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
        delete targetPose.pose;
        for(let targetArm of armList) {
            let pose = Object.assign({}, targetPose, {name: targetArm+"G"});
            if(this.modules.arm) await this.modules.arm.setPose(pose);
        }
        return true;
    }

    async setArmsNamedPose(parameters){
        let armList = ["FA", "FC"]
        if(!("poseName" in parameters)) return false;
        if("armRawList" in parameters && parameters.armRawList !="") armList = parameters.armRawList.split(",");
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        //console.log("setArmsNamedPose", parameters.poseName, armList);
        let maxDuration = 0;
        let shouldWait = false;
        if("wait" in parameters) shouldWait = parameters.wait;
        for(let targetArm of armList) {
            // Find named pose
            let poseFound = null;
            for(let poseName in this.poseList){
                if(!poseName.endsWith("_"+parameters.poseName)) continue;
                let armsCandidates = poseName.split("_");
                armsCandidates.pop(); //remove pose name
                let armName = targetArm;
                if (armName.length==2) armName += "G";
                if(armsCandidates.includes(armName)){
                    poseFound = this.poseList[poseName];
                    break;
                }       
            }
            if(poseFound==null) continue;
            let pose = Object.assign({ duration:300, wait:false }, poseFound);
            maxDuration = Math.max(maxDuration, pose.duration);
            await this.setArmsAt(Object.assign({}, {pose}, parameters, {wait: false}, {armList:[targetArm]}));
        }
        if(shouldWait){
            //console.log(parameters.poseName, "sleep for", maxDuration);
            await utils.sleep(maxDuration);
        }

        return true;
    }
    
    async playPoseSequence(parameters){
        let poseNames = [];
        if("poseNames" in parameters) poseNames = parameters.poseNames;
        if("posePrefix" in parameters){
            poseNames = [];
            for(let i=1;i<50;i++){
                let name = parameters.posePrefix + i;
                let found = false;
                for(let pose in this.poseList){
                    if(pose.endsWith("_"+name)){
                        found = true;
                        poseNames.push(name);
                        break;
                    }
                }
                if(!found) break;
            }
        }
        if(poseNames.length == 0) return false;
        for(let poseName of poseNames) {
            let result = await this.setArmsNamedPose(Object.assign({}, {poseName}, parameters, {wait:true}));
            if(!result) return false;
        }
        return true;
    }


    
    async checkHasElements(parameters){
        let armList = []
        if(!("clamp" in parameters)) return false;
        if(!("value" in parameters)) return false;
        let varName = "clamp"+parameters.clamp;
        if(!(varName in this.variables)) return false;
        let targetOpenPosition = 170;
        // Simulation
        if(!this.modules.arm){
            this.variables[varName].value = parameters.value;
            return true;
        }
        // Save clamp angle
        let initialAngle = await this.modules.arm.getServo({ name: parameters.clamp });
        // Limit torque
        await this.modules.arm.setMaxTorqueServo({ name: parameters.clamp, torque: 150 });
        // Move to open position
        await this.modules.arm.setServo({ name: parameters.clamp, angle: targetOpenPosition, duration: 300, wait:false});
        await utils.sleep(500);
        // Check error
        let openAngle = await this.modules.arm.getServo({ name: parameters.clamp });
        let diff = Math.abs(initialAngle.position - openAngle.position);
        let hasElement = (diff <= 10);
        // Reset target position
        await this.modules.arm.setServo({ name: parameters.clamp, angle: initialAngle.position, duration: 50, wait:false});
        await utils.sleep(100);
        // Restore torque
        await this.modules.arm.setMaxTorqueServo({ name: parameters.clamp, torque: 1000 });
        await this.modules.arm.setServo({ name: parameters.clamp, angle: initialAngle.position, duration: 0, wait:false});
        
        // Store result
        this.app.logger.log("checkHasElements", parameters.clamp, hasElement, "(", diff,") was", initialAngle.position, " moved to ", openAngle.position);
        if(hasElement) {
            this.variables[varName].value = parameters.value;
            return true;
        }
        return false;
    }

    async selectMapComponent(parameters){
        this.app.logger.log(this.app.intelligence.currentTime, "selectMapComponent params", parameters);
        
        let target = {
            component: null,
            access: null,
            distance: null,
            distanceWithMalus: null
        }
        // List elements
        let teamColor = parameters.color||this.team;
        let opposit = "blue";
        if (this.team=="blue") opposit = "yellow";
        let allowOponentReserved = parameters.reserved || false;
        if(parameters.opposit) teamColor=opposit;
        let componentList = []
        //this.app.logger.log("team color", teamColor);
        if(parameters.componentName) {
            componentList.push(this.app.map.getComponentByName(parameters.componentName));
        }
        else {
            let componentTypes = parameters.componentTypes || [];
            for(let type of componentTypes) {
                componentList.push(...this.app.map.getComponentList(type));
            }
        }
        //this.app.logger.log("componentList ", componentList)
        // Indentify closest component and access point
        let accessTag = "" || parameters.accessTag;
        let minLength = 99999999999;
        for(let component of componentList){
            let accessList = []
            let distMalus = 0;
            let maxItemCount = component.maxItemCount || parameters.maxItemCount || 0;
            if("opposit" in parameters && parameters.opposit && component.team == this.team) continue;
            if("reserved" in component && component.reserved && component.team != teamColor && !allowOponentReserved) continue;
            if("oppositRatio" in parameters && component.team != this.team) distMalus += parameters.oppositRatio;
            if("attempts" in component && "attemptRatio" in parameters) distMalus += parameters.attemptRatio * component.attempts;
            if("itemCount" in component && "itemCountRatio" in parameters) distMalus += parameters.itemCountRatio * component.itemCount;
            if("itemCount" in component && maxItemCount>0 && component.itemCount>=maxItemCount) continue;
            if("isAccessible" in component && !component.isAccessible(this.app, component)) continue;
            if(component.access && parameters.access!==false) accessList.push(component.access);
            if(component.otherAccess && parameters.otherAccess!==false) accessList.push(...component.otherAccess);
            if(component.endAccess && parameters.endAccess) accessList.push(...component.endAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                if(accessTag && !access.tags.includes(accessTag)) continue;
                let accessMalus = 0;
                if("historyRatio" in parameters) {
                        // Where opponent went
                    let historyValue = this.app.map.getHistoryAt(access.x, access.y).value
                    accessMalus += parameters.historyRatio * historyValue;
                }
                //else {
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                    
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                let pathLenghtWithMalus = pathLength + distMalus + accessMalus;

                //this.app.logger.log("Test target ", component.name, pathLength, distMalus, accessMalus);

                if((pathLenghtWithMalus)<minLength/* && pathLength > 50*/){
                    minLength = pathLenghtWithMalus;
                    target.distanceWithMalus = pathLenghtWithMalus;
                    target.distance = pathLength;
                    target.access = access;
                    target.component = component;
                }
            }
        }

        //this.app.logger.log("FoundTarget ", target)
        if(!target.component){
            this.app.logger.log("  -> Target component not found ");
            return target
        }
        if(!target.access){
            this.app.logger.log("  -> No access found for component "+target.component.name);
            return target
        }
        return target;
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
            distance:   125,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  20||parameters.nearAngle||this.app.goals.defaultNearAngle,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            preventLocalisation: true,
            preventPathFinding: true
        });
        this.disableColisions = false;

        await this.addScore(20);

        // Backward
        result = await this.moveAtAngle({
            angle: this.angle,
            distance:   -100,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  20||parameters.nearAngle||this.app.goals.defaultNearAngle,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            preventLocalisation: true,
            preventPathFinding: true,
            preventBreak: true
        });
        
        return result;
    }

    /*async goGrabElements(parameters){
        let result = true;

        return result;
    }*/
    
    
    async rushGrab(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "rushGrab params", parameters);
        
        // Find element
        let target = await this.selectMapComponent({
            componentTypes: parameters.componentTypes || ["element"],
            accessTag : parameters.accessTag || "",
            opposit: parameters.opposit || false
        })
        this.app.logger.log("selectedComponent", target);
        if(!target.component || !target.access){
            this.app.logger.log("selectedComponent failed", !target.component, !target.access );
            return false;
        }
        this.app.logger.log("rush to Elements", target.component.name);
        let side = "";
        if("side" in parameters) side = parameters.side;
        let clampLeft = "AFC", clampCenterLeft = "FAC", clampCenterRight="FCC", clampRight="CFC";
        if(side == "back"){
            clampLeft = "CS5"; clampCenterLeft = "CS4"; clampCenterRight="AS4"; clampRight="AS5";
        }
        // Increase attempt count
        if(target.component.attempts)  target.component.attempts += 1;
        else target.component.attempts = 1;
        // Compute move speed and angle
        let grabOrientation = target.access.angle;
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        //if(target.distance>0 && target.distance < 600) moveSpeed *= 0.5;
        if(side=="back") grabOrientation += 180;
        this.app.logger.log(target.distance, moveSpeed, grabOrientation)
           
        // Move to target
        result = await this.moveToPosition({
            x:          target.access.x,
            y:          target.access.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
            nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  7||parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventBreak: false
        });
        if(!result) return result;

        //await this.waitAsyncTasks();
        this.addAsyncTask(this.playPoseSequence({posePrefix: side+"PreGrab"}));
        await this.waitAsyncTasks();

        // Move forward
        result = await this.moveAtAngle({
            angle: target.access.angle,
            distance: 230,
            speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 20||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelAngle: 20,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: false,
            preventBreak: true
        })
        if(!result) return result;
        this.addAsyncTask( this.playPoseSequence({posePrefix: side + "Grab"})); // async
        
        
        // Check has elements
        await this.waitAsyncTasks();
        this.addAsyncTask(this.checkHasElements({clamp:clampLeft, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampCenterLeft, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampCenterRight, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampRight, value:"C"}));
        await this.waitAsyncTasks();
        
        let elemCount = 0;
        if(this.variables["clamp"+clampCenterRight].value != "") elemCount++;
        if(this.variables["clamp"+clampCenterLeft].value != "") elemCount++;
        if(this.variables["clamp"+clampLeft].value != "") elemCount++;
        if(this.variables["clamp"+clampRight].value != "") elemCount++;
        if(elemCount == 1) {
            // Release trash here
            await this.setVariable({name:"clamp"+clampCenterLeft, value:""});
            await this.setVariable({name:"clamp"+clampCenterRight, value:""});
            await this.setVariable({name:"clamp"+clampLeft, value:""});
            await this.setVariable({name:"clamp"+clampRight, value:""});
            this.addAsyncTask( (async ()=>{
                await this.playPoseSequence({posePrefix: side+"FreeAll"})
                await utils.sleep(500);
                if(side=="front") await this.playPoseSequence({posePrefix:"default", armList:["FF", "FS", "FC", "AF", "CF"]}); // async
                if(side=="back") await this.playPoseSequence({posePrefix:"default", armList:["BB", "BS", "CS", "AS"]}); // async
            })());
        }
        else {
            this.addAsyncTask(this.playPoseSequence({posePrefix: side+"Store"}));
        }
        
        this.removeFromMap({component:target.component});
        return true;
    }
    
    
    async goGrabElements(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "goGrabElements params", parameters);
        
        // Find arm
        let isFrontFree = this.variables["clampAFC"].value == ""
                       && this.variables["clampFAC"].value == ""
                       && this.variables["clampFCC"].value == ""
                       && this.variables["clampCFC"].value == "";
        let isBackFree = this.variables["clampAS4"].value == ""
                       && this.variables["clampAS5"].value == ""
                       && this.variables["clampCS4"].value == ""
                       && this.variables["clampCS5"].value == "";
        if(!isFrontFree && !isBackFree) return false;
        let side = "";
        if("side" in parameters) side = parameters.side;
        if(side == "") {
            if(isFrontFree) side = "front";
            else if(isBackFree) side = "back";
        }
        this.app.logger.log("side", side, isFrontFree, isBackFree);
        if(side == "") return false;
        if(side == "front" && !isFrontFree) return false;
        if(side == "back" && !isBackFree) return false;
        
        if(side=="back") return false;

        let clampLeft = "AFC", clampCenterLeft = "FAC", clampCenterRight="FCC", clampRight="CFC";
        if(side == "back"){
            clampLeft = "CS5"; clampCenterLeft = "CS4"; clampCenterRight="AS4"; clampRight="AS5";
        }

        // Find element
        let target = await this.selectMapComponent({
            componentTypes: parameters.componentTypes || ["element","elementReserved","elementBuildBottom","elementPAMI","elementTight"],
            historyRatio: -20,
            attemptRatio: 2800,
            oppositRatio: 2800,
            accessTag : parameters.accessTag || "",
            opposit: parameters.opposit || false
        })
        this.app.logger.log("selectedComponent", target);
        if(!target.component || !target.access){
            this.app.logger.log("selectedComponent failed", !target.component, !target.access );
            return false;
        }
        this.app.logger.log("goGrabElements", target.component.name);
        // Increase attempt count
        if(target.component.attempts)  target.component.attempts += 1;
        else target.component.attempts = 1;
        // Compute move speed and angle
        let grabOrientation = target.access.angle;
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(target.distance>0 && target.distance < 600) moveSpeed *= 0.5;
        if(side=="back") grabOrientation += 180;
        this.app.logger.log(target.distance, moveSpeed, grabOrientation)
          
        let isTight = ["elementReserved", "elementPAMI", "elementTight","elementBuildBottom"].includes(target.component.type);

        let earlyDeploy = false;
        if("earlyDeploy" in parameters) earlyDeploy = parameters.earlyDeploy;

        await this.waitAsyncTasks();
        this.addAsyncTask( (async ()=>{
            await utils.sleep(500);
            if(side=="front") await this.addAsyncTask(this.playPoseSequence({posePrefix:"frontPreGrabTight"})); // async
            if(side=="back") await this.addAsyncTask(this.playPoseSequence({posePrefix:"backPreGrab"})); // async
            if(!isTight && side=="front") await this.playPoseSequence({posePrefix: side+"PreGrab"}); // async
        })());
           
        // Move to target
        result = await this.moveToPosition({
            x:          target.access.x,
            y:          target.access.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
            accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
            nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  5||parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventBreak: false
        });
        if(!result) return result;

        if(!earlyDeploy) await this.waitAsyncTasks();

        if(!earlyDeploy){
            // Check has elements
            this.addAsyncTask(this.checkHasElements({clamp:clampLeft, value:"C"}));
            this.addAsyncTask(this.checkHasElements({clamp:clampCenterLeft, value:"C"}));
            this.addAsyncTask(this.checkHasElements({clamp:clampCenterRight, value:"C"}));
            this.addAsyncTask(this.checkHasElements({clamp:clampRight, value:"C"}));
            await this.waitAsyncTasks();
        }
        let isFaceFree = this.variables["clamp"+clampLeft].value == ""
            && this.variables["clamp"+clampCenterLeft].value == ""
            && this.variables["clamp"+clampCenterRight].value == ""
            && this.variables["clamp"+clampRight].value == "";
        if(!isFaceFree) {
            //Go backward and turn arround
            await this.moveAtAngle({
                angle: target.access.angle,
                endAngle: grabOrientation+180,
                distance: -150,
                speed: parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   50,
                nearAngle:  10,
                preventLocalisation: true,
                preventBreak: false
            });
            // Free elements
            await this.playPoseSequence({posePrefix: side+"FreeAll"}); // TODO BACK FREE ALL
            // Move away from elements
            await this.moveAtAngle({
                angle: target.access.angle,
                endAngle: grabOrientation,
                distance: 100,
                speed: parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   50,
                nearAngle:  10,
                preventLocalisation: true,
                preventBreak: false
            });
            // Restore target position for moveCorrectPosition
            this.lastTarget.x = target.access.x;
            this.lastTarget.y = target.access.y;
            this.lastTarget.angle = grabOrientation;
        }


        // Refine end position
        result = await this.moveCorrectPosition({
            speed: (parameters.speed||this.app.goals.defaultSpeed)/3
        });

        // Prepare arms async
        /*if(!earlyDeploy){
            if(side=="front") this.addAsyncTask(this.playPoseSequence({posePrefix:"frontPreGrabTight"})); // async
            if(side=="back") this.addAsyncTask(this.playPoseSequence({posePrefix:"backPreGrab"})); // async
        }*/
        
        await this.waitAsyncTasks();
        if(!earlyDeploy){
            if(!isTight && side=="front") await this.playPoseSequence({posePrefix: side+"PreGrab"}); // async
        }

        let isFacingOpponentZone = target.component.type=="elementBuildBottom";// && !target.component.name.toLowerCase().includes(this.team);
        // Move forward
        let forwardGrabDist = 230;
         if(isFacingOpponentZone) forwardGrabDist = 150;
        result = await this.moveAtAngle({
            angle: target.access.angle,
            distance: forwardGrabDist,
            speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 20||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelAngle: 150,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: false,
            preventBreak: false
        })
        if(!result) return result;
        await utils.sleep(300); // safety measure to make sure servos have arrived

        if(!isFacingOpponentZone) {
            // Move forward while grabbing
            this.moveAtAngle({
                angle: target.access.angle,
                distance: 150,
                speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 20||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                accelAngle: 150,
                nearDist:   50,
                nearAngle:  5,
                preventLocalisation: true,
                preventBreak: false
            });
            await utils.sleep(500);
        }
        if(isTight && side=="front") await this.playPoseSequence({posePrefix:"frontGrabTight"});
        await this.playPoseSequence({posePrefix: side + "Grab"}); // async

        let backwardDist = -100;
        if(isTight){
             backwardDist = -100;
            // Move backward in tight space
            await this.moveAtAngle({
                angle: target.access.angle,
                distance: backwardDist,
                speed: 0.35||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   50,
                nearAngle:  10,
                preventLocalisation: true,
                preventBreak: false
            })
        }
        

        // Check has elements
        this.addAsyncTask(this.checkHasElements({clamp:clampLeft, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampCenterLeft, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampCenterRight, value:"C"}));
        this.addAsyncTask(this.checkHasElements({clamp:clampRight, value:"C"}));
        await this.waitAsyncTasks();
        
        /*let isSideCenterComplete = this.variables["clamp"+clampCenterRight].value != ""
                                && this.variables["clamp"+clampRight].value != "";
        if(isSideCenterComplete){
            
        }*/
        let elemCount = 0;
        if(this.variables["clamp"+clampCenterRight].value != "") elemCount++;
        if(this.variables["clamp"+clampCenterLeft].value != "") elemCount++;
        if(this.variables["clamp"+clampLeft].value != "") elemCount++;
        if(this.variables["clamp"+clampRight].value != "") elemCount++;
        if(elemCount == 1) {
            // Release trash here
            await this.setVariable({name:"clamp"+clampCenterLeft, value:""});
            await this.setVariable({name:"clamp"+clampCenterRight, value:""});
            await this.setVariable({name:"clamp"+clampLeft, value:""});
            await this.setVariable({name:"clamp"+clampRight, value:""});
            await this.playPoseSequence({posePrefix: side+"FreeAll"});
            // Move backward to release elements
            await this.moveAtAngle({
                angle: grabOrientation,
                distance: -100,
                speed: 0.35||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   50,
                nearAngle:  10,
                preventLocalisation: true,
                preventBreak: false
            })
            this.addAsyncTask( (async ()=>{
                await utils.sleep(500);
                if(side=="front") await this.playPoseSequence({posePrefix:"default", armList:["FF", "FS", "FC", "AF", "CF"]}); // async
                if(side=="back") await this.playPoseSequence({posePrefix:"default", armList:["BB", "BS", "CS", "AS"]}); // async
            })());
        }
        else {
            this.addAsyncTask(this.playPoseSequence({posePrefix: side+"Store"}));
        }
    
        this.removeFromMap({component:target.component});
        return true;
    }
    
    async depositInBuildZone(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "deposit in build zone");
        let stageCount = 2;
        if("stageCount" in parameters) stageCount = parameters.stageCount;

        // Find build zone
        let target = await this.selectMapComponent({
            componentTypes: parameters.componentTypes || ["buildMiddle", "buildBottom", "buildBottomSide", "buildBottomCenter"],
            historyRatio: 0,
            attemptRatio: 2600,
            itemCountRatio: 0,
            maxItemCount: 3
        })
        this.app.logger.log("selectedComponent", target);
        if(!target.component || !target.access){
            this.app.logger.log("selectedComponent failed", !target.component, !target.access );
            return false;
        }
        this.app.logger.log("depositInBuildZone", target.component.name);

        // Find side
        let frontElemCount = 0;
        if(this.variables["clampAFC"].value != "") frontElemCount++;
        if(this.variables["clampFAC"].value != "") frontElemCount++;
        if(this.variables["clampFCC"].value != "") frontElemCount++;
        if(this.variables["clampCFC"].value != "") frontElemCount++;
        let backElemCount = 0;
        if(this.variables["clampAS4"].value != "") backElemCount++;
        if(this.variables["clampAS5"].value != "") backElemCount++;
        if(this.variables["clampCS4"].value != "") backElemCount++;
        if(this.variables["clampCS5"].value != "") backElemCount++;
        if(frontElemCount==0 && backElemCount==0) return false;
        let side = "";
        if("side" in parameters) side = parameters.side;
        if(side == "") {
            if(frontElemCount > backElemCount) side = "front";
            else if(backElemCount) side = "back";
        }
        this.app.logger.log("side", side, frontElemCount, backElemCount);
        if(side == "") return false;
        if(side == "front" && frontElemCount<=0) return false;
        if(side == "back" && backElemCount<=0) return false;
        let clampLeft = "AFC", clampCenterLeft = "FAC", clampCenterRight="FCC", clampRight="CFC";
        if(side == "back"){
            clampLeft = "CS5"; clampCenterLeft = "CS4"; clampCenterRight="AS4"; clampRight="AS5";
        }

        //Adapt speed to proximity
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        let angleSpeed = parameters.angleSpeed||this.app.goals.defaultAngleSpeed;
        if(target.distance < 800) {
            moveSpeed *= 0.5;
            angleSpeed *= 0.5;
        }

        let targetAngleOffset = 0;
        if(side=="back") targetAngleOffset = 180;
        let grabOrientation = target.access.angle + targetAngleOffset;
        result = await this.moveToPosition({
            x:          target.access.x,
            y:          target.access.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: angleSpeed,
            nearDist:   250||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  10||parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result){
            // Increase attempt count
            if(target.component.attempts)  target.component.attempts += 1;
            else target.component.attempts = 1;
            return result;
        }

        // Make sure elements are here
        //this.addAsyncTask(this.checkHasElements({clamp:clampLeft, value:"C"}));
        //this.addAsyncTask(this.checkHasElements({clamp:clampCenterLeft, value:"C"}));
        //this.addAsyncTask(this.checkHasElements({clamp:clampCenterRight, value:"C"}));
        //this.addAsyncTask(this.checkHasElements({clamp:clampRight, value:"C"}));
       
        
        // Refine end position
        result = await this.moveCorrectPosition({
            speed: parameters.speed/2,
            angleSpeed: parameters.angleSpeed/2
        });

        await this.waitAsyncTasks(); // Wait for arms stored

        // Find arm
        let isBad1Stage = (
                                this.variables["clamp"+clampCenterLeft].value != ""
                                && this.variables["clamp"+clampRight].value != ""
                                && (this.variables["clamp"+clampCenterRight].value == "" || this.variables["clamp"+clampLeft].value == "")
                               )
                            || (
                                this.variables["clamp"+clampCenterRight].value != ""
                                && this.variables["clamp"+clampLeft].value != ""
                                && (this.variables["clamp"+clampCenterLeft].value == "" || this.variables["clamp"+clampRight].value == "")
                               );
        let is1Stage = this.variables["clamp"+clampCenterLeft].value != ""
                         && this.variables["clamp"+clampCenterRight].value != "";
        let is2Stage = is1Stage && this.variables["clamp"+clampLeft].value != ""
                         && this.variables["clamp"+clampRight].value != "";
        let isTrash = !is1Stage && !is2Stage && !isBad1Stage;
        this.app.logger.log("Deposit clamp status", is1Stage, is2Stage, isTrash, isBad1Stage );

        // Build
        let hasBuilt = false;
        if((!is1Stage && isBad1Stage) || isTrash){
            // Open everything to free arms
            this.addAsyncTask( this.playPoseSequence({posePrefix: side+"FreeAll"}));
        }
        else {
            await 
            this.addAsyncTask( this.playPoseSequence({posePrefix: side+"Build"}));
            hasBuilt = true;
        }

        // Move forward
        let forwardDist = 450;
        if(target.component.itemCount) forwardDist -= 175 * target.component.itemCount;
        if(target.component.maxItemCount==1) forwardDist = 150;
        result = await this.moveAtAngle({
            angle: target.access.angle,
            distance: forwardDist ,
            speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   25,
            nearAngle:  5,
            preventLocalisation: true
        });
        if(!result) return result;
        await this.waitAsyncTasks();

        await this.setVariable({name:"clamp"+clampLeft, value:""});
        await this.setVariable({name:"clamp"+clampCenterLeft, value:""});
        await this.setVariable({name:"clamp"+clampCenterRight, value:""});
        await this.setVariable({name:"clamp"+clampRight, value:""});

        if(target.component.itemCount) target.component.itemCount += 1;
        else target.component.itemCount = 1;

        if(is1Stage || isBad1Stage) await this.addScore(4);
        if(is2Stage) await this.addScore(8);
        
        // Backward
        let backwardDist = -450;
        if(target.component.type == "buildBottomSide") backwardDist = -300;
        await this.moveAtAngle({
            angle: target.access.angle,
            distance: backwardDist,
            speed: 0.5,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: true
        });


        if(!hasBuilt){
            await this.waitAsyncTasks();
            this.addAsyncTask( (async ()=>{
                //await this.playPoseSequence({posePrefix:"frontStore"});
                if(side=="front") await this.playPoseSequence({posePrefix:"default", armList:["FF", "FS", "FC", "AF", "CF"]}); // async
                if(side=="back") await this.playPoseSequence({posePrefix:"default", armList:["BB", "BS", "CS", "AS"]}); // async
            })());
        } 
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
        //this.setArmsPacked({});
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
        //this.setArmsPacked({});
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
            deccelDist: parameters.accelDist||this.app.goals.defaultAccel,
            accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
            preventLocalisation: true
        });
        
        return true;
    }
    
    async testAngle(parameters){
        //this.setArmsPacked({});
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
    
    async returnToSpecificEndZone(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "return to specific end zone", parameters)
        
        //Remove every element on the map
        let elementList = this.app.map.getComponentList(["element"]);
        for(let elem of elementList){
            this.app.logger.log("remove before end zone", elem.name);
            this.removeFromMap({component: elem});
        }
        
        //await this.armFreePlants({});

        // Find end zone
        let target = await this.selectMapComponent({
            componentTypes: parameters.componentTypes || ["buildReserved"],
            historyRatio: 0,
            attemptRatio: 2600,
            access: false,
            otherAccess: false,
            endAccess: true
        })
        this.app.logger.log("selectedComponent", target);
        if(!target.component || !target.access){
            this.app.logger.log("selectedComponent failed", !target.component, !target.access );
            return false;
        }
        this.app.logger.log("returnToSpecificEndZone", target.component.name);
        // Increase attempt count
        if(target.component.attempts)  target.component.attempts += 1;
        else target.component.attempts = 1;

        // Move to zone
        result = await this.moveToPosition({
            x:          target.access.x,
            y:          target.access.y,
            angle:      target.access.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelDist:  parameters.accelDist||this.defaultAccel,
            deccelDist: parameters.accelDist||this.defaultAccel,
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

        // Wait for PAMI timing
        while(this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-4000){ //ms 
            await utils.sleep(200);
        }
        
        // Move to end zone access, not endAccess
        result = await this.moveToPosition({
            x:          target.component.access.x,
            y:          target.component.access.y,
            angle:      target.component.access.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            accelDist:  parameters.accelDist||this.defaultAccel,
            deccelDist:  parameters.accelDist||this.defaultAccel,
            nearDist:   200,
            nearAngle:  20
        });
        this.collisionDistance = collisionDistanceBackup;
        if(!result) return result;
        await this.setVariable({name:"endReached", value:true});
        this.app.logger.log("Adding end zone point");
        await this.addScore(10);
        
        // Move along zone access, not along endAccess
        result = await this.moveAtAngle({
            angle: target.component.access.angle,
            distance: 200,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        
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
                    await this.addScore(15);
                    break;
                }
            }
            await utils.sleep(200);
        }*/
        
        
        //this.app.logger.log("Adding funny action point");
        //await this.addScore(5);
                    
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
        
        await this.addScore(20);
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

