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
            armAC: { value: "", label: "ACG" },  
            armAB: { value: "", label: "ABG" },  
            armBC: { value: "", label: "BCG" },
            doorsAC: { value: "", label: "ACD" },  
            doorsAB: { value: "", label: "ABD" },  
            doorsBC: { value: "", label: "BCD" },
            storageAB: { value: "", label: "SAB" },
            storageBC: { value: "", label: "SBC" },
            //galleryRed: { value: 0, max: 4 },
            //galleryGreen: { value: 0, max: 4 },
            //galleryBlue: { value: 0, max: 4 },
            startZone: { value: "" },
            endReached: { value: 0, max: 1 },
            endZone: { value: "" },
            startRushed: { value: 0, max: 1 },
            //bottomDispenser: { value: 3, max: 3 },
            //middleDispenser: { value: 3, max: 3 },
            //foundInSite: { value: 0, max: 3 },
            //foundInOppositSite: { value: 0, max: 3 },
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
        
        this.armCloseAngle = 131;
        this.armGrabtHeight = 29;
        this.cherryLayer = 3.0;
        this.maxLayer = 3.6;
        this.armGrabPoseHistory = [];
        
        
        this.thumbCloseAngle = 100;
        this.fingerCloseAngle = 50;
        this.doorsCloseAngle = 45;
        
    }

    async init(){
        await super.init();
        if(this.modules.arm/* && this.modules.robotLink*/){
            await this.modules.arm.init().catch((e)=>{
                this.modules.arm.close();
                this.modules.arm = null;
            })
        } else this.modules.arm = null;
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

    async initMatch(){
        await super.initMatch();
        
        // Set arms at default position
        if(this.modules.arm) await this.modules.arm.setLed({ brightness: 0, color: 0});
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "ACG", a1:40, a2:150, a3:150, a4:150 });
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "ABG", a1:40, a2:150, a3:150, a4:150 });
        //if(this.modules.arm) await this.modules.arm.setPose({ name: "BCG", a1:40, a2:150, a3:150, a4:150 });
        
        //await this.setArmToLayer({name:"ACG", layer:3.2, open:false, transport: false, duration: 200, packed: true});
        //await this.setArmToLayer({name:"ABG", layer:3.2, open:false, transport: false, duration: 200, packed: true});
        //await this.setArmToLayer({name:"BCG", layer:3.2, open:false, transport: false, duration: 200, packed: true});
        
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        await utils.sleep(500);
        //this.setArmsPacked({});
        
        if(this.modules.base) await this.modules.base.enableMove();
        
        /*if(this.name == "Robot Nesnes TDS"){
            this.setVariable({name:"cherryAC", value:2});
            this.setVariable({name:"cherryAB", value:2});
            this.setVariable({name:"cherryBC", value:2});
        }*/
        
        /*await this.setArmDefault({ name: "ACG", duration: 0, wait: false});
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
        }*/
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
                draw:{},
                dance2023: {},
                testSetPosition: {},
                findLocalisation: {},
                rushBrownFromCenter: {},
                testDepositCake:{},
                testFindAndGrabCake: {},
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
                //armDance: { },
                depositInZone:{},
                depositDoorsInZone:{},
                depositInPlanter:{},
                stealPlants:{},
                goGrabPlants:{ grabWithDoors:{ type:"number", min:0, max:1, value:0 }},
                setArmsPacked:{ },
                setDoorsPacked:{ },
                setArmsPreGrab:{ },
                setDoorsPreGrab:{ },
                setArmsGroup:{ },
                setDoorsGroup:{ },
                setArmsGrab:{ },
                setDoorsGrab: { },
                setArmsStore:{ },
                setArmsPrePlanter:{ },
                setArmsLowerPlanter:{ },
                setArmsPlanter:{ },
                setArmsPostPlanter:{ },
                setDoorsFlat:{ },
                setArmsPreSolar:{ },
                setArmsLowerSolar:{ },
                setArmsSolar:{ },
                setArmsPreStealPlanter:{},
                setArmsLowerStealPlanter:{},
                setArmsStealPlanter:{},
                grabPlants:{
                    targetArm:{ legend:"targetArm", type:"text" }
                },
                isMovementPossible:{}
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
    
    async removeOpponentCakes(parameters){
        let targetColor = "blue";
        if(this.team == "green"){
            let cmp1 = this.app.map.getComponentByName("Cake Top Pink Blue", "cakePink", "");
            this.removeFromMap({component: cmp1});
            let cmp2 = this.app.map.getComponentByName("Cake Top Yellow Blue", "cakeYellow", "");
            this.removeFromMap({component: cmp2});
        }
        else{
            let cmp1 = this.app.map.getComponentByName("Cake Top Pink Green", "cakePink", "");
            this.removeFromMap({component: cmp1});
            let cmp2 = this.app.map.getComponentByName("Cake Top Yellow Green", "cakeYellow", "");
            this.removeFromMap({component: cmp2});
        }
        return true;
    }
    
    async armDance(parameters){
        if(!this.modules.arm) return false;
        await this.setArmsPacked({});
        await utils.sleep(1000);
        let moveDuration = 0;
        let poseSideExtend = Object.assign({ a1:100, a2:200, a3:250, a4:200, a5:170, duration: moveDuration });
        let poseSideSmall = Object.assign({ a1:100, a2:280, a3:120, a4:100, a5:140, duration: moveDuration });
        let poseFrontExtend = Object.assign({ a1:140, a2:200, a3:250, a4:200, a5:170, duration: moveDuration });
        let poseFrontSmall = Object.assign({ a1:140, a2:280, a3:120, a4:100, a5:140, duration: moveDuration });
        let sleepDuration = 700;
        await this.modules.base.enableManual();
        await this.modules.base.enableMove();
        
        this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -200 });
        await utils.sleep(sleepDuration/2);
        
        for(let j=0;j<3;j++){
            //Sides
            for(let i=0;i<3;i++){
                this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 200 });
                await this.modules.arm.setLed({ brightness: 100, color: i * 30});
                await this.modules.arm.setPose(Object.assign(poseSideExtend, {name:"CCG"}));
                await this.modules.arm.setPose(Object.assign(poseSideExtend, {name:"AAG"}));
                await utils.sleep(sleepDuration);
                this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -200 });
                await this.modules.arm.setLed({ brightness: 100, color: i*50});
                await this.modules.arm.setPose(Object.assign(poseSideSmall, {name:"CCG"}));
                await this.modules.arm.setPose(Object.assign(poseSideSmall, {name:"AAG"}));
                await utils.sleep(sleepDuration);
            }
            
            // Front
            for(let i=0;i<3;i++){
                this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: 200 });
                await this.modules.arm.setLed({ brightness: 100, color: i * 30});
                await this.modules.arm.setPose(Object.assign(poseFrontExtend, {name:"CCG"}));
                await this.modules.arm.setPose(Object.assign(poseFrontExtend, {name:"AAG"}));
                await utils.sleep(sleepDuration/2);
                this.modules.base.moveManual({ moveAngle: 0, moveSpeed: 0, angleSpeed: -200 });
                await this.modules.arm.setLed({ brightness: 100, color: i*50});
                await this.modules.arm.setPose(Object.assign(poseFrontSmall, {name:"CCG"}));
                await this.modules.arm.setPose(Object.assign(poseFrontSmall, {name:"AAG"}));
                await utils.sleep(sleepDuration/2);
            }
        }
        
        await this.modules.base.disableManual();
        await this.modules.base.disableMove();
        
        
        
        
        return true;
    }
    
    async setArmsAt(parameters){
        let armList = ["AC", "AB", "BC"]
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
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        let pose = { a1:270, a2:352, a3:225, a4:200, duration:300, wait:false };
        console.log("setArmsPacked", armList);
        for(let targetArm of armList) {
            if(this.variables["arm"+targetArm].value != ""){
                await this.setArmsStore({armList:[targetArm], duration: 300, wait:false });   
            }
            else {
                await this.setArmsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
            }
        }
        return true;
    }
    
    async setArmsPreGrab(parameters){
        let pose = { a1:270, a2:280, a3:160, a4:175, duration:300, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsGroup(parameters){
        let pose = { a1:270, a2:273, a3:140, a4:90, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsGrab(parameters){
        let pose = { a1:270, a2:265, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsStore(parameters){
        let pose = { a1:260, a2:350, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPrePlanter(parameters){
        let pose = { a1:200, a2:248, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:500, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsLowerPlanter(parameters){
        let pose = { a1:215, a2:220, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:100, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPlanter(parameters){
        let pose = { a1:220, a2:220, a3:130, a4:130, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsZone(parameters){
        let pose = { a1:270, a2:300, a3:170, a4:130, duration:300, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPreZone(parameters){
        let pose = { a1:270, a2:300, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:300, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPostPlanter(parameters){
        let pose = { a1:200, a2:270, a3:210, a4:190, duration:500, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPreSolar(parameters){
        let pose = { a1:190, a2:200, a3:70, a4:105, duration:500, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsLowerSolar(parameters){
        let pose = { a1:200, a2:180, a3:70, a4:105, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsSolar(parameters){
        let pose = { a1:200, a2:180, a3:85, a4:67, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsEnd(parameters){
        let pose = { a1:160, a2:180, a3:80, a4:70, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsPreStealPlanter(parameters){
        let pose = { a1:210, a2:209, a3:121, a4:200, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsLowerStealPlanter(parameters){
        let pose = { a1:212, a2:190, a3:131, a4:130, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setArmsStealPlanter(parameters){
        let pose = { a1:215, a2:190, a3:this.thumbCloseAngle, a4:this.fingerCloseAngle, duration:0, wait:false };
        return await this.setArmsAt(Object.assign({}, {pose}, parameters));
    }
    
    /*async setArmsPacked(parameters){
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        // Intermediate
        let intermedtiateArmPose = Object.assign({a1:150, a2:260, a3:120, a4:50, a5:150, duration: 300, wait:false }, parameters);
        let intermedtiateFrontPose = Object.assign({a1:80, a2:50, a3:105, a4:240, duration: 300, wait:false }, parameters);
        for(let targetArm of armList) {
            let intermedtiatePose = intermedtiateArmPose;
            if (targetArm == "AC") intermedtiatePose = intermedtiateFrontPose;
            let pose = Object.assign({}, intermedtiatePose, { name: targetArm+"G"});
            if(this.modules.arm) await this.modules.arm.setPose(pose);
        }
        // Wait for position
        for(let targetArm of armList) {
            let intermedtiatePose = intermedtiateArmPose;
            if (targetArm == "AC") {
                intermedtiatePose = intermedtiateFrontPose;
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'T', position: intermedtiatePose.a3, precision: 20, timeout: 500});
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'F', position: intermedtiatePose.a4, precision: 20, timeout: 500});
            }
            else{
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'R', position: intermedtiatePose.a1, precision: 20, timeout: 500});
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'S', position: intermedtiatePose.a2, precision: 20, timeout: 500});
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'E', position: intermedtiatePose.a3, precision: 20, timeout: 500});
                if(this.modules.arm) await this.modules.arm.waitServo({ name: targetArm+'W', position: intermedtiatePose.a4, precision: 20, timeout: 500});
            }
        }
        // Final pose
        let finalArmPose = Object.assign({ a1:260, a2:340, a3:200, a4:180, duration:300, wait:false }, parameters);
        for(let targetArm of armList) {
            let pose = Object.assign({}, finalArmPose, {name: targetArm+"G"});
            if(this.modules.arm) await this.modules.arm.setPose(pose);
        }
        return true;
    }*/
    
    async setDoorsAt(parameters){
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        if(!("pose" in parameters)) return false;
        let targetPose = Object.assign(parameters.pose, parameters);
        for(let targetArm of armList) {
            let pose = Object.assign({}, targetPose, {name: targetArm+"D"});
            if(this.modules.arm) await this.modules.arm.setPose(pose);
        }
        return true;
    }
    
    
    async setDoorsPacked(parameters){
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return true;
        let pose = { a1:3, a2:3, duration:0, wait:false };
        for(let targetArm of armList) {
            if(this.variables["doors"+targetArm].value != ""){
                await this.setDoorsGrab({armList:[targetArm], duration: 300, wait:false });   
            }
            else {
                await this.setDoorsAt(Object.assign({}, {pose}, parameters, {armList:[targetArm]}));
            }
        }
        return true;
    }
    
    async setDoorsFlat(parameters){
        let pose = { a1:30, a2:30, duration:0, wait:false };
        return await this.setDoorsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setDoorsPreGrab(parameters){
        let pose = { a1:135, a2:135, duration:0, wait:false };
        return await this.setDoorsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setDoorsGroup(parameters){
        let pose = { a1:90, a2:90, duration:0, wait:false };
        return await this.setDoorsAt(Object.assign({}, {pose}, parameters));
    }
    
    async setDoorsGrab(parameters){
        let pose = { a1:this.doorsCloseAngle, a2:this.doorsCloseAngle, duration:0, wait:false };
        return await this.setDoorsAt(Object.assign({}, {pose}, parameters));
    }
    
    async identifyStartZone(parameters){
        let result = true;
        // Get zone list
        let zoneTypes = ["baseReserved", "baseMiddle", "baseBottom"]
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
    
    async startRush(parameters){
        let result = true;
        let rushSpeed = this.app.goals.rushSpeed;
        let rushAngleSpeed = this.app.goals.rushAngleSpeed;
        let rushAccel = this.app.goals.rushAccel;
        let rushAccelAngle = this.app.goals.rushAccelAngle;
        // Deduce opposit team color
        let opposit = "blue";
        if (this.team=="blue") opposit = "yellow";
        
        // Use modifier 1
        let throughTop = this.app.parameters.modifier1;
        
        // Set rush trajectories
        let rushList = [
            {
                name: "BottomThroughTop",
                throughTop: true,
                steps: [{zone:"PlantBottom_"+this.team, tag:"bottom"+this.team},
                        {zone:"PlantTop_"+this.team, tag:"bottom"},
                        {zone:"PlantTop_center", tag:this.team},
                        {zone:"PlantTop_"+opposit, tag:"top"+this.team},
                        {zone:"PlantBottom_"+opposit, tag:"top"}
                ],
                zoneFrom: "baseBottom"
            },
            {
                name: "BottomThroughBottom",
                throughTop: false,
                steps: [{zone:"PlantBottom_"+this.team, tag:"bottom"+this.team},
                        {zone:"PlantBottom_center", tag:this.team},
                        {zone:"PlantBottom_"+opposit, tag:"bottom"+this.team},
                        {zone:"PlantTop_"+opposit, tag:"bottom"},
                        {zone:"PlantTop_center", tag:opposit}
                ],
                zoneFrom: "baseBottom"
            },
            {
                name: "MiddleThroughTop",
                throughTop: true,
                steps: [{zone:"PlantTop_"+opposit, tag:"bottom"+opposit},
                        {zone:"PlantTop_center", tag:opposit},
                        {zone:"PlantTop_"+this.team, tag:"top"+opposit},
                        {zone:"PlantBottom_"+this.team, tag:"top"},
                        {zone:"PlantBottom_center", tag:this.team}
                ],
                zoneFrom: "baseMiddle"
            },
            {
                name: "MiddleThroughBottom",
                throughTop: false,
                steps: [{zone:"PlantBottom_"+opposit, tag:"top"+opposit},
                        {zone:"PlantBottom_center", tag:opposit},
                        {zone:"PlantBottom_"+this.team, tag:"bottom"+opposit},
                        {zone:"PlantTop_"+this.team, tag:"bottom"},
                        {zone:"PlantTop_center", tag:this.team}
                ],
                zoneFrom: "baseMiddle"
            },
            {
                name: "TopThroughTop",
                throughTop: true,
                steps: [{zone:"PlantTop_"+this.team, tag:"top"+this.team},
                        {zone:"PlantTop_center", tag:this.team},
                        {zone:"PlantTop_"+opposit, tag:"top"+this.team},
                        {zone:"PlantBottom_"+opposit, tag:"top"},
                        {zone:"PlantBottom_center", tag:opposit}
                ],
                zoneFrom: "baseReserved"
            },
            {
                name: "TopThroughBottom",
                throughTop: false,
                steps: [{zone:"PlantTop_"+this.team, tag:"top"+this.team},
                        {zone:"PlantBottom_"+this.team, tag:"top"},
                        {zone:"PlantBottom_center", tag:this.team},
                        {zone:"PlantBottom_"+opposit, tag:"bottom"+this.team},
                        {zone:"PlantTop_"+opposit, tag:"bottom"}
                ],
                zoneFrom: "baseReserved"
            }
        ]
        
        // Select rush
        let targetRush = null;
        for(let rush of rushList) {
            // Check if start position matches
            let rushFromZone = this.app.map.getComponent(rush.zoneFrom, this.team);
            let isInRushFromZone = this.app.map.isContainedIn(this.x, this.y, rushFromZone);
            if(!isInRushFromZone) continue;
            if(!targetRush) targetRush = rush;
            // Check if it matches throughTop parameter
            if(throughTop == rush.throughTop){
                targetRush = rush;
                break;
            }
        }
        if(!targetRush) return false;
        this.app.logger.log("Running rush "+targetRush.name)
        
        let collisionDistanceBackup = this.collisionDistance;
        let collisionDistanceOffset = 0;//150; // To extend collision distance if going too fast
        let isFirstMove = true;
        for(let step of targetRush.steps){
            this.collisionDistance = collisionDistanceBackup+collisionDistanceOffset;
            result = await this.goGrabPlants({
                zoneName:   step.zone,
                accessTag:  step.tag,
                speed:      isFirstMove?rushSpeed:this.app.goals.rushSpeedNext,
                accelDist:  isFirstMove?rushAccel:this.app.goals.rushAccelNext,
                accelAngle:  isFirstMove?rushAccelAngle:this.app.goals.rushAccelAngleNext,
                angleSpeed: isFirstMove?rushAngleSpeed:this.app.goals.rushAngleSpeedNext
            });
            this.collisionDistance = collisionDistanceBackup;
            isFirstMove = false;
        }
        
        /*this.collisionDistance = collisionDistanceBackup+collisionDistanceOffset;
        result = await this.depositInZone({plateList:[targetRush.zoneTo]});
        this.collisionDistance = collisionDistanceBackup;
        if(!result) return result;*/
        
        return result;
    }
    
    async depositInPlanter(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "deposit in planter");
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        
        // Find arm
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;
        
        let targetArm = "";
        let targetAngleOffset = 0;
        if (armList.includes("AC") && this.variables.armAC.value != "")      { targetArm = "AC"; targetAngleOffset = 0; }
        else if (armList.includes("BC")&& this.variables.armBC.value != "")  { targetArm = "BC"; targetAngleOffset = -120; }
        else if (armList.includes("AB")&& this.variables.armAB.value != "")  { targetArm = "AB"; targetAngleOffset = 120; }
        if(targetArm == "") return false;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let plateTypes = ["planter_reserved", "planter"];
        if(parameters.plateTypes) plateTypes = parameters.plateTypes;
        for(let type of plateTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        this.app.logger.log("plateList", plateList)
        // Indentify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength/* && pathLength > 50*/){
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
        
        await this.setDoorsFlat({armList:[targetArm], duration: 1000, wait:false});
        
        //Adapt speed to proximity
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(minLength < 800) moveSpeed *= 0.5;
        
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
        
        await this.setArmsPrePlanter({armList:[targetArm], duration: 0, wait:false});
        
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 250,
            speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   25,
            nearAngle:  5,
            preventLocalisation: true
        });
        if(!result) return result;
        
        await this.setArmsLowerPlanter({armList:[targetArm], wait:false});
        await utils.sleep(300);
        
        
        //await utils.sleep(500);
        await this.setArmsPlanter({armList:[targetArm], wait:false});
        await utils.sleep(200);
        await this.setArmsPostPlanter({armList:[targetArm], wait:false});

        this.addScore(12);
        //this.addScore(this.variables["arm"+targetArm].value.length() * 4);
        this.setVariable({name:"arm"+targetArm, value:""});
        await this.removeFromMap({component: targetPlate});
        
        
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
        
        await this.setArmsPacked({armList:[targetArm], wait:false});
        await this.setDoorsPacked({armList:[targetArm], wait:false});
        
        
        if(!result) return result;
        return result;
    }
    
    async depositInZone(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "deposit in zone");
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        
        // Find arm
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;
        
        let targetArm = "";
        let targetAngleOffset = 0;
        if (armList.includes("AC") && this.variables.armAC.value != "")       { targetArm = "AC"; targetAngleOffset = 0; }
        else if (armList.includes("BC") && this.variables.armBC.value != "")  { targetArm = "BC"; targetAngleOffset = -120; }
        else if (armList.includes("AB") && this.variables.armAB.value != "")  { targetArm = "AB"; targetAngleOffset = 120; }
        if(targetArm == "") return false;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let plateTypes = ["baseReserved", "baseMiddle", "baseBottom"];
        if(parameters.plateTypes) plateTypes = parameters.plateTypes;
        for(let type of plateTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        this.app.logger.log("plateList", plateList)
        // Indentify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        let targetDist = 0;
        for(let plate of plateList){
            let accessList = []
            let distMalus = 0;
            if(plate.plants) distMalus = 2600*plate.plants;
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if((pathLength+distMalus)<minLength/* && pathLength > 50*/){
                    minLength = pathLength+distMalus;
                    targetDist = pathLength;
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
        
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        this.app.logger.log("targetDist", targetDist)
        if(targetDist < 800) moveSpeed *= 0.5;
        // Move to target
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   200||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  10||parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventBreak: true
        });
        if(!result) return result;
        
        await this.setDoorsPreGrab({armList:[targetArm], duration: 0, wait:false});
        await this.setArmsPreZone({armList:[targetArm], duration: 300, wait:false});
        // Refine end position
        /*result = await this.moveCorrectPosition({
            speed: (parameters.speed||this.app.goals.defaultSpeed)/2
        });*/
        
        /*result = await this.moveCorrectPosition({
            speed: 0.5||parameters.speed||this.app.goals.defaultSpeed
        });
        if(!result) return result;*/
        
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 250,
            speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   150,
            nearAngle:  5,
            preventLocalisation: false,
            preventBreak: false
        });
        if(!result) return result;
        
        await this.setArmsZone({armList:[targetArm], duration: 300, wait:false});
        await this.setDoorsGroup({armList:[targetArm], duration: 200, wait:false});
        await utils.sleep(200);
        
        await this.setDoorsPreGrab({armList:[targetArm], duration: 200, wait:false});
        
        this.addScore(4);
        //this.addScore(this.variables["arm"+targetArm].value.length() * 3);
        this.setVariable({name:"arm"+targetArm, value:""});
        if(targetPlate.plants)  targetPlate.plants += 1;
        else targetPlate.plants = 1;
        
        
        // Backward
        await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: -250,
            speed: parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: true
        });
        
        await this.setArmsPacked({armList:[targetArm], wait:false});
        await this.setDoorsPacked({armList:[targetArm], wait:false});
        
        
        if(!result) return result;
        return result;
    }
    
    async depositDoorsInZone(parameters){
        let result = true;
        
        this.app.logger.log("deposit doors in zone");
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        
        // Find arm
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;
        
        let targetArm = "";
        let targetAngleOffset = 0;
        if (armList.includes("AC") && this.variables.doorsAC.value != "")       { targetArm = "AC"; targetAngleOffset = 0; }
        else if (armList.includes("BC") && this.variables.doorsBC.value != "")  { targetArm = "BC"; targetAngleOffset = -120; }
        else if (armList.includes("AB") && this.variables.doorsAB.value != "")  { targetArm = "AB"; targetAngleOffset = 120; }
        if(targetArm == "") return false;
        
        
        this.app.logger.log("deposit door", targetArm, targetAngleOffset);
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let plateTypes = ["baseReserved", "baseMiddle", "baseBottom"];
        if(parameters.plateTypes) plateTypes = parameters.plateTypes;
        for(let type of plateTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        this.app.logger.log("plateList", plateList)
        // Indentify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        let targetDist = 0;
        for(let plate of plateList){
            let accessList = []
            let distMalus = 0;
            if(plate.plants) distMalus = 2600*plate.plants;
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if((pathLength+distMalus)<minLength/* && pathLength > 50*/){
                    minLength = pathLength+distMalus;
                    targetDist = pathLength;
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
        
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(targetDist < 800) moveSpeed *= 0.5;
        this.app.logger.log({targetDist}, {moveSpeed}, {grabOrientation});
        // Move to target
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      grabOrientation,
            speed:      moveSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   200||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  10||parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventBreak: true
        });
        if(!result) return result;
        
        // Refine end position
        /*result = await this.moveCorrectPosition({
            speed: (parameters.speed||this.app.goals.defaultSpeed)/2
        });*/
        
        /*result = await this.moveCorrectPosition({
            speed: 0.5||parameters.speed||this.app.goals.defaultSpeed
        });
        if(!result) return result;*/
        
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 250,
            speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   150,
            nearAngle:  5,
            preventLocalisation: false,
            preventBreak: false
        });
        if(!result) return result;
        
        await this.setDoorsPreGrab({armList:[targetArm], duration: 400, wait:false});
        await utils.sleep(100);
        
        
        this.addScore(4);
        //this.addScore(this.variables["arm"+targetArm].value.length() * 3);
        this.setVariable({name:"doors"+targetArm, value:""});
        if(targetPlate.plants)  targetPlate.plants += 1;
        else targetPlate.plants = 1;
        
        // Backward
        await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: -350,
            speed: parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   50,
            nearAngle:  5,
            preventLocalisation: true
        });
        await this.setDoorsPacked({armList:[targetArm], duration: 200, wait:false});
        
        
        if(!result) return result;
        return result;
    }
    
    async solarPanels(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "solar panels");
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        
        // Find arm
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;
        
        let targetArm = "";
        let targetAngleOffset = 0;
        if (armList.includes("AC") && this.variables.armAC.value == "" && this.variables.doorsAC.value == "")       { targetArm = "AC"; targetAngleOffset = 0; }
        else if (armList.includes("BC") && this.variables.armBC.value == "" && this.variables.doorsBC.value == "")  { targetArm = "BC"; targetAngleOffset = -120; }
        else if (armList.includes("AB") && this.variables.armAB.value == "" && this.variables.doorsAB.value == "")  { targetArm = "AB"; targetAngleOffset = 120; }
        if(targetArm == "") return false;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let plateTypes = ["panel_color_access","panel_shared_access"];
        if(parameters.plateTypes) plateTypes = parameters.plateTypes;
        for(let type of plateTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        this.app.logger.log("panelList", plateList)
        // Indentify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength/* && pathLength > 50*/){
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
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        
        await this.setDoorsPacked({duration:1000, wait:false});
        
        //Adapt speed to proximity
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(minLength < 800) moveSpeed *= 0.5;
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
        
        await this.setArmsPreSolar({armList:[targetArm], duration:500, wait:false});
        
        result = await this.moveAtAngle({
            angle: grabOrientation,
            distance: 230,
            speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   25,
            nearAngle:  5,
            preventLocalisation: true
        });
        if(!result) return result;
        
        await utils.sleep(200);
        
        await this.setArmsLowerSolar({armList:[targetArm], duration:0, wait:false});
        
        await utils.sleep(500);
        
        await this.setArmsSolar({armList:[targetArm], duration:0, wait:false});
        
        let stepDist = this.team=="blue"?-190:190;
        
        for(let i=0;i<3;i++){
            result = await this.moveToPosition({
                x:          this.x+stepDist,
                y:          this.y,
                angle:      this.angle,
                speed:      0.25||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
                preventLocalisation: true
            });
            if(!result){
                this.app.logger.log("Solar panel move failed", i);
                await this.setArmsPreSolar({armList:[targetArm], duration:0, wait:false});
                await utils.sleep(250);
                await this.moveToPosition({
                    x:          this.x - stepDist,
                    y:          this.y - 200,
                    angle:      this.angle,
                    speed:      0.1||parameters.speed||this.app.goals.defaultSpeed,
                    angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                    nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                    nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
                    preventLocalisation: true
                });
                await this.moveBackward({distance:200, speed:0.3, preventLocalisation: true});
                await this.setArmsPacked({armList:[targetArm], duration:0, wait:false});
                return result;
            }
            else{
                this.addScore(5);
            }
        }
        
        await this.setArmsPreSolar({armList:[targetArm], duration:0, wait:false});
        
        await this.removeFromMap({component: targetPlate});
        
        //await this.moveBackward({distance:200, speed:0.3, preventLocalisation: true});
        // Backward
        
        await this.moveToPosition({
            x:          this.x,
            y:          this.y - 200,
            angle:      this.angle,
            speed:      0.4||parameters.speed||this.app.goals.defaultSpeed,
            angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
            nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  5||parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        
        await this.setArmsPacked({armList:[targetArm], duration:0, wait:false});
        
        return true;
    }
    
    async goGrabPlants(parameters){
        let result = true;
        
        this.app.logger.log(this.app.intelligence.currentTime, "goGrabPlants params", parameters);
        await this.setArmsPacked({});
        await this.setDoorsPacked({duration: 500, wait:false});
        
        // Find arm
        let armList = ["AC", "AB", "BC"]
        if("armList" in parameters) armList = parameters.armList;
        if(armList.length == 0) return false;
        
        let doorAllowList = ["AB"/*, "BC"*/]; // Prevent to occupy all doors for better loc
        let isInPlanter = parameters.planter;
        
        
        let targetArm = "";
        let targetAngleOffset = 0;
        let grabWithDoors = false;
        if(parameters.grabWithDoors && !isInPlanter) { // forced grab with doors
            if (armList.includes("AC") && doorAllowList.includes("AC") && this.variables.doorsAC.value == "")  { targetArm = "AC"; targetAngleOffset = 0; grabWithDoors=true; }
            else if (armList.includes("BC") && doorAllowList.includes("BC") && this.variables.doorsBC.value == "")  { targetArm = "BC"; targetAngleOffset = -120; grabWithDoors=true; }
            else if (armList.includes("AB") && doorAllowList.includes("AB") && this.variables.doorsAB.value == "")  { targetArm = "AB"; targetAngleOffset = 120; grabWithDoors=true; }
        }
        else {
            if (armList.includes("AC") && this.variables.armAC.value == "")       { targetArm = "AC"; targetAngleOffset = 0; }
            else if (armList.includes("BC") && this.variables.armBC.value == "")  { targetArm = "BC"; targetAngleOffset = -120; }
            else if (armList.includes("AB") && this.variables.armAB.value == "")  { targetArm = "AB"; targetAngleOffset = 120; }
            else if(!this.app.goals.preventDoorsGrab && !isInPlanter) {
                if(armList.includes("AC") && doorAllowList.includes("AC") && this.variables.doorsAC.value == "")  { targetArm = "AC"; targetAngleOffset = 0; grabWithDoors=true; }
                else if (armList.includes("BC") && doorAllowList.includes("BC") && this.variables.doorsBC.value == "")  { targetArm = "BC"; targetAngleOffset = -120; grabWithDoors=true; }
                else if (armList.includes("AB") && doorAllowList.includes("AB") && this.variables.doorsAB.value == "")  { targetArm = "AB"; targetAngleOffset = 120; grabWithDoors=true; }
            }
        }
        this.app.logger.log("goGrabPlants debug", armList, targetArm, isInPlanter);
        if(targetArm == "") return false;
        
        this.app.logger.log("goGrabPlants with", targetArm);
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let opposit = "blue";
        if (this.team=="blue") opposit = "yellow";
        if(parameters.opposit) teamColor=opposit;
        let plateList = []
        this.app.logger.log("team color", teamColor);
        if(parameters.zoneName) {
            plateList.push(this.app.map.getComponentByName(parameters.zoneName));
        }
        else {
            let plateTypes = ["plant"];
            if(parameters.plateTypes) {
                plateTypes = parameters.plateTypes;
                for(let type of plateTypes) {
                    plateList.push(...this.app.map.getComponentList(type, teamColor));
                }
            }
            else {
                for(let type of plateTypes) {
                    plateList.push(...this.app.map.getComponentList(type));
                }
            }
        }
        this.app.logger.log("plantList ", plateList)
        // Indentify closest deposit site
        let accessTag = "" || parameters.accessTag;
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        let targetDist = 0;
        for(let plate of plateList){
            let accessList = []
            let distMalus = 0;
            if(plate.attempts) distMalus = 2800*plate.attempts;
            if(parameters.opposit) {
                // Aim for zone where ennemy went
                let historyX = plate.access.x;
                let historyY = plate.access.y;
                let historyValue = this.app.map.getHistoryAt(historyX, historyY).value
                distMalus -= 20 * historyValue;
                this.app.logger.log("HISTORY of", plate.name, "is", historyValue, "at", historyX, historyY, "stolen", plate.alreadyStolen); 
                if(plate.alreadyStolen) continue;
            }
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                if(accessTag){
                   if(access.tags && access.tags.includes(accessTag)){
                        minLength = utils.getDistance(this.x, this.y, access.x, access.y);//dist
                        targetAccess = access;
                        targetPlate = plate;
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
                        targetPlate = plate;
                    }
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
        
        if(targetPlate.attempts)  targetPlate.attempts += 1;
        else targetPlate.attempts = 1;
        
        this.app.logger.log("goGrabPlants in ", targetPlate.name, (grabWithDoors?"using doors":"using arm"), targetArm );
        let grabOrientation = targetAccess.angle + targetAngleOffset;
        
        // Compute move speed
        let moveSpeed = parameters.speed||this.app.goals.defaultSpeed;
        if(targetDist>0 && targetDist < 600) moveSpeed *= 0.5;
        this.app.logger.log({targetDist},{moveSpeed},{grabOrientation})
        
        
        let resultArray = []
            
        // Planters
        if(isInPlanter) {
            // Move to target
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      grabOrientation,
                speed:      moveSpeed,
                angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
                accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
                nearDist:   200||parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  10||parameters.nearAngle||this.app.goals.defaultNearAngle,
                preventBreak: true
            });
            if(!result) return result;
            
            await this.setArmsPreStealPlanter({armList:[targetArm], duration:500, wait:false});
            
            result = await this.moveAtAngle({
                angle: targetAccess.angle,
                distance: 250,
                speed: 0.3||parameters.speed||this.app.goals.defaultSpeed,
                angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                nearDist:   25,
                nearAngle:  5,
                preventLocalisation: true
            });
            if(!result) return result;
            await this.setArmsLowerStealPlanter({armList:[targetArm], duration:0, wait:false});
            await utils.sleep(500);
            await this.setArmsStealPlanter({armList:[targetArm], duration:0, wait:false});
            await utils.sleep(300);
            await this.setArmsStore({armList:[targetArm], duration:0, wait:false});
            await utils.sleep(200);
            // Check prehension
            if(this.modules.arm){
                let servo1 = await this.modules.arm.getServo({ name: targetArm+"T" });
                let servo2 = await this.modules.arm.getServo({ name: targetArm+"F" });
                let diff1 = Math.abs(servo1.position - this.thumbCloseAngle);
                let diff2 = Math.abs(servo2.position - this.fingerCloseAngle);
                let hasPlant = (diff1 >= 5/* && diff1 < 25*/) || (diff2 >= 5/* && diff2 < 25*/)
                this.app.logger.log("arm", targetArm, "hasPlants", hasPlant, servo1, servo2, diff1, diff2 )
                targetPlate.alreadyStolen = true;
                if(!hasPlant) return false;
            }
            
            // Store
            this.setVariable({name:"arm"+targetArm, value:"PP"});// Guess 5 plant stored
            
        }
        // Plants and zones
        else {
            if(!grabWithDoors) await this.setArmsPreGrab({armList:[targetArm], duration:500, wait:false});
            await this.setDoorsPreGrab({armList:[targetArm], duration:500, wait:false});
            
            // Move to target
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      grabOrientation,
                speed:      moveSpeed,
                angleSpeed: parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                accelDist:  parameters.accelDist||this.app.goals.defaultAccel,
                accelAngle:  parameters.accelAngle||this.app.goals.defaultAccelAngle,
                nearDist:   200||parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  10||parameters.nearAngle||this.app.goals.defaultNearAngle,
                preventBreak: true
            });
            if(!result) return result;
            
            if(targetPlate.type == "plant"){
                // Close front arm and move on plants at same time
                resultArray = await Promise.all([
                    // Grab plants
                    this.grabPlants({armList:[targetArm], startDelay: 500, grabWithDoors}),
                    // Move forward on plants
                    /*this.moveToPosition({
                        x:          targetPlate.shape.x,
                        y:          targetPlate.shape.y,
                        angle:      grabOrientation,
                        speed:      0.13||parameters.speed||this.app.goals.defaultSpeed,
                        nearDist:   50||parameters.nearDist||this.app.goals.defaultNearDist,
                        nearAngle:  5||parameters.nearAngle||this.app.goals.defaultNearAngle,
                        preventBreak: false
                    })*/
                    this.moveAtAngle({
                        angle: targetAccess.angle,
                        distance: 200,
                        speed: 0.25||parameters.speed||this.app.goals.defaultSpeed,
                        angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                        nearDist:   50,
                        nearAngle:  5,
                        preventLocalisation: true,
                        preventBreak: false
                    })
                ]);
            }
            else {
                // Close front arm and move on plants at same time
                resultArray = await Promise.all([
                    // Grab plants
                    this.grabPlants({armList:[targetArm], startDelay: 500, grabWithDoors}),
                    // Move forward on plants
                    this.moveAtAngle({
                        angle: targetAccess.angle,
                        distance: 200,
                        speed: 0.15||parameters.speed||this.app.goals.defaultSpeed,
                        angleSpeed: 50||parameters.angleSpeed||this.app.goals.defaultAngleSpeed,
                        nearDist:   50,
                        nearAngle:  5,
                        preventLocalisation: true,
                        preventBreak: false
                    })
                ]);
            }
        }
        
        this.removeFromMap({component:targetPlate});
        
        for(let res of resultArray){
            if(!res) return res;
        }
        
        if(!result) return false;
        
        return true;
    }
    
    async stealPlants(parameters){
        let result = true;
        if(!this.modules.arm) return false;
        
        let telem = {measures:[]};
        telem = await this.modules.arm.getTelemeter({name:"A"});
        let telem2D = await this.modules.arm.telemeterTo2D(telem, 8, 3);
        this.app.logger.log("telemeter2D ", telem2D)
        await utils.sendTeleplot3D("telemA", telem2D);
        
        if(!telem) return false;
        
        return result
    }
    
    /*async searchForPlant(parameters){
        if(!parameters.name) return false;
        let reversed = false;
        if(parameters.name.startsWith("AA")) reversed = true;
        let rotMin = 120;
        let rotMax = 210;
        let rotation = 150;
        let distance = 0;
        let grab = false;
        // Scan surroundings
        let angles = [];
        let rotFrom = 140;
        let rotTo = 210;
        let rotCount = 4;
        let maxDist = 195;//mm
        let minDist = 10;
        for(let rot = 0; rot <= rotCount; rot++) {
            let scanRot = rotTo - rot*(rotTo-rotFrom)/rotCount;
            // Orient
            await this.setArmGrab({name: parameters.name, distance:distance, rotation:scanRot, grab:grab, reset:rot==0});
            await utils.sleep(100);
            if(rot==0) await utils.sleep(150); // spare time for first orientation
            // Measure
            let telem = {measures:[]};
            let telem2 = {measures:[]};
            if(this.modules.arm) telem = await this.modules.arm.getTelemeter({name: parameters.name[0]});
            if(!telem) return false;
            await utils.sleep(100);
            if(this.modules.arm) telem2 = await this.modules.arm.getTelemeter({name: parameters.name[0]});
            if(!telem2) return false;
            // average two measures
            for(let i=0;i<telem.measures.length;i++) {
                telem.measures[i] = (telem.measures[i] + telem2.measures[i]) / 2;
            }
            // Analyse
            let mean = 0;
            let median = 0;
            let medArray = [];
            let count = 0;
            for(let y=0;y<8;y++){
                if(y<4) continue;//remove floor
                for(let x=0;x<8;x++){
                    let idx = y*8+x;
                    if(idx>=telem.measures.length) break;
                    if(telem.measures[idx]>maxDist) continue;
                    if(telem.measures[idx]<minDist) continue;
                    medArray.push(telem.measures[idx]);
                    mean += telem.measures[idx];
                    count++;
                }
            }
            if(count>0) mean /= count;
            else mean = 2*maxDist;
            if(medArray.length == 0) median = 2*maxDist;
            else {
                medArray.sort((a,b) => a-b);
                const half = medArray.length / 2;
                median = medArray.length % 2 ? medArray[half] : (medArray[half-1] + medArray[half])/2;
            }
            angles.push({rotation:scanRot, mean:median})
            if(median <= maxDist*0.9) break; // if close enough, stop scan
        }
        // Select start rotation
        let minAngle = rotation;
        let minMean = 999999999999;
        for(let i=0;i<angles.length;i++) {
            if(angles[i].mean>maxDist) continue;
            if(angles[i].mean<minDist) continue;
            if(angles[i].mean < minMean){
                minAngle = angles[i].rotation;
                minMean = angles[i].mean;
            }
        }
        if(minMean > maxDist) return false;
        if(minMean < minDist) return false;
        console.log("Starting at ", minAngle, "from", angles)
        rotation = minAngle;
        // Converge on plant
        let moveCount = 12;
        for(let move = 0; move < moveCount; move++) {
            if(rotation>rotMax) rotation = rotMax;
            if(rotation<rotMin) rotation = rotMin;
            // Position arm
            await this.setArmGrab({name: parameters.name, distance:distance, rotation:rotation, grab:grab});
            if(grab) break;
            // Wait for measure
            await utils.sleep(100);
            if(move==0) await utils.sleep(100); // spare time for first orientation
            // Get telemeter
            let telem = {measures:[]};
            if(this.modules.arm) telem = await this.modules.arm.getTelemeter({name: parameters.name[0]});
            if(!telem) return false;
            // Analyse measures
            // Split table in 3 column and compute mean dist
            let cols = [{mean:0, count:0, min:9999},{mean:0, count:0, min:9999},{mean:0, count:0, min:9999}]
            for(let y=0;y<8;y++){
                if(y<4) continue;//remove floor
                for(let x=0;x<8;x++){
                    let idx = y*8+x;
                    if(idx>=telem.measures.length) break;
                    let colidx = 0
                    if(x>2) colidx = 1
                    if(x>=5) colidx = 2
                    cols[colidx].mean += telem.measures[idx];
                    cols[colidx].count++;
                    if(cols[colidx].min>telem.measures[idx]){
                        cols[colidx].min = telem.measures[idx]
                    }
                }
            }
            // Find closest col
            let mincol = 0;
            let minval = 9999999999;
            for(let i=0;i<cols.length;i++) {
                if(cols[i].count>0) cols[i].mean /= cols[i].count;
                if(cols[i].min<minval) {
                    minval = cols[i].min;
                    mincol = i;
                }
            }
            console.log("cols:", cols)
            
            if(minval > maxDist) return false;
            let distAtMax = distance>=14
            let rotAmplitude = 8;
            if(distance>=5) rotAmplitude = 6;
            if(distance>=10) rotAmplitude = 4;
            if(reversed) rotAmplitude *= -1;
            // Orient based on mincol
            if(mincol == 0) rotation += rotAmplitude;
            else if(mincol == 2) rotation -= rotAmplitude;
            // Reduce distance
            if(mincol == 1 || minval < 80) {
                if(minval > 50) { distance += 3 }
                else if(minval > 40) { distance += 2 }
                else { grab = true }
            }
            if(distAtMax || move >= moveCount-1) grab = true;
            this.app.logger.log(`${move} Plant mincol ${mincol}=${minval} rot ${rotation} dist ${distance} grab ${grab}`)
        }
        // Final arm closed
        grab = true;
        await this.setArmGrab({name: parameters.name, distance:distance, rotation:rotation, grab:grab});
        // Check plant in clamp
           
        return true;
    }*/
    
    async grabPlants(parameters){
        let armList = []
        if("armList" in parameters) armList = parameters.armList;
        let targetArm = "";
        if("targetArm" in parameters) targetArm = parameters.targetArm;
        else if(armList.length > 0) targetArm = armList[0];
        if(targetArm == "") return false;
        let grabWithDoors = false || parameters.grabWithDoors;
        
        // Start delay
        if("startDelay" in parameters) await utils.sleep(parameters.startDelay);
        
        // Group
        if(!grabWithDoors) await this.setArmsGroup(Object.assign({armList:[targetArm], duration:1500}, parameters));
        //await this.setDoorsGroup(Object.assign({armList:[targetArm], duration:1250}, parameters));
        //await utils.sleep(1250);
        await this.setDoorsGroup(Object.assign({armList:[targetArm], duration:500}, parameters));
        await utils.sleep(500);
        
        // Grab
        if(grabWithDoors) {
            await this.setDoorsGrab(Object.assign({armList:[targetArm], duration:0}, parameters));
            await utils.sleep(200);
        }
        else {
            await this.setArmsGrab(Object.assign({armList:[targetArm], duration:300},parameters));
            await utils.sleep(150);
            await this.setDoorsPreGrab(Object.assign({armList:[targetArm], duration:0}, parameters));
            await utils.sleep(150);
        }
        
        // Lift
        if(!grabWithDoors){
            await this.setArmsStore(Object.assign({armList:[targetArm], duration:0},parameters));
            await utils.sleep(150);
        }
        
        if(!grabWithDoors) {
            // Check prehension
            if(this.modules.arm){
                let servo1 = await this.modules.arm.getServo({ name: targetArm+"T" });
                let servo2 = await this.modules.arm.getServo({ name: targetArm+"F" });
                let diff1 = Math.abs(servo1.position - this.thumbCloseAngle);
                let diff2 = Math.abs(servo2.position - this.fingerCloseAngle);
                let hasPlant = (diff1 >= 5/* && diff1 < 25*/) || (diff2 >= 5/* && diff2 < 25*/)
                this.app.logger.log("arm", targetArm, "hasPlants", hasPlant, servo1, servo2, diff1, diff2 )
                if(!hasPlant) return false;
            }
            
            // Store
            this.setVariable({name:"arm"+targetArm, value:"PPPPP"});// Guess 5 plant stored
        }
        else {
            // Check prehension
            if(this.modules.arm){
                let servo1 = await this.modules.arm.getServo({ name: targetArm+targetArm[0] });
                let servo2 = await this.modules.arm.getServo({ name: targetArm+targetArm[1] });
                let diff1 = Math.abs(servo1.position - this.doorsCloseAngle);
                let diff2 = Math.abs(servo2.position - this.doorsCloseAngle);
                let hasPlant = (diff1 >= 5) || (diff2 >= 5)
                this.app.logger.log("door", targetArm, "hasPlants", hasPlant, targetArm+targetArm[0], servo1, targetArm+targetArm[1], servo2, diff1, diff2 )
                if(!hasPlant) return false;
            }
            
            // Store
            this.setVariable({name:"doors"+targetArm, value:"PPPP"});// Guess 1 plant stored
        }
        return true;
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
        await this.setArmsPacked({});
        await this.setDoorsPacked({});
        
        //Remove every plant on the map
        let plantList = this.app.map.getComponentList(["plant"]);
        for(let plant of plantList){
            this.app.logger.log("remove before end zone", plant.name);
            this.removeFromMap({component: plant});
        }
        
        //await this.armFreePlants({});
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let zoneList = []
        let zonesTypes = ["baseReserved", "baseMiddle", "baseBottom"];
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
        
        await this.setDoorsPreGrab({armList:["AC"], duration: 1000, wait:false});
        
        
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
        
        // Open arms to extend as much as possible
        /*if(this.modules.arm){
            await this.modules.arm.setServo({ name: "ACA", angle: 170, duration: 250, wait:false});
            await this.modules.arm.setServo({ name: "ACC", angle: 170, duration: 250, wait:false});
            await this.modules.arm.setServo({ name: "ABA", angle: 170, duration: 250, wait:false});
            await this.modules.arm.setServo({ name: "ABB", angle: 170, duration: 250, wait:false});
            await this.modules.arm.setServo({ name: "BCB", angle: 170, duration: 250, wait:false});
            await this.modules.arm.setServo({ name: "BCC", angle: 170, duration: 250, wait:false});
        }*/
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 200,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle,
            preventLocalisation: true
        });
        this.collisionDistance = collisionDistanceBackup;
        if(!result) return result;
        this.setVariable({name:"endReached", value:true});
        
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: -200,
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
                    this.addScore(15);
                    break;
                }
            }
            await utils.sleep(200);
        }*/
        this.app.logger.log("Adding end zone point");
        this.addScore(10);
        
        if(this.variables.armAC.value != "") {
        
            await this.setArmsPreZone({armList:["AC"], duration: 0, wait:false});
            await utils.sleep(600);
            
            
            await this.setArmsZone({armList:["AC"], wait:false});
            await utils.sleep(1000);
        }
        
        await this.setArmsPacked({armList:["AB", "BC"], duration: 1000, wait:false});
        await this.setArmsEnd({armList:["AC"], duration: 1000, wait:false});
        await this.setDoorsFlat({duration: 1000, wait:false})
        
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

