'use strict';
const utils = require("../utils")

delete require.cache[require.resolve('./modules/robotLink')]; //Delete require() cache
const Robotlink = require('./modules/robotLink');

delete require.cache[require.resolve('./modules/base')]; //Delete require() cache
const Base = require('./modules/base');

delete require.cache[require.resolve('./modules/baseSimulation')]; //Delete require() cache
const BaseSimulation = require('./modules/baseSimulation');

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
        if(!this.app.parameters.simulate){
            this.modules.robotLink = new Robotlink(app);
            this.modules.base = new Base(app);
            this.modules.controlPanel = new ControlPanel(app);
        }
        else{
            this.modules.base = new BaseSimulation(app);
        } 

        //Internal
        this.speed = 0; // m/s
        this.angleSpeed = 0; // deg/s
        this.movementAngle = 0;
        this.collisionAngle = 90; // angle used to check obstacles from lidar around movement direction
        this.collisionDistance = 0; // distance of objects to trigger a break (usually radius + ~100mm)
        this.slowdownAngle = 150; // angle used to check obstacles from lidar around movement direction
        this.slowdownDistance = 0; // distance of object to slow down the robot (greater than collisionDistance)
        this.slowdown = false;
        this.disableColisions = !!this.app.parameters.disableColisions;
        this.lastPositionUpdateTime=0;
        this.funnyActionTimeout = null;

    }
    
    async init(){
        if(this.modules.lidar){
            await this.modules.lidar.init().then(()=>{}).catch(()=>{
                this.app.logger.log("==> Lidar not connected");
                this.modules.lidar = null;
            })
        }
        if(this.modules.robotLink){
            await this.modules.robotLink.init().catch((e)=>{
                this.app.logger.log("==> RobotLink not connected",e);
                this.modules.robotLink = null;
            })
        }
        if(this.modules.base){
            await this.modules.base.init().catch((e)=>{
                this.modules.base = null;
            })
        } else this.modules.base = null;
        if(this.modules.controlPanel){
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
        if(this.app.parameters.simulate) this.app.logger.log("/!\\ RUNNING SIMULATION");
        //await this.initMatch();
        this.send();
        this.sendModules();
    }

    async close(){
        if(this.funnyActionTimeout){clearTimeout(this.funnyActionTimeout); this.funnyActionTimeout=null;}
        if(this.modules.lidar) await this.modules.lidar.close();
        if(this.modules.robotLink) await this.modules.robotLink.close();
    }

    async initMatch(){
        if(this.startPosition[this.team]){
            this.x = this.startPosition[this.team].x;
            this.y = this.startPosition[this.team].y;
            this.angle = this.startPosition[this.team].angle;
            if(this.modules.base) await this.modules.base.enableMove();
            if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle});
            if(this.modules.base) await this._updatePositionAndMoveStatus();
        }
        //Other specific init actions should be defined in year-dedicated robot file
        this.send();
    }

    async endMatch(){
        if(this.modules.base) await this.modules.base.break();
        if(this.modules.base) await this.modules.base.disableMove();
        //Other specific end actions should be defined in year-dedicated robot file
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
        if("getDescription" in this) payload.modules["robot"] = this.getDescription();
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
        await this.initMatch();
        if(!this.app.parameters.simulate && this.modules.controlPanel){
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
                        await this.initMatch();
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

    async startFunnyAction(parameters){
        this.funnyActionTimeout = setTimeout(()=>{
            if(this.modules.arm) this.modules.arm.openFlag();
            this.addScore(10);
        }, 99*1000);
        return true;
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
        let path = [];
        if(parameters.preventPathFinding) {
            //path.push([this.x, this.y])
            path.push([parameters.x, parameters.y])
        }
        else {
            path = this.app.map.findPath(this.x, this.y, parameters.x, parameters.y);
            path.shift();//remove initial position
        }
        if(path.length==0){
            this.app.logger.log(" Error, empty path to "+parameters.x+" "+parameters.y);
            return false;
        }
        if(this.modules.base){
            let startAngle = this.angle;
            let dangle = startAngle-parameters.angle;
            let paramPath = []
            let i=1;
            for(let p of path){
                let angle = startAngle-(dangle*(i++/(path.length)))
                paramPath.push({x:p[0], y:p[1], angle:angle, speed:parameters.speed});
            }
            return await this.moveAlongPath({path:paramPath})
            //return await this._performPath(path, parameters.x, parameters.y, parameters.angle, parameters.speed)
        }
        return false
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

    async rotateToAngle(parameters){
        let angle = parameters.angle;
        return await this.moveAtAngle({
            angle: angle,
            distance: 0,
            endAngle: angle,
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
            speed:parameters.speed,
            preventPathFinding: true
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

    isMovementPossible(x=NaN,y=NaN){
        if(!isNaN(x) && !isNaN(y)) this._updateMovementAngle(x,y);
        if(!this.modules.lidar) return true;
        if(this.disableColisions) return true;
        let collisionCount = 0;
        let slowdownCount = 0;
        let angleA = utils.normAngle(this.movementAngle-this.collisionAngle/2);
        let angleB = utils.normAngle(this.movementAngle+this.collisionAngle/2);
        console.log("Detect between", angleA, angleB)
        for(let measure of this.modules.lidar.measures){
            //Check for collisions
            let measureAngle = utils.normAngle(measure.a+this.angle);
            //let inCollisionRange = (angleA<=measureAngle && measureAngle<=angleB)
            let inCollisionRange = utils.angleInRange( angleA, angleB, measureAngle );
            if(measure.d>0 && measure.d<this.collisionDistance){
                console.log("angleInRange(", angleA, angleB, measureAngle, ") =", inCollisionRange)
            }
            if(inCollisionRange && measure.d>0 && measure.d<this.collisionDistance){
                collisionCount++
                if(collisionCount>=3){
                    //Add obstacle on map
                    let obstacleRadius = 150;
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
        this.slowdown = slowdownCount>=3;
        return true
    }

    

    /*async _simulatePath(path, x, y, angle, speed){
        let startAngle = this.angle;
        let dangle = startAngle-angle;
        var success = true;
        for(let i=1;i<path.length;i++){
            if(!this.isMovementPossible(path[i][0],path[i][1])){
                success = false;
                break;
            }
            success = success && await this._simulateMovement(
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
    }*/

    async _updatePositionAndMoveStatus(){
        let moveStatus = "end";
        let status = await this.modules.base.getStatus();
        //console.log(status)
        if(status && typeof status === "object"){
            moveStatus = status.status;
            this.x = status.x;
            this.y = status.y;
            this.angle = status.angle;
            this.speed = status.speed;
        }
        this.send();
        return moveStatus;
    }

    async _performMovement(x, y, angle, speed){
        let moveSpeed = this.slowdown?0.1:speed;
        let sleep = 100;
        let success = true;
        let moveStatus = "";
        this.app.logger.log(`-> move coordinates ${x} ${y} ${angle} ${speed}`);

        //Update position and check obstacles
        await this._updatePositionAndMoveStatus();
        if(!this.isMovementPossible(x,y)) return false;
        if(!this.modules.base){
            this._updatePosition(x,y,angle, true);
            return true;
        }

        //Start the move
        success = success && !!await this.modules.base.moveXY({x:x, y:y, angle:angle, speed:speed})
        do{
            await utils.sleep(sleep);
            if(this.app.intelligence.hasBeenRun && this.app.intelligence.isMatchFinished()) success = false;
            moveSpeed = this.slowdown?0.1:speed;
            if(!this.isMovementPossible(x,y)) success = false;
            moveStatus = await this._updatePositionAndMoveStatus();
            //console.log(success, moveStatus, moveSpeed)
        } while(success && moveStatus && moveStatus.includes("run"))
        if(!success) this.modules.base.break();
        //this._updatePosition(x,y,angle, true);
        this.send();
        return success;
    }

    async moveAlongPath(params){
        let path=params.path;
        let sleep = 100;
        var success = true;
        if(!path.length) return false;
        if(this.modules.base && await this.modules.base.supportPath()){
            //Update position and check obstacles
            await this._updatePositionAndMoveStatus();
            if(!this.isMovementPossible(path[0].x,path[0].y)) return false;

            //Start the move
            let moveStatus = "";
            success = !!await this.modules.base.movePath({path:path})
            console.log("movePath", success, {path:path})
            do{
                await utils.sleep(sleep);
                if(this.app.intelligence.hasBeenRun && this.app.intelligence.isMatchFinished()) success = false;
                //moveSpeed = this.slowdown?0.1:speed;
                if(!this.isMovementPossible()) success = false;
                //console.log("move possible", success)
                moveStatus = await this._updatePositionAndMoveStatus();
                console.log(success, moveStatus, path)
            } while(success && moveStatus && moveStatus.includes("run"))
            if(!success) this.modules.base.break();
        }
        else {
            //Not path support on base, run sections one by one
            for(let i=0;i<path.length;i++){
                this.app.logger.log(`-> move path ${i+1}/${path.length}`);
                success = success && await this._performMovement(path[i].x, path[i].y, path[i].angle, path[i].speed)
                if(!success) break
            }
        }
        //if(success) this._updatePosition(x,y,angle, true);
        this.send();
        return success
    }
}
