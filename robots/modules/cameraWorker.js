'use strict'
const cv = require('opencv4nodejs');
const isMainThread = !process.send;
let stopCapture = false;
let cap = null;

var circleCP = 1.0
var param_1 = 200
var param_2 = 10
/*var minRad = self.res_w//9
var maxRad = self.res_w//5
var minDist = self.res_w//10*/
var minGreen = 30
var maxGreen = 85
var minRed = 30 //to 0
var maxRed = 150 //to 180
var minS = 120
var maxS = 255
var minV = 30
var maxV = 180
var detectionRunning = false;
async function detect(img){
    if(detectionRunning) return;
    detectionRunning = true;
    let detections = [];
    let timeA = new Date().getTime();

    let bgr = img;//await img.cvtColor(cv.COLOR_RGB2BGR);
    let hsv = await bgr.cvtColor(cv.COLOR_BGR2HSV);
    let gray = await bgr.cvtColor(cv.COLOR_BGR2GRAY);

    //Create green mask
    let filter_min_green = new cv.Vec(minGreen, minS, minV);
    let filter_max_green = new cv.Vec(maxGreen, maxS, maxV);
    let mask_green = await hsv.inRange(filter_min_green, filter_max_green)

    //Create red mask
    let filter_min_Lred = new cv.Vec(maxRed, minS, minV);
    let filter_max_Lred = new cv.Vec(180, maxS, maxV);
    let filter_min_Hred = new cv.Vec(0, minS, minV);
    let filter_max_Hred = new cv.Vec(minRed, maxS, maxV);
    let mask_Lred = await hsv.inRange(filter_min_Lred, filter_max_Lred);
    let mask_Hred = await hsv.inRange(filter_min_Hred, filter_max_Hred);
    let mask_red = mask_Lred.bitwiseOr(mask_Hred);

    //Post-process masks
    const kernel = new cv.Mat(3, 3, cv.CV_8U, 1);
    mask_green = mask_green.erode(kernel)
    mask_green = mask_green.dilate(kernel)
    mask_red = mask_red.erode(kernel)
    mask_red = mask_red.dilate(kernel)
    let mask = mask_green.bitwiseOr(mask_red)

    //Contour detection
    function contoursFromMask(mask, color, vec){
        let mask_border = mask.copyMakeBorder(1,1,1,1,cv.BORDER_CONSTANT)
        let edges = mask_border.canny(param_1, param_2)
        let contours = edges.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE)
        
        for(let cont of contours){
            let convex_hull = cont.convexHull();
            if(convex_hull.area < img.cols*img.rows/20) continue;
            let mo = convex_hull.moments();
            let x = mo.m10 / mo.m00
            let y = mo.m01 / mo.m00
            detections.push({color:color, x:x, y:y, area:convex_hull.area})
            if(isMainThread) img.drawContours([convex_hull.getPoints()], -1, vec);
            if(isMainThread) console.log(x,y)
        }
    }
    contoursFromMask(mask_green, "green", new cv.Vec3(0,255,0));
    contoursFromMask(mask_red, "red", new cv.Vec3(0,0,255));
    
    let timeEnd = new Date().getTime();
    if(!isMainThread){
        sendMessage({type:"detections", detections:detections});
    }
    else {
        console.log("Duration", timeEnd-timeA, "ms")
        cv.imshow('mask_gren', mask_green);
        cv.imshow('mask_red', mask_red);
    }
    sendImage("color", img);
    sendImage("mask", mask);
    detectionRunning = false;
    return detections;
}

async function run(){
    let frame = cap.read();
    await detect(frame);
    //const img = await cv.imreadAsync('./buoy-img/hsv-palette.jpg');
}

async function sendImage(name, img){
    if(!isMainThread){
        const smallImg = img.resizeToMax(100);
        const outBase64 =  cv.imencode('.jpg', smallImg).toString('base64');
        sendMessage({type:"image", name:name, data:outBase64});
    }
    else {
        cv.imshow(name, img);
        await cv.waitKey(5);
    }
}

function sendMessage(json){
    if(process.send) process.send(json);
}

function onParentMessage(msg){
    if(!msg || !msg.action) return;
    if(msg.action == "detect") run();
}

async function main(){
    process.on('message', message=>{onParentMessage(message);});
    cap = new cv.VideoCapture(0);
    cap.set(cv.CAP_PROP_FRAME_WIDTH,320);
    cap.set(cv.CAP_PROP_FRAME_HEIGHT,240);
    
    if(isMainThread){
        while(1){
            await run();
        }
    }
    await run();
}

main();
