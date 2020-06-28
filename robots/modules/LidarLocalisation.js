'use strict';
const utils = require("../../utils")
const util = require('util');

const LM = require('ml-levenberg-marquardt');

module.exports = class LidarLocalisation {
    constructor(app) {
        this.app = app;
        this.lastSendTime=0;
        this.x=0;
        this.y=0;
        this.angle=0;
    }
    
    async init(){
       
    }

    getDescription(){
        return {
            functions:{
                resolvePosition:{}
            }
        }
    }

    send(force=false){
        let now = new Date().getTime();
        if(!force && now - this.lastSendTime < 100) return;//send max every 100ms
        this.lastSendTime = now;
        let payload = {
            x: this.x,
            y: this.y,
            angle: this.angle
        }
        //console.log(this.measures)
        this.app.mqttServer.publish({
            topic: '/lidar/localisation',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    async resolvePosition(){
        if(!this.app.robot ||  !this.app.robot.modules || !this.app.robot.modules.lidar || !this.app.map) return;
        let initialValues = [
            this.app.robot.x,
            this.app.robot.y/*,
            this.app.robot.angle*/
        ];

        let robotX = this.app.robot.x;
        let robotY = this.app.robot.y;
        let robotAngle = this.app.robot.angle;

        //Grab lidar measures
        let polarMeasures = [...this.app.robot.modules.lidar.rawMeasures];
        let data = {x: [], y: []};
        for(let measure of polarMeasures){
            let rayAngle = measure.a /*+ angle*/;
            let x = measure.d;
            let y = 0;
            let rayAngleRad = rayAngle*(Math.PI/180);
            let raySin = Math.sin(rayAngleRad);
            let rayCos = Math.cos(rayAngleRad);
            let x2 = x*rayCos - y*raySin;
            let y2 = y*rayCos + x*raySin;
            //x2 += robotX;
            //y2 += robotY;
            data.x.push(x2);
            data.y.push(y2);
        }

        // Optionally, restrict parameters to minimum & maximum values
        let minValues = [
         /*x*/0,
         /*y*/0/*,
         -45*/
        ];
        let maxValues = [
            /*x*/this.app.map.width,
            /*y*/this.app.map.height/*,
            45*/
        ];
        
        //Set research options
        const options = {
            damping: 1.5,
            initialValues: initialValues,
            minValues: minValues,
            maxValues: maxValues,
            gradientDifference: 10e-2,
            maxIterations: 250,
            errorTolerance: 10e-2
        };

        //Get beacons
        let beacons = [];
        for(const item of this.app.map.components){
            if(item.type == "beacon")
                beacons.push(item)
        }
        //console.log(beacons)
          
        function optimizationFunction([a, b/*, c*/]) {
            return (t) =>{
                let outOfAngle = 100;//mm
                //Get x/y point from lidar
                let index = data.x.findIndex(x=>x==t);
                if(index<0) return null;
                //if(data.x.filter(x=>x==t).length>1) return null;
                let proposedX = a;
                let proposedY = b;
                let proposedAngle = 0;//c;
                let rayToX = t + proposedX;
                let rayToY = data.y[index] + proposedY;
                /*let rotatedRay = utils.rotateLine(proposedX, proposedY, rayToX, rayToY, proposedAngle-robotAngle);
                rayToX = rotatedRay.x;
                rayToY = rotatedRay.y;*/
                let rayAngle = utils.getLineAngle(proposedX,proposedY,rayToX,rayToY);

                let minDist = 9999999999;
                for(let beacon of beacons){
                    //Check if ray is aligned with beacon
                    let distance = 99999999;
                    let beaconAngle = utils.getLineAngle(proposedX,proposedY,beacon.shape.x,beacon.shape.y);
                    let angleDiff = rayAngle-beaconAngle;
                    //Get max angle size from robot to beacon edge
                    let dx = beacon.shape.x-proposedX;
                    let dy = beacon.shape.y-proposedY;
                    let distRobotToBeaconCenter = Math.max(0, Math.sqrt(dx*dx + dy*dy));
                    let halfBeaconAngle = Math.atan(beacon.shape.radius/distRobotToBeaconCenter)*180/Math.PI;// atan(opposite/adjacent)
                    angleDiff += (angleDiff>180) ? -360 : (angleDiff<-180) ? 360 : 0;
                    if(Math.abs(angleDiff)>halfBeaconAngle) distance = outOfAngle;
                    else{
                        //Compute distance (score) to beacon
                        //let dx = beacon.shape.x-rayToX;
                        //let dy = beacon.shape.y-rayToY;
                        //distance = Math.max(0, Math.sqrt(dx*dx + dy*dy)-beacon.shape.radius);
                        distance = Math.abs(beacon.shape.x-rayToX)+Math.abs(beacon.shape.y-rayToY);//-beacon.shape.radius;
                        if(distance>outOfAngle) distance = outOfAngle;
                    }

                    minDist = Math.min(minDist, distance);
                }
                return Math.pow(minDist,3);
            }
        }
           
        let fittedParams = LM(data, optimizationFunction, options);
        console.log(fittedParams);
        this.x = fittedParams.parameterValues[0];
        this.y = fittedParams.parameterValues[1];
        this.angle = 0/*fittedParams.parameterValues[2];*/
        this.send();
        //Update robot pose for debug
        this.app.robot._updatePosition(this.x, this.y, this.angle);
        this.app.robot.send()
    }

    async close(){
        //console.log("close robotlink")
      
    }

    
}