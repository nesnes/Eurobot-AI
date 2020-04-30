'use strict';
const Robot = require('./robot');

module.exports = class Robot2020 extends Robot{

    activateLighthouse(parameters){
        console.log("  -> Activating ligthouse")
        return false
    }

}
