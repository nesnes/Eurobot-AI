var dgram = require('dgram');
const os = require("os");

module.exports = class Multicast {
        constructor(app) {
        this.app = app;
        this.address = "224.0.255.255";
        this.port = 3000;
        this.socket = null;
        this.uid = "robot_" + (new Date().getTime());
    }

    init(){
        this.socket = dgram.createSocket({
          type: 'udp4',
          reuseAddr: true
        })
        //Check IP
        let hasNetwork = false;
        const interfaces = os.networkInterfaces();
        for (let key in interfaces) {
            let ips = interfaces[key].filter((iface) => {
                return iface.family === "IPv4" && iface.internal === false;
            }).map((iface) => { return iface.address; });
            for(let ip of ips){
                hasNetwork=true;
                this.app.logger.log("IP "+ip);
            }
        }
        if(!hasNetwork){
            this.app.logger.log("No Network for multicast");
            return;
        }
        
        this.socket.bind(this.port)
        
        this.socket.on('message', (msg, remote) => {
          this.onMessage(msg, remote);
        })
        this.socket.on("listening", () => {
          //this.socket.setBroadcast(true)
          this.socket.setMulticastTTL(128)
          this.socket.addMembership(this.address)
          console.log('Multicast listening . . . ')
        })
        this.socket.on('error', (exception) => {
            console.log('Multicast Error :', exception);
        });
    }
    
    async close(){
        try{
	        if(this.socket) this.socket.dropMembership(this.address);
        }catch(e){}
        try{
            if(this.socket) this.socket.close();
        }catch(e){}
    }
    
    onMessage(packet, remote){
        console.log("Multicast IN:", packet.toString());
        
        //Parse input message
        let msg = null;
        try{
            msg = JSON.parse(packet.toString());
        } catch(e){
            console.log("Failed to parse multicast message", ""+packet.toString())
            msg = null;
        }
        if(msg === null) return;
        if(!msg.command) return;
        if(!msg.uid || msg.uid == this.uid) return;
        delete msg.uid;
        if(msg.command == "removeComponent"){
            if(!msg.name) return;
            if(!msg.type) return;
            let cmp = this.app.map.getComponentByName(msg.name, msg.type);
            if(cmp) this.app.map.removeComponent(cmp)
            console.log("removing", msg.name, msg.type);
        }
        if(msg.command == "addComponent"){
            if(!msg.name || !msg.type || !msg.shape) return;
            delete msg.command;
            this.app.map.addComponent(msg);
        }
        if(msg.command == "updateComponent"){
            if(!msg.component || !msg.component.name || !msg.component.type || !msg.diff) return;
            delete msg.command;
            let cmp = this.app.map.getComponentByName(msg.component.name, msg.component.type);
            if(cmp) Object.assign(cmp, msg.diff);
            console.log("updating", msg.component.name, msg.component.type);
        }
    }
    
    sendRemoveComponent(parameters){
        if(!this.socket || !parameters.name) return false;
        let cmd = {
            uid: this.uid,
            command: "removeComponent",
            name: parameters.name,
            type: parameters.type || "",
            team: parameters.team || ""
        }
        const data = JSON.stringify(cmd);
        console.log("Multicast send", data);
        this.socket.send(data, 0, data.length, this.port, this.address);
        return true;
    }
    
    sendAddComponent(parameters){
        if(!this.socket || !parameters.name || !parameters.type || !parameters.shape) return false;
        let cmd = Object.assign({}, parameters);
        cmd.uid = this.uid;
        cmd.command = "addComponent";
        const data = JSON.stringify(cmd);
        console.log("Multicast send", data);
        this.socket.send(data, 0, data.length, this.port, this.address);
        return true;
    }
    
    sendUpdateComponent(parameters){
        if(!this.socket || !parameters.component || !parameters.diff) return false;
        let cmd = Object.assign({}, parameters);
        cmd.uid = this.uid;
        cmd.command = "updateComponent";
        const data = JSON.stringify(cmd);
        console.log("Multicast send", data);
        this.socket.send(data, 0, data.length, this.port, this.address);
        return true;
    }
}

/*setInterval(()=>{
  let message = 'Hi! ' + new Date().getTime()
  socket.send(message, 0, message.length, port, address)
}, 500)*/
