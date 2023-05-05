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
            armAC: { value: "", label: "AC" },  
            armAB: { value: "", label: "AB" },  
            armBC: { value: "", label: "BC" },
            cherryAC: { value: 2, label: "AC" },  
            cherryAB: { value: 2, label: "AB" },  
            cherryBC: { value: 2, label: "BC" },
            //galleryRed: { value: 0, max: 4 },
            //galleryGreen: { value: 0, max: 4 },
            //galleryBlue: { value: 0, max: 4 },
            endReached: { value: 0, max: 1 },
            //bottomDispenser: { value: 3, max: 3 },
            //middleDispenser: { value: 3, max: 3 },
            //foundInSite: { value: 0, max: 3 },
            //foundInOppositSite: { value: 0, max: 3 },
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
        
        this.armCloseAngle = 131;
        this.armGrabtHeight = 29;
        this.cherryLayer = 2.6;
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
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ACG", a1:40, a2:150, a3:150, a4:150 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ABG", a1:40, a2:150, a3:150, a4:150 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "BCG", a1:40, a2:150, a3:150, a4:150 });
        await utils.sleep(1500);
        this.setArmsPacked({});
        
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
        
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ABB", angle: 170});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ABA", angle: 170});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ACA", angle: 170});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ACC", angle: 170});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCB", angle: 170});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCC", angle: 170});
        
        while (!this.app.intelligence.stopExecution)
        {
            for(let i=0;i<255;i+=2) {
                if(this.modules.arm) await this.modules.arm.setLed({ brightness: 255, color: i});
                await utils.sleep(10);
                if(this.app.intelligence.stopExecution) break;
            }
        }
        
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
                findLocalisation: {},
                testDepositCake:{},
                testOrientation:{ speed:{ type:"range", min:0, max:3.0, value:0.4, step:0.1 }},
                testDistance:{
                    distance:{ legend:"distance (mm)", type:"number", min:-1000, max:1000, value:150 },
                    speed:{ type:"range", min:0, max:3.0, value:0.4, step:0.1 }
                },
                setArmGrabOpen:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmGrabClose:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmTransport:{
                    name:{ legend:"name", type:"text" },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmToLayer:{
                    name:{ legend:"name", type:"text" },
                    layer:{ type:"range", min:0, max:6, value:0, step:0.1 },
                    open:{ type:"range", min:0, max:1, value:1, step:1 },
                    transport:{ type:"range", min:0, max:1, value:0, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                distributeCherry:{
                    name:{ legend:"name", type:"text" },
                    index:{ type:"range", min:1, max:2, value:1, step:1 },
                    duration:{ type:"range", min:0, max:1000, value:0, step:1 }
                },
                setArmsPacked:{ },
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
    
    
    
    async setArmsPacked(parameters){
        // Set arms half closed
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ACG", a1:40, a2:150, a3:150, a4:40 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ABG", a1:40, a2:150, a3:150, a4:40 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "BCG", a1:40, a2:150, a3:150, a4:40 });
        await utils.sleep(300);
        // Set arms fully closed
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ACG", a1:40, a2:150, a3:60, a4:40 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "ABG", a1:40, a2:150, a3:60, a4:40 });
        if(this.modules.arm) await this.modules.arm.setPose({ name: "BCG", a1:40, a2:150, a3:60, a4:40 });
        return true;
    }
    
    async setArmGrabOpen(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ name: "ACG", a1:29, a2:150, a3:170, a4:170 }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmGrabClose(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ name: "ACG", a1:29, a2:150, a3:this.armCloseAngle, a4:this.armCloseAngle }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmTransport(parameters){
        if(!parameters.name) return false;
        let pose = Object.assign({ name: "ACG", a1:this.armGrabtHeight+6, a2:150, a3:this.armCloseAngle, a4:this.armCloseAngle }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async setArmToLayer(parameters){
        if(!parameters.name) return false;
        //height
        let targetLayer = parameters.layer || 0;
        let layerHeight = 80;
        let targetHeight = this.armGrabtHeight + layerHeight * targetLayer;
        // transport
        if(parameters.transport) targetHeight += 6;
        //open
        let targetArmAngle = this.armCloseAngle;
        if(parameters.open) targetArmAngle += 20;
        console.log(parameters)
        let pose = Object.assign({ name: "ACG", a1:targetHeight, a2:150, a3:targetArmAngle, a4:targetArmAngle }, parameters);
        if(this.modules.arm) await this.modules.arm.setPose(pose);
        return true;
    }
    
    async distributeCherry(parameters){
        if(!parameters.name) return false;
        let targetAngle = 160;
        if(parameters.index==2) targetAngle = 180;
        let pose = Object.assign({ name: "ACD", angle: targetAngle}, parameters);
        if(this.modules.arm) await this.modules.arm.setServo(pose);
        return true;
    }
    
    async testOrientation(parameters){
        this.setArmsPacked({});
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        
        let speed = parameters.speed||this.app.goals.defaultSpeed;
        for(let i=0;i<5;i++){
            if(this.modules.arm) await this.modules.arm.setLed({ brightness: 50, color: 25*i});
            let result = await this.rotateToAngle({ angle: 90, speed });
            result = await this.rotateToAngle({ angle: 180, speed });
            result = await this.rotateToAngle({ angle: -90, speed });
            result = await this.rotateToAngle({ angle: 0, speed });
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
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        
        // Move Forward
        let result = await this.moveAtAngle({
            angle: 0,
            distance:   parameters.distance,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        
        return true;
    }
    
    async addCakePoints(parameters){
        if(!parameters.cake) return false;
        let cake = parameters.cake;
        let points = Math.min(cake.length, 3);
        if(cake.startsWith("BYP")) points += 4;
        if(cake.endsWith("C")) points += 3;
        this.app.logger.log("Adding "+points+"pt for "+cake+" cake");
        this.addScore(points);
        return true;
    }
    
    async testDepositCake(parameters){
        this.setVariable({name:"armAC", value:"BB"});
        this.setVariable({name:"armAB", value:"YY"});
        this.setVariable({name:"armBC", value:"PP"});
        this.setVariable({name:"cherryAC", value:2});
        this.setVariable({name:"cherryAB", value:2});
        this.setVariable({name:"cherryBC", value:2});
        this._updatePosition(1500, 1000, 0, true);
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        //return true;
        return await this.depositCake({doNotMoveToSite:true});
    }

    async depositCake(parameters){
        let result = true;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let platesTypes = ["plateProtected", "plateMiddleTop", "plateMiddleBottom", "plateBottomSide", "plateBottom"];
        if(parameters.plateTypes) platesTypes = parameters.plateTypes;
        for(let type of platesTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        // Indetify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            if(plate.cakes) continue; // For now, don't deposit in plates with existing cakes
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength){
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
        
        // Move arms to minimum deposit height
        let armList = ["AC", "AB", "BC"];
        let armDepositLayer = {};
        let armClearanceLayerOffset = 0.25;
        for(let currentArm of armList){
            let value = this.variables["arm"+currentArm].value;
            if(value.startsWith("B")) armDepositLayer[currentArm] = 0;
            if(value.startsWith("Y")) armDepositLayer[currentArm] = 1;
            if(value.startsWith("P")) armDepositLayer[currentArm] = 2;
            await this.setArmToLayer({name:currentArm+"G", layer:armDepositLayer[currentArm]+armClearanceLayerOffset, open:false, transport: false});
        }
        
        // Move to plate
        if(!parameters.doNotMoveToSite){
            this.app.logger.log("  -> Moving to plate "+targetPlate.name);
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      targetAccess.angle,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;
        }
        
        // Start deposit sequence, turn on itself and deposit cake layers when required
        let startAngle = this.angle;
        let targetAngle = startAngle;
        let cakeOrder = ["B", "Y", "P", "C"] // brown, yellow, pink, cherry
        let cakes = ["","",""];
        let getMaxLayer = (cakes) => {
            let max = 0;
            for(let c of cakes){
                max = Math.max(c.length, max);
            }
            return max;
        }
        let cakeBuildDistance = 100;
        // For each full rotation
        for(let cycle=0;cycle<4;cycle++){
            console.log("Starting new cycle", cycle)
            // For each 120° rotation
            for(let index=0;index<3;index++){
                console.log("Starting new index in rotation", index)
                // Check end of construction
                if(cycle!=0)
                {
                    let finished = true;
                    for(let c of cakes){
                        if(c!="") finished = false;
                    }
                    if(finished) break;
                }
                // Rotate 120° (unsledd it's the first iteration)
                if(cycle!=0 || index!=0){
                    targetAngle -= 120;
                    console.log("Rotation to", targetAngle)
                    result = await this.rotateToAngle({
                        angle:targetAngle,
                        speed:      parameters.speed||this.app.goals.defaultSpeed,
                        nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                        nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                    });
                }
                // For each arm
                for(let armIdx=0;armIdx<3;armIdx++){
                    if(this.modules.arm) await this.modules.arm.setLed({ brightness: 100, color: 100*armIdx});
                    // Resolve target color on the associated cake
                    let currArm = armList[armIdx];
                    let cakeIdx = (armIdx + index)%3;
                    let targetColor = cakeOrder[cakes[cakeIdx].length];
                    let forwardAngle = this.angle - armIdx * 120;
                    let armMovedUp = false;
                    // If arm has target color, and is not holding an already-built cake
                    if( this.variables["arm"+currArm].value.startsWith(targetColor) && ! this.variables["arm"+currArm].value.startsWith("BYP")){
                        // Make sure arm it at target height
                        await this.setArmToLayer({name:currArm+"G", layer:armDepositLayer[currArm]+armClearanceLayerOffset, open:false, transport: false});
                        // TODO wait for arm height (with timeout)
                        
                        //Move Forward
                        result = await this.moveAtAngle({
                            angle: forwardAngle,
                            distance: cakeBuildDistance,
                            speed:      parameters.speed||this.app.goals.defaultSpeed,
                            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                        });
                        if(!result) return result;
                        
                        // Deposit cake layer
                        await this.setArmToLayer({name:currArm+"G", layer:armDepositLayer[currArm], open:false, transport: true});
                        await utils.sleep(200);
                        // Open and lift to next layer
                        await this.setArmToLayer({name:currArm+"G", layer:armDepositLayer[currArm]+1, open:true, transport: false});
                        await utils.sleep(750);
                        // Grab next layer and move to clearance
                        await this.setArmToLayer({name:currArm+"G", layer:armDepositLayer[currArm]+1+armClearanceLayerOffset, open:false, transport: false});
                        
                        //let targetLayer = cakes[cakeIdx].length;
                        //await this.setArmToLayer({name:currArm+"G", layer:targetLayer, open:false, transport: true});
                        //await utils.sleep(targetLayer==0?0:500);
                        // Open arms
                        //await this.setArmToLayer({name:currArm+"G", layer:targetLayer+1, open:true});
                        //await utils.sleep(400);
                        
                        // Update cake and arm content
                        cakes[cakeIdx] += targetColor;
                        this.variables["arm"+currArm].value =  this.variables["arm"+currArm].value.substring(1);
                        //// Move to next layer
                        //await this.setArmToLayer({name:currArm+"G", layer:getMaxLayer(cakes)+0.5, open:false, transport: true});
                        //armMovedUp = true;
                        
                        // Move backward
                        result = await this.moveAtAngle({
                            angle: forwardAngle,
                            distance: -cakeBuildDistance,
                            speed:      parameters.speed||this.app.goals.defaultSpeed,
                            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                        });
                    }
                        
                    // Grab completed cake
                    if( this.variables["arm"+currArm].value == "" 
                     && (   cakes[cakeIdx].length==3 
                            || (cakes[cakeIdx].length==2 && !this.variables["armAC"].value.startsWith("P") && !this.variables["armAB"].value.startsWith("P") && !this.variables["armBC"].value.startsWith("P") )
                            || (cakes[cakeIdx].length==1 && !this.variables["armAC"].value.startsWith("Y") && !this.variables["armAB"].value.startsWith("Y") && !this.variables["armBC"].value.startsWith("Y") )
                        )
                    )
                    {
                        // Grab finished cake
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:true, transport: false});
                        // TODO make sure we reached arm height
                        await utils.sleep(1500);
                        
                        // Move Forward
                        result = await this.moveAtAngle({
                            angle: forwardAngle,
                            distance: cakeBuildDistance+50,
                            speed:      parameters.speed||this.app.goals.defaultSpeed,
                            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                        });
                        if(!result) return result;
                        
                        // Pack the cake
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:false, transport: false, duration:250});
                        await utils.sleep(250);
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:true, transport: false});
                        
                        // Move Forward
                        let extendedForwardDistance = 50;
                        result = await this.moveAtAngle({
                            angle: forwardAngle,
                            distance: extendedForwardDistance,
                            speed:      parameters.speed||this.app.goals.defaultSpeed,
                            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                        });
                        if(!result) return result;
                        
                        // Double close the arm to grab cake
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:false, transport: false, duration:200});
                        await utils.sleep(200);
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:true, transport: false});
                        await utils.sleep(100);
                        await this.setArmToLayer({name:currArm+"G", layer:0, open:false, transport: true});
                        await utils.sleep(100);
                        
                        // Move cake to cherry (if has cherry)
                        if(this.variables["cherry"+currArm].value>0){
                            await this.setArmToLayer({name:currArm+"G", layer:this.cherryLayer+(3-cakes[cakeIdx].length), open:false, transport: false});
                        }
                        this.variables["arm"+currArm].value = cakes[cakeIdx];
                        cakes[cakeIdx] = "";
                        console.log("--> ",  this.variables["arm"+currArm].value, cakes[cakeIdx], this.variables["arm"+currArm].value)
                        // Move backward
                        result = await this.moveAtAngle({
                            angle: forwardAngle,
                            distance: -(cakeBuildDistance+50+extendedForwardDistance),
                            speed:      parameters.speed||this.app.goals.defaultSpeed,
                            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
                        });
                        if(!result) return result;
                    }
                    
                    //Move arm up before rotation
                    /*if(!armMovedUp){
                        await this.setArmToLayer({name:currArm+"G", layer:getMaxLayer(cakes)+0.5, open:false, transport: true});
                        if(armIdx == 2) await utils.sleep(500); // last arm to move so rotation needs to be delayed a bit
                    }*/
                    
                    console.log("Finished with arm", armIdx, this.variables, cakes);
                }
            }
        }
        
        // Do not deposit during tests for now
        if(parameters.doNotMoveToSite){
            return result;
        }
        
        
        // Release cherries
        for(let currArm of armList){
            let armVar = this.variables["arm"+currArm];
            let cherryVar = this.variables["cherry"+currArm];
            await this.setArmToLayer({name:currArm+"G", layer:0, open:false, transport: true});
            if(armVar.value != "" && cherryVar.value>0){
                // Lower arm while releasing cherry
                await this.distributeCherry({name:currArm+"D", index:1});
                this.variables["arm"+currArm].value += "C";
                this.variables["cherry"+currArm].value -= 1;
            }
        }
        this.app.logger.log("Cherry on Cake");
        
        // Move back to plate at opposite angle
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle+180,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        // Release 2 back cackes
        // Move backward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 300,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        // Open Arms in specific way
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ABB", angle: 200});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "ABA", angle: 200});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCB", angle: 200});
        if(this.modules.arm) await this.modules.arm.setServo({ name: "BCC", angle: 200});
        this.addCakePoints({cake:this.variables["armAB"].value});
        this.addCakePoints({cake:this.variables["armBC"].value});
        this.variables["armAB"].value = "";
        this.variables["armBC"].value = "";
        targetPlate.cakes = true;
        // Wiggle left
        result = await this.moveAtAngle({
            angle: targetAccess.angle+90,
            distance: 50,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        // Wiggle right
        result = await this.moveAtAngle({
            angle: targetAccess.angle-90,
            distance: 100,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        // Move back to plate at opposite angle
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle+180,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        // Release front cake
        // Rotate to face plate
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        await this.setArmGrabOpen({name: "ACG"});
        this.addCakePoints({cake:this.variables["armAC"].value});
        this.variables["armAC"].value = "";
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 100,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        // Return to access position to clear the cake
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        
        //Close arms
        this.setArmsPacked({});
        
        return result;
    }
    
    async depositCakeSimple(parameters){
        let result = true;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let platesTypes = ["plateProtected", "plateMiddleTop", "plateMiddleBottom", "plateBottomSide", "plateBottom"];
        if(parameters.plateTypes) platesTypes = parameters.plateTypes;
        for(let type of platesTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        // Indetify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            if(plate.cakes) continue; // For now, don't deposit in plates with existing cakes
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength){
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
        
        // Lift arms to cheries
        await this.setArmToLayer({name:"ACG", layer:2.6, open:false, transport: false});
        await this.setArmToLayer({name:"ABG", layer:2.6, open:false, transport: false});
        await this.setArmToLayer({name:"BCG", layer:2.6, open:false, transport: false});
        
        let hasRearCakes = this.variables["armAB"].value!="" || this.variables["armBC"].value!="";
        let targetAngle = targetAccess.angle;
        if(hasRearCakes) targetAngle = targetAccess.angle - 180;
        // Move to plate
        this.app.logger.log("  -> Moving to grab "+targetPlate.name);
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAngle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        await utils.sleep(1500); // Make sure arms are lifted high enough
        
        // Release cherries
        let armList = ["AC", "AB", "BC"];
        for(let currArm of armList){
            let armVar = this.variables["arm"+currArm];
            let cherryVar = this.variables["cherry"+currArm];
            //await this.setArmToLayer({name:currArm+"G", layer:0, open:false, transport: true});
            if(armVar.value != "" && cherryVar.value>0){
                // Lower arm while releasing cherry
                await this.distributeCherry({name:currArm+"D", index:1});
                this.variables["arm"+currArm].value += "C";
                this.variables["cherry"+currArm].value -= 1;
            }
        }
        this.app.logger.log("Cherry on Cake");
        
        if(hasRearCakes){
            // Move back to plate at opposite angle
            /*result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      targetAccess.angle+180,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;*/
            
            // Release 2 back cackes
            // Move backward
            result = await this.moveAtAngle({
                angle: targetAccess.angle,
                distance: 300,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Lower arms
            await this.setArmToLayer({name:"ABG", layer:0, open:false, transport: true});
            await this.setArmToLayer({name:"BCG", layer:0, open:false, transport: true});
            await utils.sleep(2200); // Make sure arms are lifted high enough
            // Open Arms in specific way
            if(this.modules.arm) await this.modules.arm.setServo({ name: "ABB", angle: 200});
            if(this.modules.arm) await this.modules.arm.setServo({ name: "ABA", angle: 200});
            if(this.modules.arm) await this.modules.arm.setServo({ name: "BCB", angle: 200});
            if(this.modules.arm) await this.modules.arm.setServo({ name: "BCC", angle: 200});
            this.addCakePoints({cake:this.variables["armAB"].value});
            this.addCakePoints({cake:this.variables["armBC"].value});
            this.variables["armAB"].value = "";
            this.variables["armBC"].value = "";
            targetPlate.cakes = true;
            // Wiggle left
            result = await this.moveAtAngle({
                angle: targetAccess.angle+90,
                distance: 25,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Wiggle right
            result = await this.moveAtAngle({
                angle: targetAccess.angle-90,
                distance: 50,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Move back to plate at opposite angle
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      targetAccess.angle+180,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
            if(!result) return result;
            // Release front cake
            // Rotate to face plate
            result = await this.moveToPosition({
                x:          targetAccess.x,
                y:          targetAccess.y,
                angle:      targetAccess.angle,
                speed:      parameters.speed||this.app.goals.defaultSpeed,
                nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
                nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
            });
        }
        this.addCakePoints({cake:this.variables["armAC"].value});
        this.variables["armAC"].value = "";
        
        // Lower arm
        await this.setArmToLayer({name:"ACG", layer:0, open:false, transport: true});
        await utils.sleep(2200); // Make sure arms are lifted high enough
        
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 250,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        await this.setArmGrabOpen({name: "ACG", duration: 500});
        // Return to access position to clear the cake
        result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      targetAccess.angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        
        //Close arms
        this.setArmsPacked({});
        
        return result;
    }
    
    async delay(parameters){
        await utils.sleep(parameters.duration);
        return true;
    }
    
    async removeFromMap(parameters){
        if(parameters.list) parameters.list.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
        return true;
    }
    
    async grabCake(parameters){
        
        // Resolve color to be picked
        let targetCackeTypes = parameters.component;
        if(!targetCackeTypes) {
            let removeFromList = (list, elem) => {
                let idx = list.indexOf(elem)
                if(idx>=0) list.slice(idx, 1);
            };
            targetCackeTypes = [];
            let armList = [this.variables.armAC.value, this.variables.armAB.value, this.variables.armBC.value];
            if(!armList.includes("PPP")) targetCackeTypes.push("cakePink");
            if(!armList.includes("YYY")) targetCackeTypes.push("cakeYellow");
            if(!armList.includes("BBB")) targetCackeTypes.push("cakeBrown");
        }
        if(targetCackeTypes.length == 0) return false;
        console.log(targetCackeTypes);
        
        
        // Resolve arm to be used
        let targetArm = "";
        let targetAngleOffset = 0;
        if (this.variables.armAC.value == "")       { targetArm = "AC"; targetAngleOffset = 0; }
        else if (this.variables.armBC.value == "")  { targetArm = "BC"; targetAngleOffset = -120; }
        else if (this.variables.armAB.value == "")  { targetArm = "AB"; targetAngleOffset = 120; }
        if(targetArm == "") return false;
        
        // Resolve target accessPoint
        let teamColor = parameters.color||this.team;
        let componentList = []
        for(let type of targetCackeTypes) {
            componentList.push(...this.app.map.getComponentList(type));
        }
        //console.log(componentList);
        let component = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let comp of componentList){
            let accessList = []
            if(comp.access) accessList.push(comp.access);
            if(comp.otherAccess) accessList.push(...comp.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength){
                    minLength = pathLength;
                    targetAccess = access;
                    component = comp;
                }
            }
        }
        //console.log(component, minLength);
        if(component === null){
            this.app.logger.log("  -> Component not found "+parameters.component);
            return false
        }
        if(targetAccess === null){
            this.app.logger.log("  -> No access found for component "+parameters.component);
            return false
        }
        
        // Open arm
        this.setArmGrabOpen({name: targetArm+"G", duration: 500});
        
        // Move
        this.app.logger.log("  -> Moving to grab "+component.name);
        let angle = targetAccess.angle + targetAngleOffset;
        let result = await this.moveToPosition({
            x:          targetAccess.x,
            y:          targetAccess.y,
            angle:      angle,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 300,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        // Close arm
        this.setArmGrabClose({name: targetArm+"G"});
        await utils.sleep(300);
        this.setArmGrabOpen({name: targetArm+"G"});
        await utils.sleep(100);
        this.setArmGrabClose({name: targetArm+"G"});
        await utils.sleep(100);
        this.setArmTransport({name: targetArm+"G"});
        //await utils.sleep(200);
        
        // Update map and variable
        let varValue = "XXX";
        if(component.type=="cakeYellow"){ varValue = "YYY"; }
        if(component.type=="cakePink")  { varValue = "PPP"; }
        if(component.type=="cakeBrown") { varValue = "BBB"; }
        this.setVariable({name:"arm"+targetArm, value:varValue, side:0});
        this.app.map.removeComponent(component);
        
        // Move Backward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: -350,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;

        return true;
    }
    
    async returnToEndZone(parameters){
        let result = true;
        
        // List deposit sites
        let teamColor = parameters.color||this.team;
        let plateList = []
        let platesTypes = ["plateProtected", "plateMiddleTop", "plateMiddleBottom", "plateBottomSide", "plateBottom"];
        if(parameters.plateTypes) platesTypes = parameters.plateTypes;
        for(let type of platesTypes) {
            plateList.push(...this.app.map.getComponentList(type, teamColor));
        }
        // Indetify closest deposit site
        let targetPlate = null;
        let targetAccess = null
        let minLength = 99999999999;
        for(let plate of plateList){
            if(plate.cakes) continue;
            let accessList = []
            if(plate.access) accessList.push(plate.access);
            if(plate.otherAccess) accessList.push(...plate.otherAccess);
            if(accessList.length == 0) continue;
            for(let access of accessList){
                let path = this.app.map.findPath(this.x, this.y, access.x, access.y);
                if(path.length<2) continue;
                if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
                let pathLength = this.app.map.getPathLength(path);
                if(pathLength<minLength){
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
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
        
        // Move forward
        result = await this.moveAtAngle({
            angle: targetAccess.angle,
            distance: 200,
            speed:      parameters.speed||this.app.goals.defaultSpeed,
            nearDist:   parameters.nearDist||this.app.goals.defaultNearDist,
            nearAngle:  parameters.nearAngle||this.app.goals.defaultNearAngle
        });
        if(!result) return result;
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

