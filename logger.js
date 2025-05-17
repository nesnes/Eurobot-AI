'use strict';

module.exports = class Logger {
    constructor(app) {
        this.app = app;
    }

    //Send logs over MQTT 
    log(){
        let currentTime = "-";
        if(this.app.intelligence.startTime) {
            currentTime = new Date().getTime() - this.app.intelligence.startTime;
        }
        let message = "["+currentTime+"] ";
        for(let arg of arguments) {
            if(typeof arg === 'object') {
                message += JSON.stringify(arg);
            }
            else {
                message += arg;
            }
            message += " ";
        }
        console.log(message);
        this.app.mqttServer.publish({
            topic: '/logs',
            payload: message,
            qos: 0, retain: false
        });
    }
}