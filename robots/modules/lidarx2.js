'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')

module.exports = class LidarX2 {
    constructor(app) {
        this.app = app;
        this.port = "";
        this.baudrate = 115200;
        this.connected = false;
        this.serial = null;
        this.packet = null;
        this.borderMargin = 100;
        this.maxDistance = 600;
        this.measures = [];
        this.angleOffset = 180;
        this.lastSendTime = 0;
    }
    
    async init(){
        this.serial = new SerialPort('COM4', { baudRate: this.baudrate }, (err)=>{
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
        for(let i=0;i<this.measures.length;i++){
            let remove = false;
            if(this.measures[i].d>this.maxDistance) remove = true;
            if(!remove){
                let rayAngle = this.measures[i].a + angle;
                let x = this.measures[i].d;
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
            if(remove){
                this.measures.splice(i,1);
                i--;
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
        for(let i=0;i<this.measures.length;i++){
            let angle = this.measures[i].a;
            let inRange = false;
            if(endAngle > startAngle)
                inRange = startAngle <= angle && angle <= endAngle
            else
                inRange = (startAngle <= angle && angle <= 360) || (0 <= angle && angle <= endAngle)
            if(inRange){
                this.measures.splice(i,1);
                i--;
            }
        }
        //Insert new measures
        this.measures.push(...currentPacket.measures);
        await this.removeMeasuresOutOfRange();
        //console.log(this.measures.length);
        this.send();
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 100) return;//send max every 100ms
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
            if(d==0xAA){
                this.packet={
                    state:0,
                    checksum: 0x55AA,
                    data: [],
                    measures: []
                };
            }
            return;
        }

        switch(this.packet.state){
            case 0:
                if(d==0x55) this.packet.state++;
                else this.packet = null;
                return;
            case 1:
                // Check packet type
                this.packet.ct = d;
                this.packet.state++;
                if(this.packet.ct!=0x00) this.packet = null;
                return;
            case 2:
                // Get sample count in packet
                this.packet.ls = d;
                this.packet.state++;
                if(this.packet.ls==0) this.packet = null;
                return;
            case 3:
                // Get start angle Low
                this.packet.fsaL = d;
                this.packet.state++;
                return;
            case 4:
                // Get start angle High
                this.packet.fsaM = d;
                this.packet.fsa = this.packet.fsaL + this.packet.fsaM * 256;
                this.packet.startAngle = (this.packet.fsa>>1)/64
                this.packet.checksum ^= this.packet.fsa;
                this.packet.state++;
                return;
            case 5:
                // Get end angle Low
                this.packet.lsaL = d;
                this.packet.state++;
                return;
            case 6:
                // Get end angle High
                this.packet.lsaM = d;
                this.packet.lsa = this.packet.lsaL + this.packet.lsaM * 256;
                this.packet.endAngle = (this.packet.lsa>>1)/64
                this.packet.aDiff = this.packet.endAngle - this.packet.startAngle
                if (this.packet.aDiff < 0)
                    this.packet.aDiff = this.packet.aDiff + 360
                this.packet.state++;
                return;
            case 7:
                // Get checksum low
                this.packet.csL = d;
                this.packet.state++;
                return;
            case 8:
                // Get checksum high
                this.packet.csM = d;
                this.packet.cs = this.packet.csL + this.packet.csM * 256;
                this.packet.state++;
                return;
            case 9:
                // Read and parse data
                this.packet.data.push(d);
                if(this.packet.data.length!=this.packet.ls*2) return;
                //Analyse data
                for(let i=0;i<this.packet.ls*2; i+=2){
                    var distance = this.packet.data[i] + this.packet.data[i+1] * 256
                    this.packet.checksum ^= distance;
                    distance/=4;
                    //Get angle
                    var angle = this.packet.startAngle+(this.packet.aDiff/this.packet.ls)*i/2
                    //Correct angle
                    var angleCorrection =0;
                    if(distance>0)
                        angleCorrection = (Math.atan(21.8*((155.3-distance)/(155.3*distance)))*(180/Math.PI))
                    angle += angleCorrection;
                    if(angle>360) angle -= 360
                    //Append to measures
                    if(!isNaN(angle) && !isNaN(distance)){
                        angle += this.angleOffset;
                        if(angle>360) angle -=360;
                        this.packet.measures.push({a:angle, d:distance});
                    }
                }
                this.packet.checksum ^= this.packet.ct + this.packet.ls*256
                this.packet.checksum ^= this.packet.lsa
                //Validate checksum
                if(this.packet.checksum == this.packet.cs){
                    //this.packetQueue.push(this.packet)
                    //console.log(this.packet.measures)
                    this.packet.startAngle+=this.angleOffset;
                    this.packet.endAngle+=this.angleOffset;
                    if(this.packet.startAngle>360) this.packet.startAngle -=360;
                    if(this.packet.endAngle>360) this.packet.endAngle -=360;
                    this.updateMeasures(this.packet);
                }
                else console.log("bad checksum")
                this.packet = null;
                return;
        }

    }
}