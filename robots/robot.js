'use strict';

module.exports = class Robot {
    constructor() {
    }

    run(action) {
        console.log(" ->", action.name)
        if(action.method in this)
            return this[action.method](action.parameters)
        else{
            console.log("  -> No method found")
            return false;
        }
    }

    moveToElement(parameters){
        console.log("  -> moving", parameters)
        return true
    }
}
