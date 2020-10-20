'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');

delete require.cache[require.resolve('./modules/lidarx2')]; //Delete require() cache
const Lidar = require('./modules/lidarx2');

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
            blue:{x:265,y:650,angle:0},
            yellow:{x:1735,y:650,angle:180}
        }
        this.variables = {
            buoyStorageFrontA: { value: 0,  max: 1 },
            buoyStorageFrontB: { value: 0,  max: 1 },
            buoyStorageSideA: { value: 0,  max: 2 },
            buoyStorageSideB: { value: 0,  max: 2 },
            windsocks: { value: 0,  max: 2 },
            endZone: { value: 0,  max: 2 }, //0 undefined, 1 north, 2 south
        }
        this.collisionDistance = this.radius+175;
        this.slowdownDistance = this.collisionDistance+100;
        //this.modules.lidar = new Lidar(app)
        //this.modules.lidarLocalisation = new LidarLocalisation(app)
        this.modules.arm = new Arm(app);
        this.modules.camera = new Camera(app);
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
        if(this.modules.arm) await this.modules.arm.disablePump();
        if(this.modules.arm) await this.setArmDefault();
        if(this.modules.arm) await this.modules.arm.setRight({angle:115});
        if(this.modules.arm) await this.modules.arm.setLeft({angle:125});
    }

    async endMatch(){
        await super.endMatch();
        if(this.modules.arm) await this.modules.arm.disablePump();
        if(this.modules.arm) await this.setArmDefault();
        if(this.modules.arm) await this.modules.arm.setLeft({angle:60});
        if(this.modules.arm) await this.modules.arm.setRight({angle:60});
    }

    getDescription(){
        return {
            functions:{
                detectAndGrabBuoy: {},
                setPosDebug: {},
                activateLighthouse: {},
                readWeathervane: {},
                setArmDefault: {},
                setArmWindsock: {},
            }
        }
    }

    async setPosDebug(parameters){
        if(this.modules.base) await this.modules.base.enableMove();
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
        return true;
    }

    async activateLighthouse(parameters){
        this.app.logger.log("  -> Activating ligthouse");
        this.addScore(10);
        await utils.sleep(500);
        return true
    }

    async grabStartingBuoys(parameters){
        this.variables.buoyStorageFrontA.value++;
        this.variables.buoyStorageFrontB.value++;
        this.app.map.removeComponent(this.app.map.getComponent("buoyStartingNorth", this.team));
        this.app.map.removeComponent(this.app.map.getComponent("buoyStartingFairwayNorth", this.team));
        await utils.sleep(500);
        return true
    }

    async readWeathervane(parameters){
        this.variables.endZone.value = 1;
        await utils.sleep(500);
        return true
    }

    async grabBuoysBottom(parameters){
        this.variables.buoyStorageSideB.value+=2;
        this.app.map.removeComponent(this.app.map.getComponent("buoyMiddleBottom", this.team));
        this.app.map.removeComponent(this.app.map.getComponent("buoyBottom", this.team));
        await utils.sleep(500);
        return true
    }

    async grabReaf(parameters){
        this.variables.buoyStorageFrontA.value++;
        this.variables.buoyStorageFrontB.value++;
        await utils.sleep(500);
        return true
    }

    async depositBuoys(parameters){
        this.variables.buoyStorageFrontA.value = 0;
        this.variables.buoyStorageFrontB.value = 0;
        this.variables.buoyStorageSideA.value = 0;
        this.variables.buoyStorageSideB.value = 0;
        this.addScore(20);
        await utils.sleep(500);
        return true
    }

    async setArmDefault(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:170, a2:90, a3:50, a4:140, a5:25, duration:200 })
        return true;
    }

    async setArmWindsock(parameters){
        if(this.modules.arm) await this.modules.arm.setPose({ a1:150, a2:90, a3:140, a4:140, a5:175, duration:200 })
        return true;
    }

    async setArmPosition(parameters){
        if(this.modules.arm) await this.modules.arm.setPose(parameters)
        return true;
    }

    async openSideArms(parameters){
        if(this.modules.arm && parameters.left) await this.modules.arm.setLeft({angle:70})
        if(this.modules.arm && parameters.right) await this.modules.arm.setRight({angle:70})
        return true;
    }

    async closeSideArms(parameters){
        if(this.modules.arm) await this.modules.arm.setLeft({angle:105})
        if(this.modules.arm) await this.modules.arm.setRight({angle:105})
        if(parameters.addBuoyStorageSideA) this.variables.buoyStorageSideA.value+=parameters.addBuoyStorageSideA===true?1:parameters.addBuoyStorageSideA;
        if(parameters.addBuoyStorageSideB) this.variables.buoyStorageSideB.value+=parameters.addBuoyStorageSideB===true?1:parameters.addBuoyStorageSideB;
        if(parameters.removeFromMap) parameters.removeFromMap.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
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
        if(!this.modules.camera) return true;
        //Grab
        let armCloseLookPosition = {a1:60, a2:95, a3:65, a4:75, a5:20, duration:200};
        let tryBudget = 3;
        let grabbed=false;
        while(--tryBudget>=0){
            if(this.modules.arm) await this.modules.arm.setPose(armCloseLookPosition)
            await utils.sleep(400);
            let detections = await this.modules.camera.detect();
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

            armPreGrabPosition.a1 = 0.0000*x4 + -0.0002*x3 + 0.0243*x2 + -1.3195*x + 142.48;
            armPreGrabPosition.a2 = 0.0000*x4 + 0.0000*x3 + 0.0000*x2 + 0.0000*x + 95;
            armPreGrabPosition.a3 = 3.226e-5*x4 + -0.0075*x3 + 0.6588*x2 + -26.076*x + 512.99;
            armPreGrabPosition.a4 = 3.568e-5*x4 + -0.0089*x3 + 0.8282*x2 + -35,775*x + 673;
            armPreGrabPosition.a5 = 0.0000*x4 + 0.0005*x3 + -0.0888*x2 + 6.4708*x - 118.09;

            //let armPreGrabFarPosition = {a1:120, a2:95, a3:147, a4:134, a5:10, duration:200};
            let rotationDiff = Math.min(50, Math.max(-50,(target.x-50)*1.5));
            armPreGrabPosition.a2 += rotationDiff;
            if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            await utils.sleep(200);
            //Enable pump
            if(this.modules.arm) await this.modules.arm.enablePump();
            //Move down
            armPreGrabPosition.a1 = Math.max(170, armPreGrabPosition.a1+50);
            if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            await utils.sleep(200);
            //Move up
            armPreGrabPosition.a1 = 40;
            if(this.modules.arm) await this.modules.arm.setPose(armPreGrabPosition)
            grabbed=true;
            break;
        }
        //Deposit

        return true;
    }

}
