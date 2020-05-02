'use strict';

module.exports = class Logger {
    constructor(app) {
        this.app = app;
    }

    log(msg){
        this.app.mqttServer.publish({
            topic: '/logs',
            payload: msg,
            qos: 0, retain: false
        });
    }
}