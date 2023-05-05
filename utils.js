'use strict';

exports.sleep = function(ms){
    return new Promise(resolve=>{
        if(ms && ms > 0) setTimeout(resolve,ms)
        else resolve();
    })
}

exports.normAngle = function(angle){
    while(angle>180) angle -= 360;
    while(angle<-180) angle += 360;
    return angle;
}

exports.angleInRange = function(startAngle, endAngle, angle){
    
    if(endAngle > startAngle)
        return startAngle <= angle && angle <= endAngle
    else
        return (startAngle <= angle && angle <= 180) || (endAngle >= angle && angle >= -180)
}

exports.getLineAngle = function(x1,y1,x2,y2){
    let dx = x2-x1;
    let dy = y2-y1;
    let rads = Math.atan2(dy,dx)
    rads += Math.PI/2;
    rads %= 2*Math.PI;
    let degs = rads * 180/Math.PI; // to degrees
    degs -= 90;
    if(degs>180) degs = -360+degs
    if(degs<-180) degs = 360+degs
    return degs;
}

exports.setLineAngle = function(x1,y1,x2,y2, angle){
    let rads = angle*Math.PI/180;
    let dx = x1-x2;
    let dy = y1-y2;
    let length = Math.sqrt(dx*dx + dy*dy);
    let rotX = x1 + length*Math.cos(rads);
    let rotY = y1 + length*Math.sin(rads);
    return {x:rotX, y:rotY};
}

exports.rotateLine = function(x1,y1,x2,y2, angle){
    let currentAngle = module.exports.getLineAngle(x1,y1,x2,y2);
    return module.exports.setLineAngle(x1,y1,x2,y2, currentAngle+angle)
}