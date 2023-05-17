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
            yellow:{x:0,y:0,angle:0},
            violet:{x:0,y:0,angle:0}
        }
        this.startPositionSelected = false;
        this.x = 1500; // mm
        this.y = 1000; // mm
        this.angle = 0; // deg
        this.lastTarget = {x:0, y:0, angle:0};
        this.score = 0;
        this.variables = {};
        //this.color = "";
        this.radius = 0; // mm
        this.modules = {
            //robotLink: null,
            lidar: null,
            base: null
        };
        
        let robotConnected = true;
        if(!this.app.parameters.simulate){
            //this.modules.robotLink = new Robotlink(app);
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
        this.collisionDistance = 200; // distance of objects to trigger a break (usually radius + ~100mm)
        this.slowdownAngle = 150; // angle used to check obstacles from lidar around movement direction
        this.slowdownDistance = 0; // distance of object to slow down the robot (greater than collisionDistance)
        this.slowdownDistanceOffset = 200; // multiplied by speed in m/s and added to slowdownDistance
        this.slowdown = false;
        this.slowDownSpeed = 0.3;
        this.disableColisions = !!this.app.parameters.disableColisions;
        this.disableLocalisation = !!this.app.parameters.disableLocalisation;
        this.lastPositionUpdateTime=0;
        this.lastPositionMulticastTime=0;
        this.funnyActionTimeout = null;

    }
    
    async init(){
        if(this.modules.lidar){
            await this.modules.lidar.init().then(()=>{}).catch(()=>{
                this.app.logger.log("==> Lidar not connected");
                this.modules.lidar = null;
            })
        }
        
        if(this.modules.lidarLoc){
            await this.modules.lidarLoc.init().then(()=>{}).catch(()=>{
                this.app.logger.log("==> LidarLoc not connected");
                this.modules.lidarLoc = null;
            })
        }
        
        /*if(this.modules.robotLink){
            await this.modules.robotLink.init().catch((e)=>{
                this.app.logger.log("==> RobotLink not connected",e);
                this.modules.robotLink = null;
            })
        }*/
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
        //if(!this.modules.robotLink) this.app.logger.log("/!\\ ROBOT NOT CONNECTED");
        if(this.app.parameters.simulate) this.app.logger.log("/!\\ RUNNING SIMULATION");
        //await this.initMatch();
        this.send();
        this.sendModules();
    }

    async close(){
        if(this.funnyActionTimeout){clearTimeout(this.funnyActionTimeout); this.funnyActionTimeout=null;}
        if(this.modules.lidar) await this.modules.lidar.close();
        if(this.modules.lidarLoc) await this.modules.lidarLoc.close();
        if(this.modules.lidarLocalisation) await this.modules.lidarLocalisation.close();
        //if(this.modules.robotLink) await this.modules.robotLink.close();
        if(this.modules.base) await this.modules.base.close();
        if(this.modules.controlPanel) await this.modules.controlPanel.close();
    }

    async selectStartPosition(preset){
        this.startPositionSelected = true;
        if('x' in preset && 'y' in preset && 'angle' in preset){
            this.x = preset.x;
            this.y = preset.y;
            this.angle = preset.angle;
            if(this.modules.arm && await this.modules.arm.supportPosition()) await this.modules.arm.setPosition({x:this.x, y:this.y, angle:this.angle});
            if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:1});
            if(this.modules.base) await this._updatePositionAndMoveStatus(true);
        }
        if('team' in preset){
            this.team = preset.team;
        }
        this.send();
    }

    async initMatch(){
        this.setScore(0);
        if(!this.startPositionSelected && this.startPosition[this.team]){
            this.x = this.startPosition[this.team].x;
            this.y = this.startPosition[this.team].y;
            this.angle = this.startPosition[this.team].angle;
        }
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:1});
        if(this.modules.arm && await this.modules.arm.supportPosition()) await this.modules.arm.setPosition({x:this.x, y:this.y, angle:this.angle});
        //if(this.modules.base) await this.modules.base.enableMove();
        if(this.modules.base) await this._updatePositionAndMoveStatus(true);
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
            slowdownDistance: this.slowdownDistance+(Math.abs(this.speed)*this.slowdownDistanceOffset),
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
        this.app.logger.log("Score: "+this.score);
        return true;
    }
    async addScore(parameters){ 
        let score = this.score;
        if(typeof parameters === 'object' && parameters && "score" in parameters) score += parameters.score; //object as input
        if(typeof parameters === 'number' ) score += parameters; //number as input
        return await this.setScore({score:score})
    };
    
    async sleep(parameters){
        if(!("duration" in parameters)) return false;
        await utils.sleep(parameters.duration);
        return true;
    };
    
    async waitForTime(parameters){
        if(!("time" in parameters)) return false;
        while(this.app.intelligence.currentTime < parameters.time){
            await utils.sleep(100);
        }
        return true;
    };
    
    async waitForStart(parameters){
        let matchStopped = false;
        if(!this.app.parameters.simulate && this.modules.controlPanel){
            let state = "waiting" // waiting / ready / go
            let status = await this.modules.controlPanel.getStart();
            /*if(this.app.map && this.app.map.teams)
                this.team = this.app.map.teams[status.color];*/
            await this.initMatch();
            this.send();
            //Wait for the starter to be positioned and pulled
            let changed = false;
            do {
                await this.findLocalisation({});
                status = await this.modules.controlPanel.getStart();
                console.log("status", status, "state", state);
                if(status){
                    if(state=="waiting" && !status.start){
                        state = "ready";
                        changed = true;
                    }
                    if(state == "ready" && status.start){
                        state = "go"
                        changed = true;
                    }
                    /*let color = parseInt(""+status.color);
                    if(this.app.map && this.app.map.teams && this.team != this.app.map.teams[color]){
                        this.team = this.app.map.teams[color];
                        await this.initMatch();
                        changed = true;
                    }*/
                    if(changed){
                        this.send();
                        changed = false;
                    }
                }
                await utils.sleep(150);
                matchStopped = this.app.intelligence.stopExecution;
                if(!matchStopped){
                    this.app.intelligence.startMatchTimer();//Restarts Match timer
                }
            } while(state!="go" && !matchStopped);
        }
        else{
            await this.initMatch();
        }
        if(!matchStopped) this.app.logger.log("GO");
        this.send();
        return true
    }

    async startFunnyAction(parameters){
        this.funnyActionTimeout = setTimeout(()=>{
            if(this.modules.arm) this.modules.arm.openFlag();
            
            if(this.modules.arm) this.modules.arm.disablePump({name:"LEF"});
            if(this.modules.arm) this.modules.arm.disablePump({name:"RIG"});
            if(this.modules.arm) this.openSideArms({name:"ACA", wait:false});
            if(this.modules.arm) this.openSideArms({name:"ACC", wait:false});
            if(this.modules.arm) this.openSideArms({name:"ABA", wait:false});
            if(this.modules.arm) this.openSideArms({name:"ABB", wait:false});
            if(this.modules.arm) this.openSideArms({name:"BCB", wait:false});
            if(this.modules.arm) this.openSideArms({name:"BCC", wait:false});
            this.addScore(10);
        }, 99*1000);
        return true;
    }
    
    async setVariable(parameters){
        if(("name" in parameters) && (parameters.name in this.variables)){
            let name = parameters.name;
            let newVar = Object.assign({}, this.variables[name], parameters);
            delete newVar.name;
            this.variables[name] = newVar;
        }
        this.send();
        return true;
    }
    
    async findLocalisation(parameters){
        if(this.disableLocalisation) return false;
        let foundPosition = null;
        if(this.modules.lidarLocalisation){
            let count = parameters.count||2;
            for(let i=0;i<count;i++){
                let found = await this.modules.lidarLocalisation.resolvePosition();
                if(found) {
                    foundPosition = {
                        x: this.modules.lidarLocalisation.x,
                        y: this.modules.lidarLocalisation.y,
                        angle: this.modules.lidarLocalisation.angle
                    };
                }
            }
        }
        else if(this.modules.arm && await this.modules.arm.supportPosition()){
            foundPosition = await this.modules.arm.getPosition();
            if(foundPosition && !foundPosition.isNew) foundPosition = null;
        }
        if(foundPosition){
            //console.log("Found position", foundPosition);
            this._updatePosition(foundPosition.x, foundPosition.y, foundPosition.angle);
            let resetTarget = 1;
            if(parameters && ("resetTarget" in parameters) && !parameters.resetTarget) resetTarget = 0;
            if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:resetTarget});
            this.send();
        }
        return true;
    }

    async moveToComponent(parameters){
        let teamColor = parameters.color||this.team;
        let component = this.app.map.getComponent(parameters.component, teamColor);
        if(component === null){
            this.app.logger.log("  -> Component not found "+parameters.component);
            return false
        }
        
        this.app.logger.log("  -> moving to "+component.name);
        let success = false
        // Find best access point
        let accessList = []
        if("access" in component) accessList.push(component.access)
        if(!parameters.preventOtherAccess && "otherAccess" in component) accessList.push(...component.otherAccess)
        let access = null;
        let minLength = 99999999999;
        for(let acc of accessList){
            let path = this.app.map.findPath(this.x, this.y, acc.x, acc.y);
            if(path.length<2) continue;
            if(!this.isMovementPossible(path[1][0], path[1][1])) continue;
            let pathLength = this.app.map.getPathLength(path);
            if(pathLength<minLength){
                minLength = pathLength;
                access = acc;
            }
        }
        if(access == null) return false;
        // Move to access point
        let angle = access.angle;
        if("angle" in parameters) angle = parameters.angle;
        let offsetX = parameters.offsetX||0;
        let offsetY = parameters.offsetY||0;
        success = await this.moveToPosition({
            x:access.x + offsetX,
            y:access.y + offsetY,
            angle:angle,
            speed:parameters.speed,
            nearDist:parameters.nearDist||0,
            nearAngle:parameters.nearAngle||0,
            preventLocalisation: parameters.preventLocalisation
        });
        this.send();
        //await utils.sleep(500);
        return success
    }
    
    async moveCorrectPosition(parameters){
        let wait = 300;
        if("wait" in parameters) wait = parameters.wait;
        await this.findLocalisation({resetTarget:0});
        await utils.sleep(wait);
        await this.findLocalisation({resetTarget:0});
        let success = await this.moveToPosition({
            x: this.lastTarget.x,
            y: this.lastTarget.y,
            angle: this.lastTarget.angle,
            speed: 0.3,
            nearDist:0,
            nearAngle:0,
            preventLocalisation: false
        });
        await this.findLocalisation({resetTarget:0});
        return success;
    }

    async moveToPosition(parameters){
        let preventLocalisation = parameters.preventLocalisation || false;
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
                paramPath.push({x:p[0], y:p[1], angle:angle, speed:parameters.speed, nearDist:parameters.nearDist, nearAngle:parameters.nearAngle});
            }
            return await this.moveAlongPath({path:paramPath, preventLocalisation})
            //return await this._performPath(path, parameters.x, parameters.y, parameters.angle, parameters.speed)
        }
        return false
    }

    async moveSideway(parameters){
        let angle = parameters.side=="left"?-90:90;
        angle = utils.normAngle(angle+this.lastTarget.angle);
        return await this.moveAtAngle({
            angle: angle,
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.lastTarget.angle,
            speed: parameters.speed,
            nearDist: parameters.nearDist,
            nearAngle: parameters.nearAngle,
            preventLocalisation: parameters.preventLocalisation
        });
    }

    async moveForward(parameters){
        return await this.moveAtAngle({
            angle: this.lastTarget.angle,
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.lastTarget.angle,
            speed:parameters.speed,
            nearDist: parameters.nearDist,
            nearAngle: parameters.nearAngle,
            preventLocalisation: parameters.preventLocalisation
        });
    }
    
    

    async moveRepositionning(parameters){
        if(! ("distance" in parameters)) return false;
        if(! ("speed" in parameters)) return false;
        let moveAngle = this.lastTarget.angle;
        if("moveAngle" in parameters) moveAngle = parameters.moveAngle;
        let status = await this.moveAtAngle({
            angle: moveAngle,
            distance: parameters.distance,
            endAngle: this.lastTarget.angle,
            speed: parameters.speed,
            preventLocalisation: true
        });
        if("newX" in parameters) this.x = parameters.newX
        if("newY" in parameters) this.y = parameters.newY;
        if("newAngle" in parameters) this.angle = parameters.newAngle;
        console.log("reposition", this.x, this.y, this.angle, parameters)
        this.lastTarget.x = this.x;
        this.lastTarget.y = this.y;
        this.lastTarget.angle = this.angle;
        if(this.modules.arm && await this.modules.arm.supportPosition()) await  this.modules.arm.setPosition({x:this.x, y:this.y, angle:this.angle});
        if(this.modules.base) await this.modules.base.setPosition({x:this.x, y:this.y, angle:this.angle, resetTarget:1});
        if(this.modules.base) await this._updatePositionAndMoveStatus(true);
        return true;
    }
    
    async moveBackward(parameters){
        return await this.moveAtAngle({
            angle: utils.normAngle(this.lastTarget.angle+180),
            distance: parameters.distance,
            endAngle: ("angle" in parameters)?parameters.angle:this.lastTarget.angle,
            speed:parameters.speed,
            nearDist: parameters.nearDist,
            nearAngle: parameters.nearAngle,
            preventLocalisation: parameters.preventLocalisation
        });
    }

    async rotateToAngle(parameters){
        let angle = parameters.angle;
        return await this.moveAtAngle({
            angle: angle,
            distance: 0,
            endAngle: angle,
            speed:parameters.speed,
            nearDist: 0,
            nearAngle: parameters.nearAngle,
            preventLocalisation: parameters.preventLocalisation
        });
    }

    async moveAtAngle(parameters){
        console.log("move angle from", this.x, this.y, "at", parameters.angle)
        let angle = parameters.angle;
        let rayAngleRad = utils.normAngle(angle)*(Math.PI/180);
        let raySin = Math.sin(rayAngleRad);
        let rayCos = Math.cos(rayAngleRad);
        let x1 = parameters.distance;
        let y1 = 0;
        let x2 = x1*rayCos - y1*raySin;
        let y2 = y1*rayCos + x1*raySin;
        let offsetX = parameters.offsetX||0;
        let offsetY = parameters.offsetY||0;
        x2 += this.lastTarget.x + offsetX;
        y2 += this.lastTarget.y + offsetY;
        let endAngle = ("endAngle" in parameters)?parameters.endAngle:this.lastTarget.angle;
        console.log("move angle to", x2, y2, "at", endAngle)
        this.lastTarget.x = x2;
        this.lastTarget.y = y2;
        this.lastTarget.angle = endAngle;
        return await this.moveToPosition({
            x:x2,
            y:y2,
            angle: endAngle,
            speed:parameters.speed,
            preventPathFinding: true,
            nearDist: parameters.nearDist,
            nearAngle: parameters.nearAngle,
            preventLocalisation: parameters.preventLocalisation
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
        let collisionCountTarget = 7;
        let collisionCount = 0;
        let slowdownCount = 0;
        let angleA = utils.normAngle(this.movementAngle-this.collisionAngle/2);
        let angleB = utils.normAngle(this.movementAngle+this.collisionAngle/2);
        //console.log("Detect between", angleA, angleB, this.modules.lidar.measures.length)
        let lastCollisionAngle = 0;
        for(let measure of this.modules.lidar.measures){
            //Check for collisions
            let measureAngle = utils.normAngle(measure.a+this.angle);
            //let inCollisionRange = (angleA<=measureAngle && measureAngle<=angleB)
            let inCollisionRange = utils.angleInRange( angleA, angleB, measureAngle );
            if(measure.d>0 && measure.d<this.collisionDistance){
                //console.log("angleInRange(", angleA, angleB, measureAngle, ") =", inCollisionRange)
            }
            if(inCollisionRange && measure.d>0 && measure.d<this.collisionDistance){
                if(utils.angleInRange( lastCollisionAngle-0.25, lastCollisionAngle+0.25, measureAngle )) continue; // too close rays means interference
                lastCollisionAngle = measureAngle;
                collisionCount++;
                if(collisionCount>=collisionCountTarget){
                    //Add obstacle on map
                    let obstacleRadius = 165;
                    let obstacleTimeout = 2000; //will be removed from map in N milliseconds
                    console.log("collision detected");
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
                    this.addToMap({
                        component:{
                            name: "Detected Obstacle",
                            type: "obstacle",
                            isSolid: true,
                            shape: { type: "circle", x:x2, y:y2, radius: obstacleRadius, color: "orange" },
                            timeout: obstacleTimeout
                        }
                    });
                    return false;
                }
            }
            else {
                if(collisionCount>0) collisionCount--;
            }
            //Check for slowdowns
            let inSlowdownRange = utils.angleInRange(
                utils.normAngle(this.movementAngle-this.slowdownAngle/2),
                utils.normAngle(this.movementAngle+this.slowdownAngle/2),
                utils.normAngle(measure.a+this.angle)
            );
            let slowDist = this.slowdownDistance+(Math.abs(this.speed)*this.slowdownDistanceOffset);
            if(inSlowdownRange && measure.d>0 && measure.d<slowDist) slowdownCount++
        }
        this.slowdown = slowdownCount>=collisionCountTarget*0.6;
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

    async _updatePositionAndMoveStatus(preventLocalisation=false){
        
        let moveStatus = "end";
        if(!preventLocalisation) {
            await this.findLocalisation({resetTarget:0});
        }
        let status = await this.modules.base.getStatus();
        //console.log(status)
        if(status && typeof status === "object"){
            moveStatus = status.status;
            this.x = status.x;
            this.y = status.y;
            this.angle = status.angle;
            this.speed = status.speed;
        }
        
        if(this.slowdown) this.modules.base.setSpeedLimit({speed:this.slowDownSpeed});
        else this.modules.base.setSpeedLimit({speed:0});
        
        let now = new Date().getTime();
        if(this.app.multicast && now - this.lastPositionMulticastTime > 1000){
            this.lastPositionMulticastTime = now;
            this.app.multicast.sendAddComponent({
                name: "Robot friend",
                type: "robotfriend",
                isSolid: true,
                shape: { type: "circle", x:this.x, y:this.y, radius: this.radius + 50, color: "green" },
                timeout: 1000
            });
        }
        
        this.send();
        return moveStatus;
    }

    async _performMovement(x, y, angle, speed, nearDist=0, nearAngle=0, preventLocalisation=false){
        let sleep = 30;
        let success = true;
        let moveStatus = "";
        //this.app.logger.log(`-> move coordinates ${x} ${y} ${angle} ${speed}, near ${nearDist} ${nearAngle}`);

        //Update position and check obstacles
        await this._updatePositionAndMoveStatus(preventLocalisation);
        if(!this.isMovementPossible(x,y)) return false;
        if(!this.modules.base){
            this._updatePosition(x,y,angle, true);
            return true;
        }

        
        this.lastTarget.x = x;
        this.lastTarget.y = y;
        this.lastTarget.angle = angle;
        //Start the move
        success = success && !!await this.modules.base.moveXY({x:x, y:y, angle:angle, speed:speed, nearDist:nearDist, nearAngle:nearAngle})
        do{
            await utils.sleep(sleep);
            if(this.app.intelligence.hasBeenRun && this.app.intelligence.isMatchFinished()) success = false;
            if(!this.isMovementPossible(x,y)) success = false;
            moveStatus = await this._updatePositionAndMoveStatus(preventLocalisation);
        } while(success && moveStatus && moveStatus.includes("run")) // "near" and "end" status will stop the loop (but not the robot)
        if(!success) this.modules.base.break();
        this.send();
        return success;
    }

    async moveAlongPath(params){
        let path=params.path;
        let sleep = 30;
        let preventLocalisation = params.preventLocalisation || false;
        var success = true;
        if(!path.length) return false;
        if(this.modules.base && await this.modules.base.supportPath()){
            //Update position and check obstacles
            await this._updatePositionAndMoveStatus(preventLocalisation);
            if(!this.isMovementPossible(path[0].x,path[0].y)) return false;

            //Start the move
            let moveStatus = "";
            success = !!await this.modules.base.movePath({path:path})
            console.log("movePath", success, {path:path})
            do{
                await utils.sleep(sleep);
                if(this.app.intelligence.hasBeenRun && this.app.intelligence.isMatchFinished()) success = false;
                if(!this.isMovementPossible()) success = false;
                moveStatus = await this._updatePositionAndMoveStatus(preventLocalisation);
            } while(success && moveStatus && moveStatus.includes("run"))
            if(!success) this.modules.base.break();
        }
        else {
            //Not path support on base, run sections one by one
            for(let i=0;i<path.length;i++){
                //this.app.logger.log(`-> move path ${i+1}/${path.length}`);
                success = success && await this._performMovement(path[i].x, path[i].y, path[i].angle, path[i].speed, path[i].nearDist, path[i].nearAngle, preventLocalisation)
                
                if(!success) break
            }
        }
        let lastIdx = path.length - 1;
        this.lastTarget.x = path[lastIdx].x;
        this.lastTarget.y = path[lastIdx].y;
        this.lastTarget.angle = path[lastIdx].angle;
        //if(success) this._updatePosition(x,y,angle, true);
        this.send();
        return success
    }
    
    async addToMap(parameters){
        if(!parameters.component) return false;
        this.app.map.addComponent(parameters.component)
        if(this.app.multicast){
            this.app.multicast.sendAddComponent(parameters.component);
        }
        return true;
    }
    
    async removeFromMap(parameters){
        //if(parameters.list) parameters.list.forEach((e)=>this.app.map.removeComponent(this.app.map.getComponent(e, this.team)))
        if(!parameters.component) return false;
        this.app.map.removeComponent(parameters.component);
        if(this.app.multicast){
            this.app.multicast.sendRemoveComponent(parameters.component);
        }
        return true;
    }
}
