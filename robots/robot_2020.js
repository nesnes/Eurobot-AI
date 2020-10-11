'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');

delete require.cache[require.resolve('./modules/lidarx2')]; //Delete require() cache
const Lidar = require('./modules/lidarx2');

//delete require.cache[require.resolve('./modules/lidarLocalisation')]; //Delete require() cache
//const LidarLocalisation = require('./modules/LidarLocalisation');

delete require.cache[require.resolve('./modules/arm')]; //Delete require() cache
const Arm = require('./modules/arm');

const utils = require("../utils")

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
        this.name = "Robot Nesnes TDS"
        this.radius = 140;
        this.startPosition = {
            blue:{x:200,y:900,angle:0},
            yellow:{x:2800,y:900,angle:180}
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
    }

    async init(){
        await super.init();
        if(this.modules.arm && this.modules.robotLink){
            await this.modules.arm.init().catch((e)=>{
                this.modules.arm = null;
            })
        } else this.modules.arm = null;
        this.sendModules();
    }

    async close(){
        await super.close();
        //custom close here
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
        if(this.modules.arm && parameters.left) await this.modules.arm.setLeft({angle:50})
        if(this.modules.arm && parameters.right) await this.modules.arm.setRight({angle:50})
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

}
