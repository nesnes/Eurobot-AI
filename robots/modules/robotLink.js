'use strict';
const utils = require("../../utils")
const SerialPort = require('serialport')
const util = require('util');

module.exports = class Robotlink {
    constructor(app, id="") {
        this.app = app;
        this.id = id;
        this.port = "";
        this.baudrate = 115200;
        this.connected = false;
        this.serial = null;
        this.buffer = "";
        this.inputMessages = [];
        this.useAddressing = false;
        if(process.platform=="linux") this.portList = ["/dev/ttyACM0","/dev/ttyACM1"/*,"/dev/ttyAMA0","/dev/ttyAMA1"*/]; //Raspberry/Linux
        if(process.platform=="darwin") this.portList = ["/dev/cu.usbmodem80144101"]; //Mac
        if(process.platform=="win32") this.portList = [""]; //Windows
    }
    
    async init(){
        //this.serial = new SerialPort('COM9', { baudRate: this.baudrate, autoOpen: false });
        console.log("Robotlink is searching for", this.id);
        // Try to connect to each port, checking for ID
        for(let path of this.portList)
        {
            //console.log("Checcking", path);
            if(this.serial && this.serial.isOpen) this.serial.close()
            if(this.serial) this.serial.destroy()
            this.port = path;
            this.serial = new SerialPort(this.port, { baudRate: this.baudrate, autoOpen: false });
            //Connection loop
            let tries = 0;
            while(tries++<5){
                this.serial.open((e)=>{});
                await utils.sleep(100);
                if(this.serial.isOpen) break;
            }
            if(this.serial.isOpen) {
                this.serial.on('data', (data)=>{
                    for(let d of data)  this.onData(d);
                })
                if(this.id != ""){
                    let answer = await this.sendMessage(0, "id", 1);
                    console.log("answer from", this.port, ":", answer);
                    if(answer === this.id){
                        console.log("Link", this.id, "connected to", this.port)
                        this.connected = true;
                        break;
                    }
                }
                else{
                    this.connected = true;
                }
            }
        }
    }

    /*getDescription(){
        return {
            functions:{
            }
        }
    }*/

    async close(){
        console.log("close robotlink", this.id);
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
        this.serial = null;
        this.connected = false;
    }

    async sendMessage(address, message, timeout=1){
        //this.inputMessages.length = 0;
        //Send
        let msgOut = "";
        if(this.useAddressing) msgOut += "s "+address+" ";
        msgOut += message+"\r\n";
        //console.log(msgOut)
        this.serial.write(msgOut);
        //Wait for answer
        let sleep = 0.005;
        while(timeout>0){
            timeout-=sleep;
            await utils.sleep(sleep*1000);
            //Check input msgs
            for(let i=0;i<this.inputMessages.length;i++){
                let msg = this.inputMessages[i];
                let prefix = "r "+address+" ";
                if(msg.startsWith(prefix) || !this.useAddressing){
                    this.inputMessages.splice(i,1);
                    let result = this.useAddressing ? msg.substring(prefix.length) : msg;
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
                this.buffer = "";
            }
        }
        else this.buffer += c;
    }
}