'use strict';

exports.sleep = function(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

exports.normAngle = function(angle){
    while(angle>180) angle -= 360;
    while(angle<-180) angle += 360;
    return angle;
}

exports.angleInRange = function(startAngle, endAngle, angle){
    if(endAngle > startAngle)  return startAngle <= angle && angle <= endAngle
    else return (startAngle <= angle && angle <= 360) || (0 <= angle && angle <= endAngle)
}