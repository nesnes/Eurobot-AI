'use strict';
const Robot = require('./robot');

module.exports = class Robot2020 extends Robot{
    constructor(app) {
        super(app);
    }

    activateLighthouse(parameters){
        this.app.logger.log("  -> Activating ligthouse");
        return false
    }

}
