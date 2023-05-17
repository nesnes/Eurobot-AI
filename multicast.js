var dgram = require('dgram');

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
	if(this.socket) this.socket.dropMembership(this.address);
        if(this.socket) this.socket.close();
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
            /*{
                name: "Detected Obstacle",
                type: "obstacle",
                isSolid: true,
                shape: { type: "circle", x:x2, y:y2, radius: obstacleRadius, color: "orange" },
                timeout: obstacleTimeout
            }*/
        }
    }
    
    sendRemoveComponent(parameters){
        if(!parameters.name) return false;
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
        if(!parameters.name || !parameters.type || !parameters.shape) return false;
        let cmd = Object.assign({}, parameters);
        cmd.uid = this.uid;
        cmd.command = "addComponent";
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
