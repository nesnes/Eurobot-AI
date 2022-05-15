'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');

//delete require.cache[require.resolve('./modules/lidarx2')]; //Delete require() cache
//const Lidar = require('./modules/lidarx2');

delete require.cache[require.resolve('./modules/lidarLD06')]; //Delete require() cache
const Lidar = require('./modules/lidarLD06');


//delete require.cache[require.resolve('./modules/lidarLocalisation')]; //Delete require() cache
//const LidarLocalisation = require('./modules/LidarLocalisation');

delete require.cache[require.resolve('./modules/arm')]; //Delete require() cache
const Arm = require('./modules/arm');

delete require.cache[require.resolve('./modules/camera')]; //Delete require() cache
const Camera = require('./modules/camera');


const utils = require("../utils")

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
        this.name = "Robot Nesnes TDS"
        this.radius = 160;
        this.startPosition = {
            //blue:{x:265,y:650,angle:0},
            yellow:{x:150,y:542,angle:0},
            violet:{x:2850,y:542,angle:180}
        }
        this.variables = {
            // value:{R|G|B|replica|artifact|''}, Side: 0=ready 1=flipped(not ready to drop) 
            armAC: { value: "", side: 0, label: "AC" },  
            armAB: { value: "", side: 0, label: "AB" },  
            armBC: { value: "", side: 0, label: "BC" },
            galleryRed: { value: 0, max: 2 },
            galleryGreen: { value: 0, max: 2 },
            galleryBlue: { value: 0, max: 2 },
            endReached: { value: 0, max: 1 },
            bottomDispenser: { value: 3, max: 3 }
        }
        this.collisionAngle = 115;
        this.collisionDistance = this.radius+250;
        this.slowdownDistance = this.collisionDistance+100;

        if(!this.app.parameters.simulate){
            this.modules.lidar = new Lidar(app)
            //this.modules.lidarLocalisation = new LidarLocalisation(app)
            this.modules.arm = new Arm(app);
            this.modules.camera = new Camera(app);
        }
    }

    async init(){
        await super.init();
        if(this.modules.arm && this.modules.robotLink){
            await this.modules.arm.init().catch((e)=>{
                this.modules.arm = null;
            })
        } else this.modules.arm = null;
        if(this.modules.camera){
            await this.modules.camera.init().catch((e)=>{
                this.modules.camera = null;
            })
        } else this.modules.camera = null;
        this.sendModules();
    }

    async close(){
        await super.close();
        //custom close here
        if(this.modules.camera) await this.modules.camera.close();
    }

    async initMatch(){
        await super.initMatch();
        await this.setArmDefault({ name: "ACG", duration: 0, wait: false});
        await this.setArmDefault({ name: "ABG", duration: 0, wait: false});
        await this.setArmDefault({ name: "BCG", duration: 0, wait: false});
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ACM", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ACP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ABP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "BCP", value:0 });
        /*if(this.team == "yellow"){
            this.variables.armBC.value = "replica";
            await this.setArmAS({ name: "BCG", duration: 0, wait: false});
            await this.setArmDefault({ name: "ABG", duration: 0, wait: false});
            this.setPump({name: "BCP", value: 255});
            this.setPump({name: "ABP", value: 0});
        }
        else if(this.team == "violet"){
            this.variables.armAB.value = "replica";
            await this.setArmDefault({ name: "BCG", duration: 0, wait: false});
            await this.setArmAS({ name: "ABG", duration: 0, wait: false});
            this.setPump({name: "BCP", value: 0});
            this.setPump({name: "ABP", value: 255});
        }*/
        return;
    }

    async endMatch(){
        await super.endMatch();
        if(this.modules.arm) await this.modules.arm.setMotor({ name: "ACM", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ACP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "ABP", value:0 });
        if(this.modules.arm) await this.modules.arm.setPump({ name: "BCP", value:0 });
    }

    getDescription(){
        return {
            functions:{
                testMove: {},
                dance: {},
                detectAndGrabBuoy: {},
                debug_initPosition: {color:{ legend:"color", type:"text" },},
                debug_initActuators: {color:{ legend:"color", type:"text" },},
                activateExperiment: {},
                readWeathervane: {},
                shareSampleBetweenArms:{
                    from:{ legend:"from (ex: AC)", type:"text" },
                    to:{ legend:"to (ex: AB)", type:"text" }
                },
                setArmDefault:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmUH:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmDH:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPGFD:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmGFD:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPPGA:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPGA:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmGA:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPGD:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmGD:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmAGD:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmAS:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPGV:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmGV:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPT:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmT:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPSL:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmSL:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmPSR:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmSR:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                moveAtAngle:{
                    angle:{ legend:"angle (deg)", type:"number", min:-180, max:180, value:0 },
                    distance:{ legend:"distance (m)", type:"number", min:-1000, max:1000, value:150 },
                    speed:{ legend:"speed (m/s)", type:"range", min: -1.5, max: 1.5, value:0.5, step:0.1 }
                }
            }
        }
    }

    async debug_initPosition(parameters){
        if(!("color" in parameters)) return false;
        if(!(parameters.color in this.startPosition)) return false;
        this.team = parameters.color;
        this.x = this.startPosition[parameters.color].x;
        this.y = this.startPosition[parameters.color].y;
        this.angle = this.startPosition[parameters.color].angle;
        if(this.modules.base) await this.modules.base.enableMove();
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        this.send();
        return true;
    }
    
    async debug_initActuators(parameters){
        if(!("color" in parameters)) return false;
        if(!(parameters.color in this.startPosition)) return false;
        this.team = parameters.color;
        await this.initMatch();
        this.send();
        return true;
    }
    
    async setPump(parameters){
        return await this.setMotor(parameters);
    }
    
    async setMotor(parameters){
        if(!parameters.name) return false;
        if(!("value" in parameters)) return false;
        if(this.modules.arm) await this.modules.arm.setPump({ name: parameters.name, value:parameters.value });
        return true;
    }
    
    async setArmDefault(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:5, a3:170 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmUH(parameters){ // Up Horizontal
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:90, a3:90 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPGFD(parameters){ // Pre Grab Flat Dispenser
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:90, a3:70 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmGFD(parameters){ // Grab Flat Dispenser
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:40, a3:50 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPPGA(parameters){ // Pre Pre Grab Artifact
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:40, a3:5 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPGA(parameters){ // Pre Grab Artifact
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:90, a3:5 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmGA(parameters){ // Grab Artifact
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:74, a3:23 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPGD(parameters){ // Pre Grab Diagonal
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:155, a3:45 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmGD(parameters){ // Grab Diagonal
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:135, a3:70 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmAGD(parameters){ // After Grab Diagonal
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:160, a3:0 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmAS(parameters){ // Artifact Storage
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:5, a3:90 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmDH(parameters){ // Down Horizontal
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:90, a3:90 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPGV(parameters){ // Pre Grab Vertical
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:130, a3:130 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmGV(parameters){ // Grab Vertical
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:158, a3:103 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPT(parameters){ // Pre Throw
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:130, a3:50 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmT(parameters){ // Throw
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:143, a3:40 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPSL(parameters){ // Pre Share Left
        if(!parameters.name) return false;
        let high = false | (parameters.high);
        let pose = Object.assign({ a1:(high?125:105), a2:90, a3:40 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmSL(parameters){ // Share Left
        if(!parameters.name) return false;
        let high = false | (parameters.high);
        let wiggle = false | (parameters.wiggle);
        let pose = Object.assign({ a1:(high?125:105), a2:10, a3:(wiggle?25:45) }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPSR(parameters){ // Pre Share Right
        if(!parameters.name) return false;
        let high = false | (parameters.high);
        let pose = Object.assign({ a1:(high?0:20), a2:90, a3:40 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmSR(parameters){ // Share Right
        if(!parameters.name) return false;
        let high = false | (parameters.high);
        let wiggle = false | (parameters.wiggle);
        let pose = Object.assign({ a1:(high?0:20), a2:10, a3:(wiggle?25:45) }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmDGH(parameters){ // Deposit Gallery High
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:45, a3:130 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmDGL(parameters){ // Deposit Gallery Low
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:172, a2:54, a3:145 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmDSS(parameters){ // Drop Sample Shed
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:90, a3:170 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }

    async activateExperiment(parameters){
        this.setArmUH({name:"ACG", duration:350 });
        await utils.sleep(100);
        await this.moveForward({distance:200, speed:0.2});
        // TODO custom arm move here
        await this.modules.arm.setPump({ name: "ACP", value:0 });
        this.addScore(15);
        await utils.sleep(1000);
        await this.moveBackward({distance:300, speed:0.4});
        await utils.sleep(100);
        await this.setArmDefault({name:"ACG"});
        return true
    }

    async grabStartingBuoys(parameters){
        this.variables.buoyStorageFrontGreen.value++;
        this.variables.buoyStorageFrontRed.value++;
        this.app.map.removeComponent(this.app.map.getComponent("buoyStartingNorth", this.team));
        this.app.map.removeComponent(this.app.map.getComponent("buoyStartingFairwayNorth", this.team));
        await utils.sleep(400);
        return true
    }

    async readWeathervane(parameters){
        if(!this.modules.camera) return true;
        let armLookPosition = { a1:110, a2:90, a3:70, a4:55, a5:80, duration:200 };
        let tryBudget = 1;
        while(--tryBudget>=0){
            if(this.modules.arm) await this.modules.arm.setPose(armLookPosition);
            await utils.sleep(400);
            let orientation = await this.modules.camera.detectWeathervane();
            if(orientation){
                this.variables.endZone.value = orientation=="north"?1:2;
                break;
            }
        }
        if(this.modules.arm) await this.modules.arm.setPose({ a1:110, a2:90, a3:40, a4:180, a5:110, duration:300 })
        this.setArmDefault({duration:100, wait:false});
        this.send();
        return this.variables.endZone.value>0;
    }

    async grabBuoysBottom(parameters){
        return false
        this.variables.buoyStorageSideB.value+=2;
        this.app.map.removeComponent(this.app.map.getComponent("buoyMiddleBottom", this.team));
        this.app.map.removeComponent(this.app.map.getComponent("buoyBottom", this.team));
        await utils.sleep(400);
        return true
    }

    async grabBuoy(parameters){
        return false
        let elemList = []
        let result = await this.openSideArms({sideRed:!!parameters.sideRed, sideGreen:!!parameters.sideGreen});
        if(!result) return result;
        result = await this.moveBackward({distance:150, speed:0.4});
        if(!result) return result;
        if(parameters.component){
            this.app.map.removeComponent(this.app.map.getComponent(parameters.component, this.team));
            elemList.push(parameters.component)
        }
        result = await this.closeSideArms({
            sideRed:!!parameters.sideRed,
            sideGreen:!!parameters.sideGreen,
            addBuoyStorageSideGreen:!!parameters.sideGreen,
            addBuoyStorageSideRed:!!parameters.sideRed,
            removeFromMap:elemList
        });
        return result;
    }

    async grabReaf(parameters){
        return false
        this.variables.buoyStorageFrontGreen.value++;
        this.variables.buoyStorageFrontRed.value++;
        await utils.sleep(400);
        return true
    }
    
    addNewPairsScore(fairway, pairedFairway, fCount, pCount){
        if(!fairway) return 0;
        if(!("buoyCount" in fairway)) fairway.buoyCount = 0;
        if(!pairedFairway) return 0;
        if(!("buoyCount" in pairedFairway)) pairedFairway.buoyCount = 0;
        if(fCount==0 && pCount==0) return 0;//no new buoy in fairways
        //remove existing pairs
        let existingPairs = Math.min(fairway.buoyCount, pairedFairway.buoyCount);
        let newCountInFairway = fairway.buoyCount + fCount - existingPairs;
        let newCountInPaired = pairedFairway.buoyCount + pCount - existingPairs;
        let newPairCount = Math.min(newCountInFairway, newCountInPaired);
        this.addScore(fCount*2 + pCount*2 + newPairCount*2);
        fairway.buoyCount += fCount;
        pairedFairway.buoyCount += pCount;
        
        console.log("Score add", fCount+pCount, "buoy,", newPairCount, "pair");
        return true;
    }
    
    getGallerySideVar(color){
        if(color == "R") return this.app.robot.variables.galleryRed;
        if(color == "G") return this.app.robot.variables.galleryGreen;
        if(color == "B") return this.app.robot.variables.galleryBlue;
    }
    
    getGalleryDepositList(parameters){
        let armList = [];
        if(["R","G","B"].includes(this.variables.armAC.value)) armList.push(this.variables.armAC);
        if(["R","G","B"].includes(this.variables.armAB.value)) armList.push(this.variables.armAB);
        if(["R","G","B"].includes(this.variables.armBC.value)) armList.push(this.variables.armBC);
        let depositList = [];
        
        // Depose ready samples
        for(let i=0; i<armList.length; i++) {
            if(["R","G","B"].includes(armList[i].value) && armList[i].side == 0) {
               let gallerySide = this.getGallerySideVar(armList[i].value);
               if(gallerySide.value >= gallerySide.max) continue;
               depositList.push(armList[i]); 
               armList.splice(i,1);
               i--;
            }
        }
        
        // If needed, free an arm for flip capability
        if(armList.length == 3){
            for(let i=0; i<armList.length; i++) {
                let gallerySide = this.getGallerySideVar(armList[i].value);
                if(gallerySide.value >= gallerySide.max) continue;
                depositList.push(armList[i]); // AC
                armList.splice(i,1);
            }
        }
        
        // Deposit remaining samples
        for(let i=0; i<armList.length; i++) {
            let gallerySide = this.getGallerySideVar(armList[i].value);
            if(gallerySide.value >= gallerySide.max) continue;
            depositList.push(armList[i]); // AC
            armList.splice(i,1);
            i--
        }
        
        return depositList;
    }

    async depositInGallery(parameters){
        let result = true;
        let depositList = this.getGalleryDepositList();
        if(depositList.length == 0) return false;
        
        let offsetXColorMap = {
            R: this.team == "yellow" ? 240 : -240,
            G: 0,
            B: this.team == "yellow" ? -240 : 240
        }
        
        for(let arm of depositList){
            // Move to gallery
            result = await this.moveToComponent({
                component: "gallery",
                speed: this.app.goals.defaultSpeed,
                nearDist: this.app.goals.defaultNearDist,
                nearAngle: this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Move facing gallery color
            let xOffset = offsetXColorMap[arm.value];
            if(xOffset != 0){
                result = await this.moveAtAngle({
                    angle: 0,
                    distance: xOffset,
                    speed: this.app.goals.defaultSpeed,
                    nearDist: this.app.goals.defaultNearDist,
                    nearAngle: this.app.goals.defaultNearAngle
                });
                if(!result) return result;
            }
            // Check if nearby arm is available for flip (if needed)
            let flipArm = null;
            let onLeft = false;
            if(arm.side != 0){
                if(arm.label == 'AB' && this.variables.armAC.value==""){ flipArm = this.variables.armAC; onLeft = false; }
                if(arm.label == 'BC' && this.variables.armAC.value==""){ flipArm = this.variables.armAC; onLeft = true;  }
                if(arm.label == 'AC' && this.variables.armBC.value==""){ flipArm = this.variables.armBC; onLeft = true;  }
                else if(arm.label == 'AC' && this.variables.armAB.value==""){ flipArm = this.variables.armAB; onLeft = false; }
            }
            // Flip
            let armGLabel = arm.label+"G";
            let armPLabel = arm.label+"P";
            let finalGLabel = armGLabel;
            let finalPLabel = armPLabel;
            let finalArm = arm;
            if(flipArm){
                await this.shareSampleBetweenArms({from:arm.label, to:flipArm.label});
                finalGLabel = flipArm.label+"G";
                finalPLabel = flipArm.label+"P";
                finalArm = flipArm;
            }
            // Orient
            let directionLabel = arm.label;
            if(flipArm) directionLabel = flipArm.label;
            let orientation = -90;
            if(directionLabel == "AB") orientation = 30;
            if(directionLabel == "BC") orientation = 150;
            if(orientation != -90){
                await this.rotateToAngle({
                    angle: orientation,
                    speed: this.app.goals.defaultSpeed,
                    nearDist: this.app.goals.defaultNearDist,
                    nearAngle: this.app.goals.defaultNearAngle
                });
                if(!result) return result;
            }
            // Prepare arm
            let galleryVar = this.getGallerySideVar(finalArm.value);
            if(galleryVar.value == 0) {
                await this.setArmDGL({ name:finalGLabel, duration: 200, wait: false });
            }
            else {
                await this.setArmDGH({ name:finalGLabel, duration: 200, wait: false });
            }
            await utils.sleep(500);
            await this.setPump({ name:finalPLabel, value: 140 });
            // Forward
            await this.moveAtAngle({
                angle: -90,
                distance: 180,
                speed: this.app.goals.defaultSpeed,
                nearDist: this.app.goals.defaultNearDist,
                nearAngle: this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Deposit
            await this.setPump({ name:finalPLabel, value: 0 });
            await utils.sleep(1000);
            // Update variables and score
            galleryVar.value++;
            await this.addScore({ score: finalArm.side==0? 6 : 3 });
            finalArm.value = "";
            // Backward
            await this.moveAtAngle({
                angle: -90,
                distance: -180,
                speed: this.app.goals.defaultSpeed,
                nearDist: this.app.goals.defaultNearDist,
                nearAngle: this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Close Arm
            await this.setArmDH({ name:finalGLabel, duration: 200, wait: true });
            await this.setArmUH({ name:finalGLabel, duration: 300, wait: true });
            await this.setArmDefault({ name:finalGLabel, duration: 400, wait: false });
        }
        
        result = await this.moveToComponent({
            component: "gallery",
            speed: this.app.goals.defaultSpeed,
            nearDist: this.app.goals.defaultNearDist,
            nearAngle: this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        result = await this.moveRepositionning({
            moveAngle: -90,
            newAngle: -90,
            newY: 155,//185
            distance: 280,
            speed: this.app.goals.defaultSpeed/2
        });
        if(!result) return result;
        
        // Backward
        result = await this.moveAtAngle({
            angle: -90,
            distance: -180,
            speed: this.app.goals.defaultSpeed,
            nearDist: this.app.goals.defaultNearDist,
            nearAngle: this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        return result;
    }

    async shareSampleBetweenArms(parameters){
        let arm = this.variables["arm"+parameters.from];
        let flipArm = this.variables["arm"+parameters.to];
        if(!arm || !flipArm) return false;
        
        let armGLabel = parameters.from+"G";
        let armPLabel = parameters.from+"P";
        let flipGLabel = parameters.to+"G";
        let flipPLabel = parameters.to+"P";
        let onLeft = false;
        if(arm.label == 'AB' && flipArm.label == "AC"){ onLeft = false; }
        if(arm.label == 'BC' && flipArm.label == "AC"){ onLeft = true;  }
        if(arm.label == 'AC' && flipArm.label == "BC"){ onLeft = false;  }
        else if(arm.label == 'AC' && flipArm.label == "AB"){ onLeft = true; }
        
        await this.setArmUH({ name:armGLabel, duration: 200, wait: false });
        await this.setArmUH({ name:flipGLabel, duration: 200, wait: false });
        await utils.sleep(400);
        let left_G = onLeft ? armGLabel : flipGLabel;
        let right_G = onLeft ? flipGLabel : armGLabel;
        await this.setArmPSL({ name:left_G, duration: 200, wait: false, high:false });
        await this.setArmPSR({ name:right_G, duration: 200, wait: false, high:false });
        await utils.sleep(400);
        // Share
        await this.setArmSL({ name:left_G, duration: 500, wait: false, high:true });
        await this.setArmSR({ name:right_G, duration: 500, wait: true, high:true });
        // Share Hight
        await this.setArmSL({ name:left_G, duration: 100, wait: false, high:false });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, high:false });
        // Share low
        await this.setArmSL({ name:left_G, duration: 100, wait: false, high:true });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, high:true });
        //Pump
        await this.setPump({ name:flipPLabel, value: 255 });
        await this.setPump({ name:armPLabel, value: 0 });
        //Wiggle
        await this.setArmSL({ name:left_G, duration: 100, wait: false, wiggle:true, high:true });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, wiggle:true, high:true });
        //-
        await this.setArmSL({ name:left_G, duration: 100, wait: false, wiggle:false, high:false });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, wiggle:false, high:false });
        //-
        await this.setArmSL({ name:left_G, duration: 100, wait: false, wiggle:true, high:true });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, wiggle:true, high:true });
        //-
        await this.setArmSL({ name:left_G, duration: 100, wait: false, high:false, high:true });
        await this.setArmSR({ name:right_G, duration: 100, wait: true, high:false, high:true });
        await utils.sleep(750);
        // Split
        await this.setArmPSL({ name:left_G, duration: 200, wait: false });
        await this.setArmPSR({ name:right_G, duration: 200, wait: false });
        await utils.sleep(400);
        await this.setArmDH({ name:armGLabel, duration: 200, wait: false });
        await this.setArmDH({ name:flipGLabel, duration: 200, wait: false });
        await utils.sleep(300);
        await this.setArmDefault({ name:armGLabel, duration: 200, wait: false });
            
        flipArm.value = arm.value;
        flipArm.side = arm.side == 0 ? 1 : 0;
        arm.value = "";
        return true;
    }

    async enablePump(parameters){
        if(this.modules.arm) await this.modules.arm.enablePump(parameters);
        return true;
    }

    async disablePump(parameters){
        if(this.modules.arm) await this.modules.arm.disablePump(parameters);
        return true;
    }
    
    async delay(parameters){
        await utils.sleep(parameters.duration);
        return true;
    }

    async openSideArms(parameters){
        let wait = true;
        if("wait" in parameters) wait = parameters.wait;
        if(this.modules.arm && parameters.name)
            await this.modules.arm.setServo({name:parameters.name, angle:10, duration: 300, wait: wait})
        return true;
    }

    async closeSideArms(parameters){
        if(this.modules.arm && parameters.name)
            await this.modules.arm.setServo({name:parameters.name, angle:75, wait:false})
        //if(parameters.addBuoyStorageSideGreen) this.variables.buoyStorageSideGreen.value+=parameters.addBuoyStorageSideGreen===true?1:parameters.addBuoyStorageSideGreen;
        //if(parameters.addBuoyStorageSideRed) this.variables.buoyStorageSideRed.value+=parameters.addBuoyStorageSideRed===true?1:parameters.addBuoyStorageSideRed;
        if(parameters.removeFromMap) parameters.removeFromMap.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
        return true;
    }
    
    async removeFromMap(parameters){
        if(parameters.list) parameters.list.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
        return true;
    }

    async validateWindsock(parameters){
        this.variables.windsocks.value+=1;
        if(this.variables.windsocks.value==1) this.addScore(5);
        if(this.variables.windsocks.value==2) this.addScore(10);
        return true;
    }

    async validateEndZone(parameters){
        if(this.variables.endZone.value!=0) this.addScore(5);
        return true;
    }

    async detectAndGrabBuoy(parameters){
        return false;
        if(!this.modules.camera) return true;
        //Grab
        let armCloseLookPosition = {a1:60, a2:95, a3:65, a4:75, a5:20, duration:200};
        let tryBudget = 3;
        let grabbed=false;
        while(--tryBudget>=0){
            if(this.modules.arm) await this.modules.arm.setPose(armCloseLookPosition)
            await utils.sleep(400);
            let detections = await this.modules.camera.detectBuoys();
            console.log(detections);
            //Find Most centered and low object in the image
            let target = null;
            let minDist = 1000;
            for(let obj of detections){
                let dx = 50 - obj.x;
                let dy = 100 - obj.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist<minDist){
                    target = obj;
                    minDist = dist;
                }
            }
            if(target==null || target.y<30){
                console.log("Detect, move forward")
                await this.moveForward({distance:100, speed:1});
                await this.moveBackward({distance:50, speed:1});
                continue;
            }
            console.log("Detect, grab")
            //Orient Arm
            let x=target.x, y=target.y;
            let x2=Math.pow(target.x,2), y2=Math.pow(target.y,2);
            let x3=Math.pow(target.x,3), y3=Math.pow(target.y,3);
            let x4=Math.pow(target.x,4), y4=Math.pow(target.y,4);
            let armPreGrabPosition = {a1:20, a2:95, a3:175, a4:70, a5:100, duration:200};
            /*armPreGrabPosition.a1 = 107.00000 + x*0.00000 + y*0.00000 + x2*0.00000 + y2*0.00000;
            armPreGrabPosition.a2 = 95.00000 + x*0.00000 + y*0.00000 + x2*0.00000 + y2*-0.00000;
            armPreGrabPosition.a3 = 248.30275 + x*0.00000 + y*-4.43747 + x2*0.00000 + y2*0.03621;
            armPreGrabPosition.a4 = 280.62456 + x*0.00000 + y*-5.93735 + x2*0.00000 + y2*0.03378;
            armPreGrabPosition.a5 = -31.23180 + x*-0.00000 + y*1.32075 + x2*0.00000 + y2*0.00369;*/

            armPreGrabPosition.a1 = 194 + -5.33*y + 0.134*y2 + -1.45e-03*y3 + 5.24e-06*y4;
            armPreGrabPosition.a2 = 95;
            armPreGrabPosition.a3 = 513 + -26.1*y + 0.659*y2 + -7.51e-03*y3 + 3.23e-05*y4;
            armPreGrabPosition.a4 = 673 + -35.8*y + 0.828*y2 + -8.89e-03*y3 + 3.57e-05*y4;
            armPreGrabPosition.a5 = -142 + 8.3*y + -0.139*y2 + 1.09e-03*y3 + -2.39e-06*y4;

            //let armPreGrabFarPosition = {a1:120, a2:95, a3:147, a4:134, a5:10, duration:200};
            let rotationDiff = Math.min(50, Math.max(-50,(target.x-50)*0.));
            armPreGrabPosition.a2 += rotationDiff;
            if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            await utils.sleep(200);
            //Enable pump
            //if(this.modules.arm) await this.modules.arm.enablePump();
            //Move down
            armPreGrabPosition.a1 = Math.max(170, armPreGrabPosition.a1+50);
            //if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            await utils.sleep(200);
            //Move up
            armPreGrabPosition.a1 = 40;
            //if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            grabbed=true;
            break;
        }
        //Deposit

        return true;
    }
    
    async performEndingMove(parameters){
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
    }
    
    async dance(parameters){
        await this.modules.base.enableManual();
        await this.modules.base.enableMove();
        
        let side = true;
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

