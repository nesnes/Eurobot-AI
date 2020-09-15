'use strict';
const utils = require("../utils")

delete require.cache[require.resolve('./modules/robotLink')]; //Delete require() cache
const Robotlink = require('./modules/robotLink');

delete require.cache[require.resolve('./modules/base')]; //Delete require() cache
const Base = require('./modules/base');

delete require.cache[require.resolve('./modules/controlPanel')]; //Delete require() cache
const ControlPanel = require('./modules/controlPanel');

module.exports = class Robot {
    constructor(app) {
        this.app = app;
        this.name = "";
        this.team = "";
        if(this.app.map && this.app.map.teams && this.app.map.teams[0])
            this.team = this.app.map.teams[0];
        this.startPosition = {
            blue:{x:0,y:0,angle:0},
            yellow:{x:0,y:0,angle:0}
        }
        this.x = 0; // mm
        this.y = 0; // mm
        this.angle = 0; // deg
        this.score = 0;
        this.variables = {};
        //this.color = "";
        this.radius = 0; // mm
        this.modules = {
            robotLink: null,
            lidar: null,
            base: null
        };
        
        let robotConnected = true;
        if(robotConnected) this.modules.robotLink = new Robotlink(app);
        this.modules.base = new Base(app)
        this.modules.controlPanel = new ControlPanel(app)

        //Internal
        this.speed = 0; // m/s
        this.angleSpeed = 0; // deg/s
        this.movementAngle = 0;
        this.collisionAngle = 90; // angle used to check obstacles from lidar around movement direction
        this.collisionDistance = 0; // distance of objects to trigger a break (usually radius + ~100mm)
        this.slowdownAngle = 120; // angle used to check obstacles from lidar around movement direction
        this.slowdownDistance = 0; // distance of object to slow down the robot (greater than collisionDistance)
        this.slowdown = false;
        this.lastPositionUpdateTime=0;

    }
    
    async init(){
        if(this.modules.lidar){
            await this.modules.lidar.init().then(()=>{}).catch(()=>{
                console.log("==> Lidar not connected");
                this.modules.lidar = null;
            })
        }
        if(this.modules.robotLink){
            await this.modules.robotLink.init().catch((e)=>{
                console.log("==> RobotLink not connected",e);
                this.modules.robotLink = null;
            })
        }
        if(this.modules.base && this.modules.robotLink){
            await this.modules.base.init().catch((e)=>{
                this.modules.base = null;
            })
        } else this.modules.base = null;
        if(this.modules.controlPanel && this.modules.robotLink){
            await this.modules.controlPanel.init().catch((e)=>{
                this.modules.controlPanel = null;
            })
        } else this.modules.controlPanel = null;
        if(this.modules.lidarLocalisation){
            await this.modules.lidarLocalisation.init().catch((e)=>{
                this.modules.lidarLocalisation = null;
            })
        }
        if(!this.modules.robotLink) this.app.logger.log("/!\\ ROBOT NOT CONNECTED");
        this.initPosition();
        this.send();
        this.sendModules();
    }

    async close(){
        if(this.modules.lidar) await this.modules.lidar.close();
        if(this.modules.robotLink) await this.modules.robotLink.close();
    }

    initPosition(){
        if(this.startPosition[this.team]){
            this.x = this.startPosition[this.team].x;
            this.y = this.startPosition[this.team].y;
            this.angle = this.startPosition[this.team].angle;
        }
    }

    send(){
        let payload = {
            name: this.name,
            x: this.x,
            y: this.y,
            angle: this.angle,
            score: this.score,
            variables: this.variables,
            team: this.team,
            radius: this.radius,
            speed: this.speed,
            angleSpeed: this.angleSpeed,
            movementAngle: this.movementAngle,
            collisionAngle: this.collisionAngle,
            collisionDistance: this.collisionDistance,
            slowdownAngle: this.slowdownAngle,
            slowdownDistance: this.slowdownDistance,
            slowdown: this.slowdown
        }
        this.app.mqttServer.publish({
            topic: '/robot',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    sendModules(){
        let payload = {
            modules: {}
        }
        for(const module in this.modules){
            if(this.modules[module] && "getDescription" in this.modules[module])
                payload.modules[module] = this.modules[module].getDescription();
        }
        this.app.mqttServer.publish({
            topic: '/robot/modules',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    async run(action) {
        this.app.logger.log(" ->" + action.name);
        if(action.method in this){
            let result = await this[action.method](action.parameters)
            this.send()
            return result
        }
        else{
            this.app.logger.log("  -> No method found: "+ action.method);
            return false;
        }
    }

    async setScore(parameters){
        if(typeof parameters === 'object' && parameters && "score" in parameters) this.score = parameters.score; //object as input
        if(typeof parameters === 'number' ) this.score = parameters; //number as input
        if(this.modules.controlPanel){
            await this.modules.controlPanel.setScore({score:this.score});
        }
        return true;
    }
    async addScore(parameters){ 
        let score = this.score;
        if(typeof parameters === 'object' && parameters && "score" in parameters) score += parameters.score; //object as input
        if(typeof parameters === 'number' ) score += parameters; //number as input
        return await this.setScore({score:score})
    };
    
    async waitForStart(parameters){
        this.setScore(0)
        let matchStopped = false;
        if(this.modules.controlPanel){
            let state = "waiting" // waiting / ready / go
           
            //Wait for the starter to be positioned and pulled
            let changed = false;
            do {
                let status = await this.modules.controlPanel.getColorStart();
                if(status){
                    if(state=="waiting" && !status.start){
                        state = "ready";
                        changed = true;
                    }
                    if(state == "ready" && status.start){
                        state = "go"
                        changed = true;
                    }
                    let color = parseInt(""+status.color);
                    if(this.app.map && this.app.map.teams && this.team != this.app.map.teams[color]){
                        this.team = this.app.map.teams[color];
                        this.initPosition();
                        changed = true;
                    }
                    if(changed){
                        this.send();
                        changed = false;
                    }
                }
                await utils.sleep(250);
                matchStopped = this.app.intelligence.stopExecution;
                if(!matchStopped){
                    this.app.intelligence.startMatchTimer();//Restarts Match timer
                }
            } while(state!="go" && !matchStopped);
        }
        if(!matchStopped) this.app.logger.log("GO");
        this.send();
        return true
    }

    async moveToComponent(parameters){

        let component = this.app.map.getComponent(parameters.component, this.team);
        if(component === null){
            this.app.logger.log("  -> Component not found "+parameters.component);
            return false
        }
        
        this.app.logger.log("  -> moving to "+component.name);
        let success = false
        if("access" in component){
            success = await this.moveToPosition({
                x:component.access.x,
                y:component.access.y,
                angle:component.access.angle,
                speed:parameters.speed
            });
        }
        this.send();
        //await utils.sleep(500);
        return success
    }

    async moveToPosition(parameters){
        let path = this.app.map.findPath(this.x, this.y, parameters.x, parameters.y);
        if(path.length==0) return false
        return await this._simulatePath(path, parameters.x, parameters.y, parameters.angle, parameters.speed)
    }

    async moveSidway(parameters){
        let angle = parameters.side=="left"?-90:90;
        angle = utils.normAngle(angle+this.angle);
        return await this.moveAtAngle({
            angle: angle,
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.angle,
            speed:parameters.speed
        });
    }

    async moveForward(parameters){
        return await this.moveAtAngle({
            angle: this.angle,
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.angle,
            speed:parameters.speed
        });
    }
    async moveBackward(parameters){
        return await this.moveAtAngle({
            angle: utils.normAngle(this.angle+180),
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.angle,
            speed:parameters.speed
        });
    }

    async moveAtAngle(parameters){
        let angle = parameters.angle;
        let rayAngleRad = utils.normAngle(angle)*(Math.PI/180);
        let raySin = Math.sin(rayAngleRad);
        let rayCos = Math.cos(rayAngleRad);
        let x1 = parameters.distance;
        let y1 = 0;
        let x2 = x1*rayCos - y1*raySin;
        let y2 = y1*rayCos + x1*raySin;
        x2 += this.x;
        y2 += this.y;
        return await this.moveToPosition({
            x:x2,
            y:y2,
            angle: ("endAngle" in parameters)?parameters.endAngle:this.angle,
            speed:parameters.speed
        });
    }

    _updatePosition(x,y,angle,reset=false){
        let now = new Date().getTime();
        if(this.lastPositionUpdateTime!=0 && !reset){
            let dt = now - this.lastPositionUpdateTime;
            let dx = this.x-x;
            let dy = this.y-y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            this.speed = (distance/1000) / (dt/1000); // m/s
            let da = (this.angle+360) - (angle+360);
            this.angleSpeed = da / (dt/1000); // deg/s
            if(dx!=0 || dy!=0)
                this._updateMovementAngle(x,y);
        }
        else{
            this.speed = 0;
            this.angleSpeed = 0;
        }
        this.x = x;
        this.y = y;
        this.angle =  utils.normAngle(angle);
        this.lastPositionUpdateTime = now;
    }

    _updateMovementAngle(x,y){
        let dx = this.x-x;
        let dy = this.y-y;
        this.movementAngle =  utils.normAngle(Math.atan2(dy,dx)*(180/Math.PI)+180);
    }

    isMovementPossible(x,y){
        this._updateMovementAngle(x,y);
        if(!this.modules.lidar) return true;
        let collisionCount = 0;
        let slowdownCount = 0;
        for(let measure of this.modules.lidar.measures){
            //Check for collisions
            let inCollisionRange = utils.angleInRange(
                utils.normAngle(this.movementAngle-this.collisionAngle/2),
                utils.normAngle(this.movementAngle+this.collisionAngle/2),
                utils.normAngle(measure.a+this.angle)
            );
            if(inCollisionRange && measure.d>0 && measure.d<this.collisionDistance){
                collisionCount++
                if(collisionCount>=4){
                    //Add obstacle on map
                    let obstacleRadius = 150
                    let obstacleTimeout = 2000; //will be removed from map in N milliseconds
                    this.app.logger.log("collision detected");
                    let rayAngleRad = utils.normAngle(measure.a+this.angle)*(Math.PI/180);
                    let raySin = Math.sin(rayAngleRad);
                    let rayCos = Math.cos(rayAngleRad);
                    let x1 = Math.max(this.radius+obstacleRadius+this.app.map.pathResolution/2, measure.d);
                    let y1 = 0;
                    let x2 = x1*rayCos - y1*raySin;
                    let y2 = y1*rayCos + x1*raySin;
                    x2 += this.x;
                    y2 += this.y;
                    this.app.map.addComponent({
                        name: "Detected Obstacle",
                        type: "obstacle",
                        isSolid: true,
                        shape: { type: "circle", x:x2, y:y2, radius: obstacleRadius, color: "orange" },
                        timeout: obstacleTimeout
                    })
                    return false;
                }
            }
            //Check for slowdowns
            let inSlowdownRange = utils.angleInRange(
                utils.normAngle(this.movementAngle-this.slowdownAngle/2),
                utils.normAngle(this.movementAngle+this.slowdownAngle/2),
                utils.normAngle(measure.a+this.angle)
            );
            if(inSlowdownRange && measure.d>0 && measure.d<this.slowdownDistance) slowdownCount++
        }
        this.slowdown = slowdownCount>=4;
        return true
    }

    async _simulateMovement(x, y, angle, speed){
        let startX = this.x;
        let startY = this.y;
        let startAngle = this.angle;
        let dx = startX-x;
        let dy = startY-y;
        let dangle = startAngle-angle;
        let distance = Math.sqrt(dx*dx + dy*dy);
        let moveSpeed = this.slowdown?0.1:speed;
        let sleep = 100;
        let distanceDone = 0;
        while(distanceDone<distance){
            if(this.app.intelligence.isMatchFinished()) return false;
            moveSpeed = this.slowdown?0.1:speed;
            distanceDone += (sleep/1000)*moveSpeed*1000
            let ratio = distanceDone/distance;
            if(ratio>1) ratio = 1;
            let x = startX-(dx*ratio);
            let y = startY-(dy*ratio);
            if(!this.isMovementPossible(x,y))
                return false;
            let angle = startAngle-(dangle*ratio);
            this._updatePosition(x,y,angle);
            this.send();
            await utils.sleep(sleep);
        }
        this._updatePosition(x,y,angle, true);
        this.send();
        return true;
    }

    async _simulatePath(path, x, y, angle, speed){
        let startAngle = this.angle;
        let dangle = startAngle-angle;
        var success = true;
        for(let i=1;i<path.length;i++){
            if(!this.isMovementPossible(path[i][0],path[i][1])){
                success = false;
                break;
            }
            success &= await this._simulateMovement(
                path[i][0],
                path[i][1],
                startAngle-(dangle*(i/(path.length-1))),
                speed
            )
            if(!success) break
        }
        if(success) this._updatePosition(x,y,angle, true);
        this.send();
        return success
    }
}
