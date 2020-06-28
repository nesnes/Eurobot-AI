'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const util = require('util');

module.exports = class Robotlink {
    constructor(app) {
        this.app = app;
        this.port = "";
        this.baudrate = 115200;
        this.connected = false;
        this.serial = null;
        this.buffer = "";
        this.inputMessages = [];
    }
    
    async init(){
        this.serial = new SerialPort('COM3', { baudRate: this.baudrate, autoOpen: false });
        //Connection loop
        let tries = 0;
        while(tries++<5){
            this.serial.open((e)=>{});
            await utils.sleep(500);
            if(this.serial.isOpen) break;
        }
        this.serial.on('data', (data)=>{
            for(let d of data)  this.onData(d);
        })
    }

    /*getDescription(){
        return {
            functions:{
            }
        }
    }*/

    async close(){
        //console.log("close robotlink")
        if(this.serial && this.serial.isOpen) this.serial.close()
        if(this.serial) this.serial.destroy()
        let timeout = 10*1000;
        let sleep = 10;
        while(timeout>0){
            if(this.serial && this.serial.destroyed) break;
            else{
                await utils.sleep(sleep);
                timeout-=sleep;
            }
        }
    }

    async sendMessage(address, message, timeout=1){
        //Send
        let msgOut = "s "+address+" "+message+"\r\n";
        console.log(msgOut)
        this.serial.write(msgOut);
        //Wait for answer
        let sleep = 0.02;
        while(timeout>0){
            timeout-=sleep;
            await utils.sleep(sleep);
            //Check input msgs
            for(let i=0;i<this.inputMessages.length;i++){
                let msg = this.inputMessages[i];
                let prefix = "r "+address+" ";
                if(msg.startsWith(prefix)){
                    this.inputMessages.splice(i,1);
                    let result = msg.substring(prefix.length);
                    if(result.includes("ERROR")) return false;
                    else return result;
                }
            }
        }
        return false;
    }

    onData(d){
        let c = String.fromCharCode(d);
        if(c=='\n' || c=='\r'){
            if(this.buffer.length){
                this.inputMessages.push(this.buffer)
                console.log(this.buffer)
                this.buffer = "";
            }
        }
        else this.buffer += c;
    }
}