'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')

module.exports = class LidarX1 {
    constructor(app) {
        this.app = app;
        this.port = "";
        this.baudrate = 115200;
        this.connected = false;
        this.serial = null;
        this.packet = null;
        this.borderMargin = 100;
        this.maxDistance = 600;
        this.rawMeasures = [];
        this.measures = [];
        this.angleOffset = 180;
        this.lastSendTime = 0;
        if(process.platform=="linux") this.port = "/dev/lidar"; //Raspberry/Linux
        if(process.platform=="darwin") this.port = "/dev/cu.usbserial-001K39BS"; //Mac
        if(process.platform=="win32") this.port = "COM4"; //Windows
    }
    
    async init(){
        console.log("open Lidar serial", this.port)
        this.app.logger.log("==> Open lidar at " + this.port);
        this.serial = new SerialPort(this.port, { baudRate: this.baudrate }, (err)=>{
            if(err) console.log(err)
            else this.app.logger.log("==> Lidar connected");
        })
        this.serial.on('data', (data)=>{
            for(let d of data)  this.onData(d);
        })
        this.send();
    }

    getDescription(){
        return {
            functions:{
            }
        }
    }

    async close(){
        if(this.serial && this.serial.isOpen) this.serial.close()
        if(this.serial) this.serial.destroy()
        let timeout = 10*1000;
        let sleep = 10;
        while(timeout>0){
            if(this.serial.destroyed) break;
            else{
                await utils.sleep(sleep);
                timeout-=sleep;
            }
        }
    }

    async removeMeasuresOutOfRange(){
        let robotX = this.app.robot.x;
        let robotY = this.app.robot.y;
        let angle = this.app.robot.angle;
        this.measures = [];
        for(let i=0;i<this.rawMeasures.length;i++){
            let remove = false;
            if(this.rawMeasures[i].d>this.maxDistance) remove = true;
            if(this.rawMeasures[i].d <= 0) remove = true;
            if(!remove){
                let rayAngle = this.rawMeasures[i].a + angle;
                let x = this.rawMeasures[i].d;
                let y = 0;
                /*if(rayAngle>360) rayAngle-=360;
                if(rayAngle<-360) rayAngle+=360;*/
                let rayAngleRad = rayAngle*(Math.PI/180);
                let raySin = Math.sin(rayAngleRad);
                let rayCos = Math.cos(rayAngleRad);
                let x2 = x*rayCos - y*raySin;
                let y2 = y*rayCos + x*raySin;
                x2 += robotX;
                y2 += robotY;
                if(!(this.borderMargin<=x2&&x2<=this.app.map.width-this.borderMargin
                && this.borderMargin<=y2&&y2<=this.app.map.height-this.borderMargin))
                    remove = true;
            }
            if(!remove){
                this.measures.push(this.rawMeasures[i])
            }
        }
    }

    async updateMeasures(currentPacket){
        //Remove older measures in the range
        let startAngle = currentPacket.startAngle;
        let endAngle = currentPacket.endAngle;
        if(endAngle > startAngle){
            startAngle=Math.floor(startAngle)
            endAngle=Math.ceil(endAngle)
        }
        else{
            startAngle=Math.ceil(startAngle)
            endAngle=Math.floor(endAngle)
        }
        for(let i=0;i<this.rawMeasures.length;i++){
            let angle = this.rawMeasures[i].a;
            let inRange = false;
            if(endAngle > startAngle)
                inRange = startAngle <= angle && angle <= endAngle
            else
                inRange = (startAngle <= angle && angle <= 360) || (0 <= angle && angle <= endAngle)
            if(inRange){
                this.rawMeasures.splice(i,1);
                i--;
            }
        }
        //Insert new measures
        this.rawMeasures.push(...currentPacket.measures);
        //this.measures = this.rawMeasures; //debug
        await this.removeMeasuresOutOfRange();
        this.send();
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 100) return;//send max every 100ms
        this.lastSendTime = now;
        let payload = {
            measures: this.measures
        }
        this.app.mqttServer.publish({
            topic: '/lidar',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    onData(d){
        let pointCount = 400;
        let indexMultiplier = pointCount / 360.0;
        let KSYNC0 = 0x55;
        let KSYNC1 = 0xaa;
        let KSYNC2 = 0x03;
        let KSYNC3 = 0x08;

        if(this.packet==null){
            if(d==KSYNC0){
                this.packet={
                    state:0,
                    data: [],
                    measures: []
                };
            }
            return;
        }
         
        switch(this.packet.state){
            case 0:
                if(d==KSYNC1) this.packet.state++;
                else this.packet = null;
                return;
            case 1:
                if(d==KSYNC2) this.packet.state++;
                else this.packet = null;
                return;
            case 2:
                if(d==KSYNC3) this.packet.state++;
                else this.packet = null;
                return;
            case 3:
                // Read and parse data
                this.packet.data.push(d);
                if(this.packet.data.length!=32) return;
                // Get infos
                let rotationSpeed = ((this.packet.data[1] << 8) | this.packet.data[0]) / 3840.0; // 3840.0 = (64 * 60)
                this.packet.startAngle =  ((this.packet.data[3] << 8) | this.packet.data[2]) / 64.0 - 640;
                this.packet.endAngle =  ((this.packet.data[29] << 8) | this.packet.data[28]) / 64.0 - 640;
                let step = 0.0;
                if(this.packet.endAngle > this.packet.startAngle) step = (this.packet.endAngle - this.packet.startAngle); 
                else step = (this.packet.endAngle - (this.packet.startAngle - 360)); 
                step /= 8;

                for(let i = 0; i < 8; i++)
                {
                    let distance = (this.packet.data[5+(i*3)] << 8) | this.packet.data[4+(i*3)];
                    let quality = this.packet.data[6+(i*3)];
                    let angle = (this.packet.startAngle + step * i) + this.angleOffset;
                    if(angle > 360) angle -= 360;

                    /*let fIndex = measurementAngle * indexMultiplier;
                    let index = (pointCount-1)-(Math.round(fIndex) % pointCount);*/
                    if(quality == 0) distance = 0;

                    this.packet.measures[i] = {
                        a: angle,
                        d: distance,
                        q: quality
                    }
                }
                
                this.packet.startAngle+=this.angleOffset;
                this.packet.endAngle+=this.angleOffset;
                if(this.packet.startAngle>360) this.packet.startAngle -=360;
                if(this.packet.endAngle>360) this.packet.endAngle -=360;
                this.updateMeasures(this.packet);
                this.packet = null;
                return;
        }

    }
}
