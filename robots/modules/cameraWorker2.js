'use strict'
const isMainThread = !process.send;
var nextTask = "";


// Setup mjpeg stream from libcamera-vid standard output
var child = require('child_process');
const SplitFrames = require('split-frames');
var args = [
'--nopreview',
'-t', '0',
'-n',
'--inline',
'--framerate', '30',
'--width', '1280', // 1024x768 has way better field of view, but tags has less pixels. (anyway FOV on the edges is tricky to use)
'--height', '720',
'--flush',
'--codec', "mjpeg",
'-o', '-'
]
var video_process = child.spawn('libcamera-vid', args, {
stdio: ['ignore', 'pipe', 'inherit']
});
const JPEG_START = Buffer.from('\xff\xd8', 'binary')
const JPEG_END = Buffer.from('\xff\xd9', 'binary')
let camera = video_process.stdout.pipe(new SplitFrames({
    startWith: JPEG_START,
    endWith: JPEG_END
}));

// Run detection on new images
var cv = require('opencv.js');
var jpeg = require('jpeg-js');
var aruco = require('js-aruco');
var detector = new aruco.AR.Detector(aruco.AR.MarkerType4x4);
var actualImageRGB = new cv.Mat();
var actualImageGray = new cv.Mat();
camera.on('data', function(frame) {
    if(nextTask != ""){
        // Read frame
        var raw_data = jpeg.decode(frame);
        actualImageRGB = cv.matFromImageData(raw_data);
    }
    if(nextTask == "arucos"){
        // Convert to gray
        cv.cvtColor(actualImageRGB, actualImageGray, cv.COLOR_RGBA2GRAY);
        // Detect aruco markers
        let markers = []
        markers = detector.detectFromGray(actualImageGray);
        for(let marker of markers){
            marker.center = {
                x: marker.corners.center.x / actualImageGray.size().width,
                y: marker.corners.center.y / actualImageGray.size().height
            }
        }
        console.log(markers)
        if(markers.length>0) console.log(markers[0].corners)
        sendMessage({type:"arucos", arucos:markers});
        sendImage("preview", actualImageRGB);
    }
    nextTask = "";
});



async function sendImage(name, img){
    if(!isMainThread){
        try{
            let previewImage = new cv.Mat();
            cv.resize(img, previewImage, new cv.Size(128, 96), 0, 0, cv.INTER_AREA);
            //cv.resize(img, previewImage, new cv.Size(1024, 768), 0, 0, cv.INTER_AREA);
            // jpeg encode
            let raw_data = {
                data: previewImage.data,
                width: previewImage.size().width,
                height: previewImage.size().height
            };
            let jpegImageData = jpeg.encode(raw_data, 90);
            //console.log(jpegImageData.data.toString('base64'));
            sendMessage({type:"image", name:name, data:jpegImageData.data.toString('base64')});
        }catch(e)
        {
            console.log(e)
        }
    }
}
function sendMessage(json){
    if(process.send) process.send(json);
}

function onParentMessage(msg){
    if(!msg || !msg.action) return;
    if(msg.action == "detectArucos") nextTask = "arucos";
}

async function main(){
    process.on('message', message=>{onParentMessage(message);});
    
    /*if(isMainThread){
        setInterval( ()=>{run("arucos");}, 1000);
    }*/
    //await run("arucos");
    nextTask = "arucos";
}

//const SegfaultHandler = require('segfault-handler');
//SegfaultHandler.registerHandler('crash.log');

main();