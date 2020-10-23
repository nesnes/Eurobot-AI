'use strict';

module.exports = class Logger {
    constructor(app) {
        this.app = app;
    }

    //Send logs over MQTT 
    log(msg){
        this.app.mqttServer.publish({
            topic: '/logs',
            payload: msg,
            qos: 0, retain: false
        });
    }
}