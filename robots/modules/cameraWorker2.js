'use strict'
const isMainThread = !process.send;
var nextTask = "";

const fs = require('fs');

var child = require('child_process');
const SplitFrames = require('split-frames');

var pipelines = [
// Setup mjpeg stream from libcamera-vid standard output
    {
        setupCmd: [],
        exists: fs.existsSync('/usr/local/bin/libcamera-vid'),
        cmd: "libcamera-vid",
        args: [

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
    },
    {
        /*
            v4l2-ctl -L -d /dev/video1
            brightness 0x00980900 (int)    : min=-64 max=64 step=1 default=0 value=30
            auto_exposure 0x009a0901 (menu)   : min=0 max=3 default=3 value=1 (Manual Mode)
               1: Manual Mode
               3: Aperture Priority Mode
            exposure_time_absolute 0x009a0902 (int)    : min=50 max=10000 step=1 default=166 value=50
        */
        setupCmd: ["v4l2-ctl -d /dev/video1 -c auto_exposure=1 -c exposure_time_absolute=50 -c brightness=30"],
        exists: fs.existsSync('/usr/bin/ffmpeg'),
        cmd: "ffmpeg",
        args: [

            '-f', 'v4l2',
            '-input_format', 'mjpeg',
            '-framerate', '15',
            '-video_size', '800x600',
            '-i', '/dev/video1',
            '-f', 'mjpeg',
            '-r', '5', // output 5 frame per second (reduce cpu load)
            'pipe:1'
        ]
    }
]

var targetPipeline = null;
for (var p of pipelines) {
    if(p.exists) {
        targetPipeline = p;
        break;
    }
}
if(!targetPipeline) {
    console.error("No pipeline found")
    exit(1)
}

for(let cmd of targetPipeline.setupCmd) {
    child.exec(cmd);
}

var video_process = child.spawn(targetPipeline.cmd, targetPipeline.args, {
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
let maxDistance = 0; // Number of non-matching color-square in a detected tag. 0 is perfect match
var detector = new aruco.AR.Detector(aruco.AR.MarkerType4x4, maxDistance);
var actualImageRGB = new cv.Mat();
var actualImageMask = new cv.Mat();
var previewFPS = 0;
var lastPreviewTime = 0;
camera.on('data', function(frame) {
    if(nextTask== "" && previewFPS > 0) {
        let now = Date.now();
        let delay = 1000 / previewFPS;
        if(lastPreviewTime + delay < now) {
            nextTask = "preview";
            lastPreviewTime = now;
        }
    }
    if(nextTask != ""){
        // Read frame
        var raw_data = jpeg.decode(frame);
        actualImageRGB = cv.matFromImageData(raw_data);
    }
    if(nextTask == "arucos"){
        // Detect aruco markers
        let markers = []
        markers = detector.detectFromRGBA(actualImageRGB, {median: { size: 5 }});
        for(let marker of markers){
            marker.center = {
                x: marker.corners.center.x / actualImageRGB.size().width,
                y: marker.corners.center.y / actualImageRGB.size().height
            }
        }
        console.log(markers)
        if(markers.length>0) console.log(markers[0].corners)
        sendMessage({type:"arucos", arucos:markers});
        sendImage("preview", actualImageRGB);
        cv.cvtColor(detector.cv_thres, actualImageMask, cv.COLOR_GRAY2RGBA);
        sendImage("threshold", actualImageMask);
    }
    if(nextTask == "preview"){
        sendImage("preview", actualImageRGB);
    }
    nextTask = "";
});



async function sendImage(name, img){
    if(!isMainThread){
        try{
            let previewImage = new cv.Mat();
            cv.resize(img, previewImage, new cv.Size(200, 150), 0, 0, cv.INTER_AREA);
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
    if(msg.action == "previewFPS") previewFPS = msg.fps;
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