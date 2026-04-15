'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')

module.exports = class CameraAI {
    constructor(app, name) {
        this.app = app;
        this.name = name;
        this.port = "";
        this.baudrate = 921600;
        this.connected = false;
        this.serial = null;
        this.message = "";
        this.lastFrame = null;
        this.lastDetections = null;
        this.frameBufferSize = 3; // Estimated size of cam frame buffer, request N frame before having the new one
        this.classes = {
            0: {"name": "TAG", color: "red"},
            1: {"name": "BLACK", color: "grey"},
            2: {"name": "BLUE", color: "blue"},
            3: {"name": "YELLOW", color: "yellow"},
        }
        
        if(process.platform=="linux") this.port = "/dev/ttyUSB0";//"/dev/lidar"; //Raspberry/Linux
        if(process.platform=="darwin") this.port = "/dev/cu.usbmodem5AAF2684101"; //Mac
        if(process.platform=="win32") this.port = "COM5"; //Windows
    }
    
    async init(){
        this.serial = new SerialPort(this.port, { baudRate: this.baudrate }, (err)=>{
            if(err) console.log(err)
        })
        this.serial.on('data', (data)=>{
            let input = ""+data;
            let dataOffset = 0;
            const delim = "\n";
            // append to this.message up to delim
            while (true) {
                let msgEnd = input.indexOf(delim, dataOffset);
                if (msgEnd < 0) msgEnd = input.length;
                this.message += input.substring(dataOffset, msgEnd + delim.length);
                dataOffset = msgEnd + delim.length + 1;
                if(this.message.endsWith("\n")){
                    this.onMessage(this.message);
                    this.message = "";
                    continue;
                }
                break;
            }
        })
    }

    getDescription(){
        return {
            functions:{
                getFrame:{},
                getDetections:{},
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

    send(force=false){
        return;
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 333) return;//send max every 333ms
        this.lastSendTime = now;
    }

    async sendImage(){
        if (!this.lastFrame) return;
        let payload = structuredClone(this.lastFrame);
        payload.name = this.name;
        this.app.mqttServer.publish({
            topic: '/images',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    onMessage(msg){
        //console.log("Camera msg:", msg);
        let jsonMsg = null;
        try {
            jsonMsg = JSON.parse(msg);
        } catch(e){
            return;
        }
        // Initialization
        if (jsonMsg.name == "INIT@STAT?") {
            if (jsonMsg.data && jsonMsg.data.is_ready) {
                this.getDetections();
            }
        }
        // Frame
        if (jsonMsg.name == "SAMPLE") {
            if (jsonMsg.data && jsonMsg.data.image && jsonMsg.data.resolution && jsonMsg.data.count == 3) {
                jsonMsg.data.resolution = { width: jsonMsg.data.resolution[0], height: jsonMsg.data.resolution[1] };
                this.lastFrame = jsonMsg.data;
                this.sendImage()
            }
        }
        // Detection
        if (jsonMsg.name == "INVOKE") {
            if (jsonMsg.data && jsonMsg.data.boxes && jsonMsg.data.resolution && jsonMsg.data.image && jsonMsg.data.count == 3) {
                let detections = {};
                // Convert box format
                let boxes = [];
                for (let box of jsonMsg.data.boxes) {
                    if (box.length != 6) { console.log("Unexpected box format"); continue; }
                    let newBox = {
                        x: box[0],
                        y: box[1],
                        width: box[2],
                        height: box[3],
                        confidence: box[4],
                        class: ""+box[5],
                        color: "pink"
                    };
                    if (box[5] in this.classes) {
                        newBox.name = this.classes[box[5]].name;
                        newBox.color = this.classes[box[5]].color;
                    }
                    boxes.push(newBox);
                }
                detections.boxes = boxes;
                detections.image = jsonMsg.data.image;
                detections.resolution = { width: jsonMsg.data.resolution[0], height: jsonMsg.data.resolution[1] };
                this.lastFrame = detections;
                this.lastDetections = detections;
                this.sendImage()
            }
        }
    }

    async getFrame(){
        if(this.serial) {
            this.serial.write(`AT+SAMPLE=${this.frameBufferSize}?\r\n`); // Request this.frameBufferSize frames to empty frame buffer on camera side
        }
    }

    async getDetections(){
        if(this.serial) {
            this.serial.write(`AT+INVOKE=${this.frameBufferSize},0,0?\r\n`);
        }
    }
}
