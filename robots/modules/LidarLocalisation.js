'use strict';
const utils = require("../../utils")
const util = require('util');

module.exports = class LidarLocalisation {
    constructor(app) {
        this.app = app;
        this.lastSendTime=0;
        this.x=0;
        this.y=0;
        this.angle=0;

        this.maxOffset=500; // maximum position correction (mm)
        this.maxAngleOffset=45; // maximum angle correction (deg)

        this.particles = [];
        this.detectedFeatures = [];
        this.features = [];
        this.score = 0;
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
            angle: this.angle,
            score: this.score,
            features: this.features,
            particles: this.particles,
            detectedFeatures: this.detectedFeatures
        }
        console.log(payload)
        this.app.mqttServer.publish({
            topic: '/lidar/localisation',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    addFeature(x, y){
        for(const feature of this.features){
            if(feature.x==x && feature.y==y) return;
        }
        this.features.push({x,y});
    }

    async resolvePosition(){
        if(!this.app.robot ||  !this.app.robot.modules || !this.app.robot.modules.lidar || !this.app.map) return;
        let startTime = new Date().getTime();
        let x=0, y=0, theta=0;
        // Convert map to features
        this.features.length = 0;
        for(const item of this.app.map.components){
            if(item.type != "localisation") continue;
            if(item.shape && item.shape.type == "line")
            {
                this.addFeature(item.shape.x1, item.shape.y1)
                this.addFeature(item.shape.x2, item.shape.y2)
            }
        }

        // Generate possible positions
        this.particles.length = 0;
        // Close to current position
        let particleCloseCount = 50;
        const particleCloseDistance = 25; // +- mm
        const particleCloseAngle = 15; // +- deg
        for(let i=0;i<particleCloseCount;i++){
            this.particles.push({
                x: this.app.robot.x + (Math.random()*2-1)*particleCloseDistance,
                y: this.app.robot.y + (Math.random()*2-1)*particleCloseDistance,
                angle: this.app.robot.angle + (Math.random()*2-1)*particleCloseAngle,
                score: 0
            })
        }
        // On all the map
        let particleFarCount = 100;
        for(let i=0;i<particleFarCount;i++){
            this.particles.push({
                x: Math.random()*this.app.map.width,
                y: Math.random()*this.app.map.height,
                angle: (Math.random()*2-1)*180,
                score: 0
            })
        }

        // Detect features in lidar data
        this.detectedFeatures.length = 0;
        let polarMeasures = [...this.app.robot.modules.lidar.rawMeasures];
        for(let i=0;i<polarMeasures.length;i++){
            const prevValue = this.getAtOverflow(polarMeasures, i-1).d;
            const currentValue = this.getAtOverflow(polarMeasures, i).d;
            const nextValue = this.getAtOverflow(polarMeasures, i+1).d;
            const prevDiff = prevValue - currentValue;
            const nextDiff = currentValue - nextValue;
            const rampDiff = prevValue - nextValue;
            const isSignChangedCorner = Math.sign(nextDiff) != Math.sign(prevDiff) && Math.abs(rampDiff)>0.1;
            const isHighDiffCorner = Math.abs(rampDiff)>6;
            if(isSignChangedCorner /*|| isHighDiffCorner*/){
                this.detectedFeatures.push({
                    angle: this.getAtOverflow(polarMeasures, i).a - this.angle,
                    distance: this.getAtOverflow(polarMeasures, i).d,
                    index: i
                });
            }
        }


        // Score each position against features
        for(let part of this.particles){
            for(let mapFeat of this.features){
                for(let foundFeat of this.detectedFeatures){
                    // Project found feature from particle position
                    const foundFeatAngle = foundFeat.angle + part.angle;
                    const foundFeatAngleRad = Math.PI / 180 * foundFeatAngle;
                    const foundFeatX = Math.cos(foundFeatAngleRad) * foundFeat.distance + part.x;
                    const foundFeatY = Math.sin(foundFeatAngleRad) * foundFeat.distance + part.y;
                    // Compute distance to map feature
                    const dx = mapFeat.x - foundFeatX;
                    const dy = mapFeat.y - foundFeatY;
                    const matchingError = Math.sqrt(dx*dx + dy*dy);
                    if(matchingError < 100){ //mm
                        part.score += 1 + (1/Math.max(1, matchingError));
                    }
                }
            }
        }

        // Select best particle
        let maxScore = 0;
        for(let part of this.particles){
            if(part.score<=maxScore) continue;
            maxScore = part.score;
            this.x = part.x;
            this.y = part.y;
            this.angle = part.angle;
            this.score = part.score;
        }

        console.log("duration", new Date().getTime() - startTime, "ms")
        this.send();
        //Update robot pose for debug
        this.app.robot._updatePosition(this.x, this.y, this.angle);
        this.app.robot.send()
    }

    getAtOverflow(data,index){
        let i=index;
        if(index<0) i+= data.length;
        else if(index>=data.length) i-= data.length;
        return data[i];
    }

    async notResolvePosition(){
        if(!this.app.robot ||  !this.app.robot.modules || !this.app.robot.modules.lidar || !this.app.map) return;
        let startTime = new Date().getTime();
        //Get localization borders
        let mapShape = [];
        for(const item of this.app.map.components){
            if(item.type == "localisation")
                mapShape.push(item.shape)
        }
        if(mapShape.length == 0) return;

        let robotX = this.app.robot.x;
        let robotY = this.app.robot.y;
        let robotAngle = this.app.robot.angle;

        //Grab lidar measures in x,y coordinates
        let polarMeasures = [...this.app.robot.modules.lidar.rawMeasures];
        let pointList = [];
        for(let measure of polarMeasures){
            let rayAngle = measure.a /*+ angle*/;
            let x = measure.d;
            let y = 0;
            let rayAngleRad = rayAngle*(Math.PI/180);
            let raySin = Math.sin(rayAngleRad);
            let rayCos = Math.cos(rayAngleRad);
            let x2 = x*rayCos - y*raySin;
            let y2 = y*rayCos + x*raySin;
            x2 += robotX;
            y2 += robotY;
            pointList.push({x:x2, y:y2, a:measure.a});
        }
        if(pointList.length == 0) return;
          
        let offsetX=0, offsetY=0, offsetAngle=0;
        // iteration number
        for(let i=0;i<15;i++){
            //For each point, get min distance (d, dx, dy) to map. And average dx dy
            let meanDx=0, meanDy=0, meanDangle=0;
            let estimatedPos = {x:this.app.robot.x - offsetX, y:this.app.robot.y - offsetY};
            for(let point of pointList){
                let dists = [];
                let p = {x: point.x-offsetX, y: point.y-offsetY};
                p = this.rotatePointAround(p, estimatedPos, offsetAngle);
                for(let shape of mapShape){
                    dists.push(this.distancePointSegment(p, shape));
                }
                dists.sort(function (a, b) {return a.d - b.d});
                meanDx+=dists[0].dx;
                meanDy+=dists[0].dy;

                // Compute angle error
                /*let p0 = {x: p.x,   y: p.y};
                let p1 = {x: p0.x+dists[0].dx, y: p0.y+dists[0].dy};
                meanDangle += Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;*/
                let p2 = {x: p.x+dists[0].dx, y: p.y+dists[0].dy};
                /*let dAx = p.x - estimatedPos.x;
                let dAy = p.y - estimatedPos.y;
                let dBx = p2.x - estimatedPos.x;
                let dBy = p2.y - estimatedPos.y;
                let angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
                //if(angle < 0) {angle = angle * -1;}
                meanDangle += angle * (180 / Math.PI);*/
                //meanDangle += this.angleBetweenPoints(p, p2, estimatedPos);
                meanDangle += Math.atan2(dists[0].dy, dists[0].dx) * 180 / Math.PI;
            }
            meanDx/=pointList.length;
            meanDy/=pointList.length;
            meanDangle/=pointList.length;
            offsetX += meanDx;
            offsetY += meanDy;
            //if(Math.abs(meanDx)<1 && Math.abs(meanDy)<1)
                offsetAngle += meanDangle;
            if(Math.abs(meanDx)<1 && Math.abs(meanDy)<1 && Math.abs(meanDangle)<1) break;
            console.log(i, ":", meanDx, meanDy, meanDangle)
        }

        // Too big position/angle correction
        if(Math.abs(offsetX)>this.maxOffset || Math.abs(offsetY)>this.maxOffset) return;
        if(Math.abs(offsetAngle)>this.maxAngleOffset) return;

        // Apply mean dx dy to position
        this.x = this.app.robot.x - offsetX;
        this.y = this.app.robot.y - offsetY;
        this.angle = this.app.robot.angle - offsetAngle;
        console.log("duration", new Date().getTime() - startTime, "ms")
        console.log(offsetX, offsetY, offsetAngle)

        
        //this.x = fittedParams.parameterValues[0];
        //this.y = fittedParams.parameterValues[1];
        //this.angle = 0/*fittedParams.parameterValues[2];*/
        this.send();
        //Update robot pose for debug
        this.app.robot._updatePosition(this.x, this.y, this.angle);
        this.app.robot.send()
    }

    distancePointPoint(p1, p2) {
        let a = p1.x - p2.x;
        let b = p1.y - p2.y;
        return Math.sqrt( a*a + b*b );
    }

    distancePointSegment(point, line) {
        let l1 = {x:line.x1, y: line.y1};
        let l2 = {x:line.x2, y: line.y2};

        let A = point.x - l1.x;
        let B = point.y - l1.y;
        let C = l2.x - l1.x;
        let D = l2.y - l1.y;
      
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) //in case of 0 length line
            param = dot / len_sq;
      
        let xx, yy;
        if (param < 0) {
          xx = l1.x;
          yy = l1.y;
        }
        else if (param > 1) {
          xx = l2.x;
          yy = l2.y;
        }
        else {
          xx = l1.x + param * C;
          yy = l1.y + param * D;
        }
      
        let dx = point.x - xx;
        let dy = point.y - yy;
        return { d: Math.sqrt(dx * dx + dy * dy), dx: dx, dy: dy};
    }

    rotatePointAround(point, center, angle) {
        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x,
            ny = -(cos * (point.y - center.y)) + (sin * (point.x - center.x)) + center.y;
        return {x:nx, y:ny};
    }

    angleBetweenPoints(p0,p1,c) {
        var p0c = Math.sqrt(Math.pow(c.x-p0.x,2)+
                            Math.pow(c.y-p0.y,2));  
        var p1c = Math.sqrt(Math.pow(c.x-p1.x,2)+
                            Math.pow(c.y-p1.y,2));
        var p0p1 = Math.sqrt(Math.pow(p1.x-p0.x,2)+
                             Math.pow(p1.y-p0.y,2));
        var angle = Math.acos((p1c*p1c+p0c*p0c-p0p1*p0p1)/(2*p1c*p0c));
        return angle * (180 / Math.PI);
      }

    async close(){
        //console.log("close robotlink")
      
    }

    
}