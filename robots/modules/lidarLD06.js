'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')

module.exports = class LidarLD06 {
    constructor(app) {
        this.app = app;
        this.port = "";
        this.baudrate = 230400;
        this.connected = false;
        this.serial = null;
        this.packet = null;
        this.borderMargin = 100;
        this.minDistance = 140;
        this.maxDistance = 3200;
        this.minConfidence = 200; // Actually remove some spotlight interferences
        this.rawMeasures = [];
        this.measures = [];
        this.angleOffset = 0;
        this.lastSendTime = 0;
        this.rejectedAngles = [{from:356, to:360},{from:0, to:4},  {from:116, to:124},  {from:236, to:244}];//[{from:47, to:73}, {from:167, to:193}, {from:287, to:313}]
        if(process.platform=="linux") this.port = "/dev/ttyUSB0";//"/dev/lidar"; //Raspberry/Linux
        if(process.platform=="darwin") this.port = "/dev/cu.usbserial-A9QG4MTI"; //Mac
        //if(process.platform=="darwin") this.port = "/dev/cu.usbserial-001K39BS"; //Mac
        if(process.platform=="win32") this.port = "COM5"; //Windows
        this.crcTable  = [
            0x00, 0x4d, 0x9a, 0xd7, 0x79, 0x34, 0xe3,
            0xae, 0xf2, 0xbf, 0x68, 0x25, 0x8b, 0xc6, 0x11, 0x5c, 0xa9, 0xe4, 0x33,
            0x7e, 0xd0, 0x9d, 0x4a, 0x07, 0x5b, 0x16, 0xc1, 0x8c, 0x22, 0x6f, 0xb8,
            0xf5, 0x1f, 0x52, 0x85, 0xc8, 0x66, 0x2b, 0xfc, 0xb1, 0xed, 0xa0, 0x77,
            0x3a, 0x94, 0xd9, 0x0e, 0x43, 0xb6, 0xfb, 0x2c, 0x61, 0xcf, 0x82, 0x55,
            0x18, 0x44, 0x09, 0xde, 0x93, 0x3d, 0x70, 0xa7, 0xea, 0x3e, 0x73, 0xa4,
            0xe9, 0x47, 0x0a, 0xdd, 0x90, 0xcc, 0x81, 0x56, 0x1b, 0xb5, 0xf8, 0x2f,
            0x62, 0x97, 0xda, 0x0d, 0x40, 0xee, 0xa3, 0x74, 0x39, 0x65, 0x28, 0xff,
            0xb2, 0x1c, 0x51, 0x86, 0xcb, 0x21, 0x6c, 0xbb, 0xf6, 0x58, 0x15, 0xc2,
            0x8f, 0xd3, 0x9e, 0x49, 0x04, 0xaa, 0xe7, 0x30, 0x7d, 0x88, 0xc5, 0x12,
            0x5f, 0xf1, 0xbc, 0x6b, 0x26, 0x7a, 0x37, 0xe0, 0xad, 0x03, 0x4e, 0x99,
            0xd4, 0x7c, 0x31, 0xe6, 0xab, 0x05, 0x48, 0x9f, 0xd2, 0x8e, 0xc3, 0x14,
            0x59, 0xf7, 0xba, 0x6d, 0x20, 0xd5, 0x98, 0x4f, 0x02, 0xac, 0xe1, 0x36,
            0x7b, 0x27, 0x6a, 0xbd, 0xf0, 0x5e, 0x13, 0xc4, 0x89, 0x63, 0x2e, 0xf9,
            0xb4, 0x1a, 0x57, 0x80, 0xcd, 0x91, 0xdc, 0x0b, 0x46, 0xe8, 0xa5, 0x72,
            0x3f, 0xca, 0x87, 0x50, 0x1d, 0xb3, 0xfe, 0x29, 0x64, 0x38, 0x75, 0xa2,
            0xef, 0x41, 0x0c, 0xdb, 0x96, 0x42, 0x0f, 0xd8, 0x95, 0x3b, 0x76, 0xa1,
            0xec, 0xb0, 0xfd, 0x2a, 0x67, 0xc9, 0x84, 0x53, 0x1e, 0xeb, 0xa6, 0x71,
            0x3c, 0x92, 0xdf, 0x08, 0x45, 0x19, 0x54, 0x83, 0xce, 0x60, 0x2d, 0xfa,
            0xb7, 0x5d, 0x10, 0xc7, 0x8a, 0x24, 0x69, 0xbe, 0xf3, 0xaf, 0xe2, 0x35,
            0x78, 0xd6, 0x9b, 0x4c, 0x01, 0xf4, 0xb9, 0x6e, 0x23, 0x8d, 0xc0, 0x17,
            0x5a, 0x06, 0x4b, 0x9c, 0xd1, 0x7f, 0x32, 0xe5, 0xa8
        ];
    }
    
    async init(){
        this.serial = new SerialPort(this.port, { baudRate: this.baudrate }, (err)=>{
            if(err) console.log(err)
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
            if(this.rawMeasures[i].d<this.minDistance) remove = true;
            if(this.rawMeasures[i].c<this.minConfidence) remove = true;
            if(!remove){
                let rayAngle = this.rawMeasures[i].a + angle;
                let x = this.rawMeasures[i].d;
                let y = 0;
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
            // apply rejection angles
            for(let range of this.rejectedAngles) {
                if( range.from <= this.rawMeasures[i].a && this.rawMeasures[i].a <= range.to)
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
        await this.removeMeasuresOutOfRange();
        this.send();
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 333) return;//send max every 333ms
        this.lastSendTime = now;
        let payload = {
            measures: this.measures
        }
        //console.log(this.measures)
        this.app.mqttServer.publish({
            topic: '/lidar',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    onData(d){
        if(this.packet==null){
            if(d==0x54){
                this.packet={
                    state:0,
                    data: [],
                    measures: [],
                    raw: [0x54]
                };
            }
            return;
        }
        this.packet.raw.push(d);

        switch(this.packet.state){
            case 0:
                //  Data length
                this.packet.ls = d & 0x0E; // remove 3 most significative bits
                if(d==0x2C && this.packet.ls==12) this.packet.state++;
                else this.packet = null;
                return;
            case 1:
                // Speed Low
                this.packet.speedL = d;
                this.packet.state++;
                return;
            case 2:
                // Speed High
                this.packet.speedH = d;
                this.packet.speed = this.packet.speedL + this.packet.speedH * 256;
                this.packet.state++;
                return;
            case 3:
                // Get start angle Low
                this.packet.fsaL = d;
                this.packet.state++;
                return;
            case 4:
                // Get start angle High
                this.packet.fsaM = d;
                this.packet.startAngle = (this.packet.fsaL + this.packet.fsaM * 256)/100;// convert from 0.01 degrees
                this.packet.state++;
                return;
            case 5:
                // Read and parse data
                this.packet.data.push(d);
                if(this.packet.data.length!=this.packet.ls*3) return;
                //Analyse data
                for(let i=0;i<this.packet.ls*3; i+=3){
                    var distance = this.packet.data[i] + this.packet.data[i+1] * 256;
                    var confidence =  this.packet.data[i+2];
                    //Append to measures
                    if(!isNaN(distance) && !isNaN(confidence)){
                        this.packet.measures.push({a:0, d:distance, c:confidence});
                    }
                }
                this.packet.state++;
                return;
            case 6:
                // Get end angle Low
                this.packet.feaL = d;
                this.packet.state++;
                return;
            case 7:
                // Get end angle Low
                this.packet.feaM = d;
                this.packet.endAngle = (this.packet.feaL + this.packet.feaM * 256)/100; // convert from 0.01 degrees
                // Update measure with angle
                let diff = (this.packet.endAngle + 360 - this.packet.startAngle) % 360;
                let step = diff / (this.packet.ls - 1);
                this.packet.endAngle =  this.packet.endAngle%360;
                for(let i=0;i<this.packet.measures.length; i++){
                    this.packet.measures[i].a = this.packet.startAngle + step * i + this.angleOffset;
                    if(this.packet.measures[i].a>360) this.packet.measures[i].a -= 360;
                    if(this.packet.measures[i].a<0) this.packet.measures[i].a += 360;
                }
                this.packet.state++;
                return;
            case 8:
                // Get timestamp Low
                this.packet.timestampL = d;
                this.packet.state++;
                return;
            case 9:
                // Get timestamp high
                this.packet.timestampM = d;
                this.packet.timestamp = this.packet.timestampL + this.packet.timestampM * 256;
                //this.packet.timestamp = (this.packet.timestamp>>1)/64
                this.packet.state++;
                return;
            case 10:
                // CRC
                this.packet.crc = d;
                let crc = 0;
                for(let i=0;i<this.packet.raw.length-1;i++) {
                    crc = this.crcTable[(crc ^ this.packet.raw[i]) & 0xff];
                }
                if(crc != this.packet.crc){
                    //console.log(`Bad lidar crc ${crc} != ${this.packet.crc}`)
                    this.packet = null;
                    return;
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
