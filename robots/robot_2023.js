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
            //blue:{x:265,y:650,angle:0},
            yellow:{x:150,y:542,angle:0},
            violet:{x:2850,y:542,angle:180}
        }
        this.variables = {
            // value:{R|G|B|replica|artifact|''}, Side: 0=ready 1=flipped(not ready to drop) 
            armAC: { value: "", side: 0, label: "AC" },  
            armAB: { value: "", side: 0, label: "AB" },  
            armBC: { value: "", side: 0, label: "BC" },
            galleryRed: { value: 0, max: 4 },
            galleryGreen: { value: 0, max: 4 },
            galleryBlue: { value: 0, max: 4 },
            endReached: { value: 0, max: 1 },
            bottomDispenser: { value: 3, max: 3 },
            middleDispenser: { value: 3, max: 3 },
            foundInSite: { value: 0, max: 3 },
            foundInOppositSite: { value: 0, max: 3 },
        }
        this.collisionAngle = 115;
        this.collisionDistance = this.radius+250;
        this.slowdownDistance = this.collisionDistance+100;

        if(!this.app.parameters.simulate){
            this.modules.lidar = new Lidar(app)
            this.modules.lidarLoc = new LidarLoc(app);
            this.modules.lidarLocalisation = new LidarLocalisation(app)
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
        if(this.team == "yellow"){
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
        }
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
                draw: {},
                findLocalisation: {},
                detectAndGrabBuoy: {},
                debug_initPosition: {color:{ legend:"color", type:"text" },},
                debug_initActuators: {color:{ legend:"color", type:"text" },},
                activateExperiment: {},
                readWeathervane: {},
                detectAndGrabSample:{},
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

    /*async debug_initPosition(parameters){
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
    }*/
    
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
        if(this.modules.arm){
            await this.modules.arm.setPump({ name: parameters.name, value:parameters.value });
        }
        return true;
    }
    
    async setArmDefault(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:5, a3:170 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmCamera(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ a1:62, a2:5, a3:45 }, parameters);
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
        /*let high = false | (parameters.high);
        let pose = Object.assign({ a1:(high?125:105), a2:90, a3:40 }, parameters);*/
        let pose = Object.assign({a1:8, a2:115, a3:160}, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmSL(parameters){ // Share Left
        if(!parameters.name) return false;
        /*let high = false | (parameters.high);
        let wiggle = false | (parameters.wiggle);
        let pose = Object.assign({ a1:(high?125:105), a2:10, a3:(wiggle?25:45) }, parameters);*/
        let pose = Object.assign({a1:8, a2:155, a3:165}, parameters); //AC
        if(parameters.name=="BCG")
            pose = Object.assign({a1:8, a2:155, a3:155}, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmPSR(parameters){ // Pre Share Right
        if(!parameters.name) return false;
        /*let high = false | (parameters.high);
        let pose = Object.assign({ a1:(high?0:20), a2:90, a3:40 }, parameters);*/
        let pose = Object.assign({a1:115, a2:125, a3:160}, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmSR(parameters){ // Share Right
        if(!parameters.name) return false;
        /*let high = false | (parameters.high);
        let wiggle = false | (parameters.wiggle);
        let pose = Object.assign({ a1:(high?0:20), a2:10, a3:(wiggle?25:45) }, parameters);*/
        let pose = Object.assign({a1:115, a2:158, a3:155}, parameters); // AC
        if(parameters.name=="ABG")
            pose = Object.assign({a1:115, a2:165, a3:160}, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmDGH(parameters){ // Deposit Gallery High
        if(!parameters.name) return false;
        //let pose = Object.assign({ a1:172, a2:45, a3:130 }, parameters);
        let pose = Object.assign({ a1:62, a2:125, a3:50 }, parameters);
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
        //await utils.sleep(1000);
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
        let sideOffset = 250;
        let offsetXColorMap = {
            R: this.team == "yellow" ? sideOffset : -sideOffset,
            G: 0,
            B: this.team == "yellow" ? -sideOffset : sideOffset
        }
        
        let num = 0;
        
        for(let arm of depositList){
            
            let timeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
            if(!timeLeft) return true;
            
            // Check if nearby arm is available for flip (if needed)
            let flipArm = null;
            let onLeft = false;
            if(arm.side != 0){
                if(arm.label == 'AB' && this.variables.armAC.value==""){ flipArm = this.variables.armAC; onLeft = false; }
                if(arm.label == 'BC' && this.variables.armAC.value==""){ flipArm = this.variables.armAC; onLeft = true;  }
                if(arm.label == 'AC' && this.variables.armBC.value==""){ flipArm = this.variables.armBC; onLeft = true;  }
                else if(arm.label == 'AC' && this.variables.armAB.value==""){ flipArm = this.variables.armAB; onLeft = false; }
            }
            // Setup Flip
            let armGLabel = arm.label+"G";
            let armPLabel = arm.label+"P";
            let finalGLabel = armGLabel;
            let finalPLabel = armPLabel;
            let finalArm = arm;
            
            // Setup Orientation
            let directionLabel = arm.label;
            if(flipArm) directionLabel = flipArm.label;
            let orientation = -90;
            if(directionLabel == "AB") orientation = 30;
            if(directionLabel == "BC") orientation = 150;
            
            // Is deposit high
            let xOffset = offsetXColorMap[arm.value];
            let depositHigh = false;
            let galleryVar = this.getGallerySideVar(arm.value);
            if(galleryVar.value != 0) depositHigh = true;
            if(depositHigh) xOffset *= 0.6;
            
            // Move to gallery, oriented
            result = await this.moveToComponent({
                component: "gallery",
                angle: orientation,
                offsetX: xOffset,
                speed: this.app.goals.defaultSpeed,
                nearDist: this.app.goals.defaultNearDist,
                nearAngle: this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            
            if(num==0) this.findLocalisation({count:2});
            
            // Flip
            if(flipArm){
                await this.shareSampleBetweenArms({from:arm.label, to:flipArm.label});
                finalGLabel = flipArm.label+"G";
                finalPLabel = flipArm.label+"P";
                finalArm = flipArm;
            }
            if(!result) return result;
            // Prepare arm
            if(galleryVar.value == 0) {
                await this.setArmDGL({ name:finalGLabel, duration: 200, wait: false });
            }
            else {
                await this.setArmDGH({ name:finalGLabel, duration: 200, wait: false });
            }
            await utils.sleep(500);
            // Forward
            /*await this.moveAtAngle({
                angle: -90,
                distance: 180,
                speed: this.app.goals.defaultSpeed,
                nearDist: this.app.goals.defaultNearDist,
                nearAngle: this.app.goals.defaultNearAngle
            })
            if(!result) return result;*/
            result = await this.moveRepositionning({
                moveAngle: -90,
                newY: 200,//theory:185, hack:155
                distance: 200,
                speed: this.app.goals.defaultSpeed/2
            });
            if(!result) return result;
            // Deposit
            await this.setPump({ name:finalPLabel, value: 0 });
            await utils.sleep(400);
            // Update variables and score
            galleryVar.value++;
            if(galleryVar.value<=2)
                await this.addScore({ score: finalArm.side==0? 6 : 3 });
            finalArm.value = "";
            if(!depositHigh){
                await this.setArmDH({ name:finalGLabel, duration: 500, wait: false });
            }
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
            num++;
        }
        
        if(false){
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
                newY: 185,//theory:185, hack:155
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
        }
        else {
            this.findLocalisation({count:2});
        }
        
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
        //-----
        
        await this.setArmUH({ name:armGLabel, duration: 400, wait: false });
        await this.setArmUH({ name:flipGLabel, duration: 400, wait: false });
        await utils.sleep(400);
        let left_G = onLeft ? armGLabel : flipGLabel;
        let right_G = onLeft ? flipGLabel : armGLabel;
        await this.setArmPSL({ name:left_G, duration: 500, wait: false});
        await this.setArmPSR({ name:right_G, duration: 500, wait: false});
        await utils.sleep(500);
        await this.setPump({ name:flipPLabel, value: 255 });
        await this.setArmSL({ name:left_G, duration: 200, wait: false });
        await this.setArmSR({ name:right_G, duration: 200, wait: false });
        await utils.sleep(200);
        await this.setPump({ name:armPLabel, value: 0 });
        await utils.sleep(500);
        await this.setArmPSL({ name:left_G, duration: 200, wait: false});
        await this.setArmPSR({ name:right_G, duration: 200, wait: false});
        await utils.sleep(300);
        await this.setArmUH({ name:armGLabel, duration: 300, wait: false });
        await this.setArmUH({ name:flipGLabel, duration: 400, wait: false });
        //await this.setArmDH({ name:armGLabel, duration: 200, wait: false });
        //await this.setArmDH({ name:flipGLabel, duration: 200, wait: false });
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
    
    async detectAndGrabSample(parameters){
        if(!this.modules.camera) return true;
        
        let patternWidth = 200;// in position AND negative dir
        let patternHeight = 300;// in positive dir
        let stepX = 100;
        let stepY = 150;
        let offsetY = 100;
        for(let yDiff = 0; yDiff<=patternHeight; yDiff+=stepY){
            for(let xDiff = -patternWidth; xDiff<=patternWidth; xDiff+=stepX){
                let posX = xDiff;
                let posY = yDiff + offsetY;
                let timeLeft = this.app.intelligence.currentTime <= this.app.intelligence.matchDuration-10*1000;
                if(!timeLeft) return true;
                
                // Resolve target site
                let targetColor = this.team;
                let opposit = parameters.opposit||false;
                if(opposit){
                    if(this.team == "yellow") targetColor = "violet";
                    if(this.team == "violet") targetColor = "yellow";
                }
                
                // Move
                if(this.modules.arm) await this.setArmCamera({name:"ACG", duration: 0, wait: false})
                let result = await this.moveToComponent({
                    component: "site",
                    color: targetColor,
                    angle: 90,
                    offsetX: posX,
                    offsetY: posY,
                    speed: this.app.goals.defaultSpeed,
                    nearDist: this.app.goals.defaultNearDist,
                    nearAngle: this.app.goals.defaultNearAngle
                });
                if(!result) return result;
                
                // Detect
                let detections = await this.modules.camera.detectArucos();
                console.log(detections);
                
                //Find Most centered and low object in the image
                let target = null;
                for(let obj of detections){
                    let dx = obj.x - 160;
                    let dy = obj.y - 120;
                    
                    if(Math.abs(dx)>stepX) {continue;} // Too far from center
                    if(    ''+obj.id != '13'
                        && ''+obj.id != '36'
                        && ''+obj.id != '47'){
                        continue; // Not expected tag
                    }
                    target = obj;
                }
                if(target==null){ continue; }
                // Grab
                console.log("Detected!", target)
                let dx = target.x - 160;
                let offsetX = -dx*0.66;
                let dist = 50;
                let backDist = 50;
                if(target.y<150){ dist = 100; }
                if(target.y<100){ dist = 150; backDist=0;}
                if(target.y<50){ dist = 200; backDist=0;}
                // Find available arm
                let targetSide = "";
                if( this.app.robot.variables.armBC.value == ""){targetSide="BC"}
                else if( this.app.robot.variables.armAB.value == ""){targetSide="AB"}
                else if( this.app.robot.variables.armAC.value == ""){targetSide="AC"}
                if(targetSide=="") return true;
                let moveAngle = 90;
                let orientation = 90;
                if(targetSide == "BC") orientation = -30;
                if(targetSide == "AB") orientation = -150;
                
                await this.setArmUH({name:targetSide+"G"})
                
                
                // Backward
                if(backDist>0){
                    result = await this.moveAtAngle({
                        angle: -90,
                        distance: backDist,
                        speed: this.app.goals.defaultSpeed,
                        nearDist: this.app.goals.defaultNearDist,
                        nearAngle: this.app.goals.defaultNearAngle
                    });
                    if(!result) return result;
                }
                await this.setArmDH({name:targetSide+"G"})
                
                // Rotate
                result = await this.rotateToAngle({
                    angle: orientation,
                    speed: 0.8,//this.app.goals.defaultSpeed
                });
                if(!result) return result;
                await this.setArmPGV({name:targetSide+"G"})
                await this.setPump({name:targetSide+"P", value: 255})
                await utils.sleep(400);
                
                // Forward
                result = await this.moveAtAngle({
                    angle: moveAngle,
                    distance: dist+backDist,
                    offsetX: offsetX,
                    speed: this.app.goals.defaultSpeed,
                    //nearDist: this.app.goals.defaultNearDist,
                    //nearAngle: this.app.goals.defaultNearAngle
                });
                if(!result) return result;
                //await this.moveForward({distance:dist, speed:0.5});
                await this.setArmGV({name:targetSide+"G"})
                await utils.sleep(400);
                // Backward
                /*await this.moveAtAngle({
                    angle: moveAngle,
                    distance: -100,
                    speed: this.app.goals.defaultSpeed,
                    nearDist: this.app.goals.defaultNearDist,
                    nearAngle: this.app.goals.defaultNearAngle
                });*/
                //await this.moveBackward({distance:100, speed:0.5});
                if(''+target.id == '13')
                    this.setVariable({name:"arm"+targetSide, value:"B", side:0});
                else if(''+target.id == '36')
                    this.setVariable({name:"arm"+targetSide, value:"G", side:0});
                else if(''+target.id == '47')
                    this.setVariable({name:"arm"+targetSide, value:"R", side:0});
                    
                if(opposit){
                    this.app.robot.variables.foundInOppositSite.value += 1;
                }
                else {
                    this.app.robot.variables.foundInSite.value += 1;
                }
                
                    
                await this.setArmDH({name:targetSide+"G", duration: 400, wait: true});
                await this.setArmDefault({name:targetSide+"G", duration:400, wait:true});
                
                if(targetSide=="AC") return true;
                // Exchange
                /*if( this.app.robot.variables.armBC.value == ""){
                    await this.shareSampleBetweenArms({from:"AC", to:"BC"});
                    await this.setArmDefault({name:"BCG", duration:400, wait:false});
                }
                else if(this.app.robot.variables.armAB.value == ""){
                    await this.shareSampleBetweenArms({from:"AC", to:"AB"});
                    await this.setArmDefault({name:"ABG", duration:400, wait:false});
                }
                else {
                    return true
                }*/
            }
        }

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
            let status = await this.modules.controlPanel.getColorStart();
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

        let offset = path[0];
        let ratio = 0.20;
        for(let point of path){
            let result = await this.moveToPosition({
                x: (point.x - offset.x)*ratio,
                y: (point.y - offset.y)*ratio,
                preventPathFinding: true,
                angle: 0,
                speed: 0.3,
                //nearDist: this.app.goals.defaultNearDist,
                //nearAngle: this.app.goals.defaultNearAngle
            });
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

