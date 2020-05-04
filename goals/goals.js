'use strict';

module.exports = class Goals{
    constructor(app) {
        this.app = app;
        this.list = []
    }

    init(){
        this.send();
    }

    send(){
        let payload = {
            list: this.list
        }
        this.app.mqttServer.publish({
            topic: '/goals',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }
}