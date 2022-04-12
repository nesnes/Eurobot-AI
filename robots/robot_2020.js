'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');

//delete require.cache[require.resolve('./modules/lidarx2')]; //Delete require() cache
//const Lidar = require('./modules/lidarx2');

//delete require.cache[require.resolve('./modules/lidarLD06')]; //Delete require() cache
//const Lidar = require('./modules/lidarLD06');


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
        this.radius = 140;
        this.startPosition = {
            //blue:{x:265,y:650,angle:0},
            //yellow:{x:2735,y:650,angle:180}
            blue:{x:101,y:642,angle:60},
            yellow:{x:2899,y:642,angle:120}
        }
        this.variables = {
            buoyACA: { value: 0,  max: 1 },
            buoyACC: { value: 0,  max: 1 },
            buoyABA: { value: 0,  max: 1 },
            buoyABB: { value: 0,  max: 1 },
            buoyBCB: { value: 0,  max: 1 },
            buoyBCC: { value: 0,  max: 1 },
            buoyStorageFrontGreen: { value: 0,  max: 1 },
            buoyStorageFrontRed: { value: 0,  max: 1 },
            buoyStorageSideGreen: { value: 0,  max: 2 },
            buoyStorageSideRed: { value: 0,  max: 2 },
            windsocks: { value: 0,  max: 2 },
            endZone: { value: 0,  max: 2 }, //0 undefined, 1 north, 2 south
        }
        this.collisionAngle = 115;
        this.collisionDistance = this.radius+250;
        this.slowdownDistance = this.collisionDistance+100;

        if(!this.app.parameters.simulate){
            //this.modules.lidar = new Lidar(app)
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
        if(this.modules.arm) await this.modules.arm.disablePump({name:"LEF"});
        if(this.modules.arm) await this.modules.arm.disablePump({name:"RIG"});
        if(this.modules.arm) await this.setArmDefault({});
        if(this.modules.arm) await this.modules.arm.closeFlag();
        if(this.modules.arm) await this.modules.arm.setServo({name:"BCB", angle: 115});
        if(this.modules.arm) await this.modules.arm.setServo({name:"BCC", angle: 115});
        if(this.modules.arm) await this.modules.arm.setServo({name:"ABA", angle: 115});
        if(this.modules.arm) await this.modules.arm.setServo({name:"ABB", angle: 115});
        if(this.modules.arm) await this.modules.arm.setServo({name:"ACA", angle: 115});
        if(this.modules.arm) await this.modules.arm.setServo({name:"ACC", angle: 115});
    }

    async endMatch(){
        await super.endMatch();
        //if(this.modules.arm) await this.setArmDefault({});
    }

    getDescription(){
        return {
            functions:{
                testMove: {},
                dance: {},
                detectAndGrabBuoy: {},
                setPosDebug: {},
                activateLighthouse: {},
                readWeathervane: {},
                setArmDefault: {},
                setArmWindsock: {},
                setArmReef: {},
                setArmReefLift: {},
                setArmReefDeposit: {},
                setArmWindsockPrepare:{},
                setArmWindsockActive:{},
                setArmWindsockActive:{},
                moveAtAngle:{
                    angle:{ legend:"angle (deg)", type:"number", min:-180, max:180, value:0 },
                    distance:{ legend:"distance (m)", type:"number", min:-1000, max:1000, value:150 },
                    speed:{ legend:"speed (m/s)", type:"range", min: -1.5, max: 1.5, value:0.5, step:0.1 }
                }
            }
        }
    }

    async setPosDebug(parameters){
        this.x = this.startPosition["blue"].x;
        this.y = this.startPosition["blue"].y;
        this.angle = this.startPosition["blue"].angle;
        if(this.modules.base) await this.modules.base.enableMove();
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        return true;
    }

    async activateLighthouse(parameters){
        //let intermediatePose = { a1:90, a2:90, a3:50, a4:120, a5:130, duration:200 };
        let activationPose = { a1:90, a2:90, a3:140, a4:52, a5:90, duration:350 };
        if(this.modules.arm) await this.modules.arm.setPose(activationPose);
        await utils.sleep(100);
        await this.moveForward({distance:200, speed:0.2});
        //let buoysOnFront = this.variables.buoyStorageFrontGreen.value>0 || this.variables.buoyStorageFrontRed.value>0;
        // Prepare arm
        //if(this.modules.arm) await this.modules.arm.setPose(intermediatePose);
        // Arm up
        //if(this.modules.arm) await this.modules.arm.setPose({ a1:30, a2:40, a3:55, a4:126, a5:90, duration:200 })
        //await utils.sleep(100);
        // Move forward
        //await this.moveForward({distance:75, speed:0.4});
        // Arm swipe
        //if(this.modules.arm) await this.modules.arm.setPose({ a1:30, a2:140, a3:55, a4:126, a5:90, duration:200 })
        this.addScore(15);
        // Move backward
        await this.moveBackward({distance:300, speed:0.4});
        // Arm to default
        //if(this.modules.arm) await this.modules.arm.setPose(intermediatePose);
        await utils.sleep(100);
        await this.setArmDefault({});
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

    async depositBuoys(parameters){
        return false;
        let fairway = this.app.map.getComponent(parameters.component, this.team)
        if(!fairway) return false;
        if(!("buoyCount" in fairway)) fairway.buoyCount = 0;
        let pairedFairway = this.app.map.getComponent(parameters.pairedComponent, this.team)
        if(!pairedFairway) return false;
        if(!("buoyCount" in pairedFairway)) pairedFairway.buoyCount = 0;
        
        
        let backwardDist = 200 - 75*fairway.buoyCount;
        console.log("buoys in fairway", fairway.buoyCount, "dist", backwardDist, "in paired", pairedFairway.buoyCount)
        let result = await this.moveBackward({distance:backwardDist, speed:0.5});
        if(!result) return result;
        let handleSideGreen = parameters.sideGreen && this.variables.buoyStorageSideGreen.value>0;
        let handleSideRed = parameters.sideRed && this.variables.buoyStorageSideRed.value>0;
        
        if(handleSideGreen || handleSideRed){
            result = await this.openSideArms({sideGreen:handleSideGreen, sideRed:handleSideRed});
            if(!result) return result;
            let buoyCountGreen = 0;
            let buoyCountRed = 0;
            let maxSide = 0;
            if(handleSideGreen){ 
                buoyCountGreen = this.variables.buoyStorageSideGreen.value;
                maxSide = Math.max(maxSide, this.variables.buoyStorageSideGreen.value);
                this.variables.buoyStorageSideGreen.value = 0;
            }
            if(handleSideRed){ 
                buoyCountRed = this.variables.buoyStorageSideRed.value;
                maxSide = Math.max(maxSide, this.variables.buoyStorageSideRed.value);
                this.variables.buoyStorageSideRed.value = 0;
            }
            let forwardDist = 200;
            result = await this.moveForward({distance:forwardDist, speed:0.5});
            if(!result) return result;
            await this.closeSideArms({sideRed:true, sideGreen:true});
            
            //Add to score
            if(handleSideGreen && handleSideRed) this.addNewPairsScore(fairway, pairedFairway, buoyCountGreen, buoyCountRed )
            else this.addNewPairsScore(fairway, pairedFairway, maxSide, 0)
        }
        
        //Handle front storage
        let handleFrontGreen = parameters.sideGreen && this.variables.buoyStorageFrontGreen.value>0;
        let handleFrontRed = parameters.sideRed && this.variables.buoyStorageFrontRed.value>0;
        if(handleFrontGreen || handleFrontRed){ 
            let angleDiff = 180;
            if(handleFrontRed && !handleFrontGreen) angleDiff = 160;
            if(handleFrontGreen && !handleFrontRed) angleDiff = -160;
            await this.rotateToAngle({angle:utils.normAngle(this.angle+angleDiff), speed:0.5})
            await this.setArmDefault({});
            let armPosCenter_Up = { a1:70, a2:95, a3:100, a4:40, a5:116, duration:200 };
            let armPosReleaseGreen_Up = { a1:70, a2:30, a3:157, a4:40, a5:116, duration:200 };
            let armPosReleaseGreen_Down = { a1:90, a2:30, a3:157, a4:40, a5:116, duration:200 };
            if(handleFrontGreen && !handleFrontRed){
                await this.modules.arm.setPose(armPosCenter_Up);
                if(this.variables.buoyStorageFrontRed.value>0){
                    await this.modules.arm.setPose(armPosReleaseGreen_Up);
                    await this.modules.arm.enablePump();
                    await this.modules.arm.setPose(armPosReleaseGreen_Down);
                    await utils.sleep(750);
                    await this.modules.arm.setPose(armPosReleaseGreen_Up);
                }
                //Score
                let buoyCount = this.variables.buoyStorageFrontGreen.value;
                this.addNewPairsScore(fairway, pairedFairway, buoyCount, 0);
                this.variables.buoyStorageFrontGreen.value = 0;
                //back move
                result = await this.moveBackward({distance:200, speed:0.5});
                if(this.variables.buoyStorageFrontRed.value>0){
                    await this.modules.arm.setPose(armPosReleaseGreen_Down);
                    await this.modules.arm.disablePump();
                    await utils.sleep(500);
                    await this.modules.arm.setPose(armPosReleaseGreen_Up);
                    await this.modules.arm.setPose(armPosCenter_Up);
                    await utils.sleep(100);
                    await this.setArmClose({});
                }
                else await this.setArmDefault({});
            }
            let armPosReleaseRed_Up = { a1:70, a2:160, a3:157, a4:40, a5:116, duration:200 };
            let armPosReleaseRed_Down = { a1:90, a2:160, a3:157, a4:40, a5:116, duration:200 };
            if(!handleFrontGreen && handleFrontRed){
                await this.modules.arm.setPose(armPosCenter_Up);
                if(this.variables.buoyStorageFrontGreen.value>0){
                    await this.modules.arm.setPose(armPosReleaseRed_Up);
                    await this.modules.arm.enablePump();
                    await this.modules.arm.setPose(armPosReleaseRed_Down);
                    await utils.sleep(750);
                    await this.modules.arm.setPose(armPosReleaseRed_Up);
                }
                //score
                let buoyCount = this.variables.buoyStorageFrontRed.value;
                this.addNewPairsScore(fairway, pairedFairway, buoyCount, 0);
                this.variables.buoyStorageFrontRed.value = 0;
                //back move
                result = await this.moveBackward({distance:200, speed:0.5});
                if(this.variables.buoyStorageFrontGreen.value>0){
                    await this.modules.arm.setPose(armPosReleaseRed_Down);
                    await this.modules.arm.disablePump();
                    await utils.sleep(500);
                    await this.modules.arm.setPose(armPosReleaseRed_Up);
                    await this.modules.arm.setPose(armPosCenter_Up);
                    await utils.sleep(100);
                    await this.setArmClose({});
                }
                else await this.setArmDefault({});
            }
            if(handleFrontGreen && handleFrontRed){
                //Score
                this.addNewPairsScore(fairway, pairedFairway, this.variables.buoyStorageFrontGreen.value, this.variables.buoyStorageFrontRed.value );
                
                this.variables.buoyStorageFrontGreen.value = 0;
                this.variables.buoyStorageFrontRed.value = 0;
                //backmove
                result = await this.moveBackward({distance:200, speed:0.5});
            }
        }
        //need to add 2 point per buoy pair
        return result;
    }

    async setArmDefault(parameters){
        //if(this.modules.arm) await this.modules.arm.setPose({ a1:170, a2:90, a3:50, a4:140, a5:25, duration:200 })
        let duration = 300;
        if(parameters && ("duration" in parameters)) duration = parameters.duration;
        if(this.modules.arm) await this.modules.arm.setPose({ a1:110, a2:90, a3:10, a4:142, a5:130, duration:duration })
        return true;
    }

    async setArmClose(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:170, a2:95, a3:154, a4:50, a5:65, duration:200 })
        if(parameters.addBuoyStorageFrontGreen) this.variables.buoyStorageFrontGreen.value+=parameters.addBuoyStorageFrontGreen===true?1:parameters.addBuoyStorageFrontGreen;
        if(parameters.addBuoyStorageFrontRed) this.variables.buoyStorageFrontRed.value+=parameters.addBuoyStorageFrontRed===true?1:parameters.addBuoyStorageFrontRed;
        if(parameters.removeFromMap) parameters.removeFromMap.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
        
        return true;
    }

    async setArmWindsockPrepare(parameters){
        let pos = { a1:100, a2:125, a3:140, a4:40, a5:90, duration:200 };
        if(this.team=="blue") pos.a2 = 55;
        if(this.team=="yellow") pos.a2 = 125;
        if(this.modules.arm) await this.modules.arm.setPose(pos)
        return true;
    }

    async setArmWindsockReady(parameters){
        let pos = { a1:100, a2:90, a3:140, a4:40, a5:90, duration:200 };
        if(this.modules.arm) await this.modules.arm.setPose(pos)
        return true;
    }

    async setArmWindsockActive(parameters){
        let posDown = { a1:100, a2:90, a3:140, a4:70, a5:90, duration:200, wait: true };
        if(this.modules.arm) await this.modules.arm.setPose(posDown)
        
        let posUp = { a1:100, a2:90, a3:140, a4:40, a5:90, duration:200, wait: true };
        if(this.modules.arm) await this.modules.arm.setPose(posUp)
        
        if(this.team=="blue") posUp.a2 = 120;
        if(this.team=="yellow") posUp.a2 = 70;
        if(this.modules.arm) await this.modules.arm.setPose(posUp)
        return true;
        
    }

    async setArmReef(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:97, a2:90, a3:145, a4:55, a5:75, duration:200 })
        return true;
    }

    async setArmReefLift(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:97, a2:90, a3:120, a4:30, a5:75, duration:400 })
        return true;
    }

    async setArmReefDeposit(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:110, a2:90, a3:140, a4:70, a5:52, duration:500 })
        return true;
    }

    async setArmPosition(parameters){
        return false;
        if(this.modules.arm) await this.modules.arm.setPose(parameters)
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
        await this.modules.arm.setPump({ name: "ACP", value:0 });
        return true;
    }

}

