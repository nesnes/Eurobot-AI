'use strict'
const isMainThread = !process.send;

var ws281x = require('rpi-ws281x');

/*
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
*/
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}


class PixelManager {
    

    constructor() {
        // Current pixel position
        this.offset = 0;

        // Set my Neopixel configuration
        this.config = {leds:12};
        this.pixels = new Uint32Array(this.config.leds);

        // Configure ws281x
        ws281x.configure(this.config);
        
        this.pattern  = "";
        this.color = [0,255,0]
    }

    loop() {

        // Set a specific pixel
        if(pattern=="") {
            let h = Math.random(); // 1/this.config.leds * this.offset;
            let [r, g, b] = hslToRgb(h, 1, 0.5);
            var colr = (r << 16) | (g << 8) | b;
            this.pixels[this.offset] = colr;
        }
        else if(pattern=="color") {
            var colorPacked = (r << 16) | (g << 8) | b;
            for(let i=0; i<this.config.leds;i++)
                this.pixels[i] = colorPacked;
        }

        // Move on to next
        this.offset = (this.offset + 1) % this.config.leds;

        // Render to strip
        ws281x.render(this.pixels);
    }
    
    setPattern(name) {
        this.pattern = name;
    }
    
    setColor(colorIn) {
        this.pattern = "color";
        this.color = colorIn;
    }

    run() {
        // Loop every 100 ms
        setInterval(this.loop.bind(this), 100);
    }
};

var pixelManager = new PixelManager();

async function run(msg){
    if(msg.action == "setPattern" && "name" in msg) 
        pixelManager.setPattern(msg.name);
    if(msg.action == "setColor" && "color" in msg) 
        pixelManager.setColorn(msg.color);
}

function sendMessage(json){
    if(process.send) process.send(json);
}

function onParentMessage(msg){
    if(!msg || !msg.action) return;
    run(msg);
}

async function main(){
    process.on('message', message=>{onParentMessage(message);});
    pixelManager.run();
}

main();


/*
var example = new Example();
example.run();


var ws281x = require('rpi-ws281x');
var pattern = "";

var config = {leds:12};
var pixels = new Uint32Array(config.leds);
ws281x.configure(config);

var pixelInterval = null;

//init leds to green
for(let i=0;i<config.leds;i++){
    pixels[i] = [127,,255,127];
}

//
// Assumes h, s, and l are contained in the set [0, 1] and
// returns r, g, and b in the set [0, 255].
//
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}

async function run(msg){
    if(msg.action == "setPattern" && "name" in msg) pattern = msg.name;
}

function sendMessage(json){
    if(process.send) process.send(json);
}

function onParentMessage(msg){
    if(!msg || !msg.action) return;
    run(msg);
}

async function main(){
    process.on('message', message=>{onParentMessage(message);});
    pixelInterval = setInterval( ()=>{ ws281x.render(pixels); }, 100);
}

main();*/
