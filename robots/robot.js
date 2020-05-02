'use strict';

module.exports = class Robot {
    constructor(app) {
        this.app = app;
    }

    run(action) {
        this.app.logger.log(" ->" + action.name);
        if(action.method in this)
            return this[action.method](action.parameters)
        else{
            this.app.logger.log("  -> No method found");
            return false;
        }
    }

    moveToComponent(parameters){

        let component = null;
        for(const item of this.app.map.components){
            if(item.type == parameters.component){
                component = item;
                break;
            }
        }
        this.app.logger.log("  -> moving "+JSON.stringify(component));
        return true
    }
}
