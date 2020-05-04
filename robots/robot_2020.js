'use strict';
delete require.cache[require.resolve('./robot')]; //Delete require() cache
const Robot = require('./robot');
const utils = require("../utils")

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
        this.name = "Robot Nesnes TDS"
        this.radius = 150;
        this.variables = {
            buoyStorageFrontA: { value: 0,  max: 1 },
            buoyStorageFrontB: { value: 0,  max: 1 },
            buoyStorageSideA: { value: 0,  max: 2 },
            buoyStorageSideB: { value: 0,  max: 2 }
        }
    }

    async activateLighthouse(parameters){
        this.app.logger.log("  -> Activating ligthouse");
        await utils.sleep(500);
        return false
    }

    async grabStartingBuoys(parameters){
        await utils.sleep(500);
        return true
    }

    async grabBuoysTop(parameters){
        await utils.sleep(500);
        return true
    }

    async grabBuoysBottom(parameters){
        await utils.sleep(500);
        return true
    }

    async grabReaf(parameters){
        await utils.sleep(500);
        return true
    }

}
