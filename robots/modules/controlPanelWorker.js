'use strict'
const isMainThread = !process.send;
var timer = 0;
var score = 0;
var colors = ["A","B"];


// Init GPIO
const Gpio = require('onoff').Gpio;
//const gpioColor = new Gpio(17, 'in', 'both');
const gpioPower = new Gpio(26, 'out'); // we're using a GPIO as 3V power for the start push button
gpioPower.writeSync(1);
const gpioStart = new Gpio(20, 'in', 'both');
//var valueColor = 0;
var valueStart = 0;
/*gpioColor.watch((err, value) => {
  if (err) {throw err;return;}
  valueColor = value?1:0;
});*/
gpioStart.watch((err, value) => {
  if (err) {throw err; return;}
  valueStart = value?0:1;
});
    
// Init screen
/*const Oled = require('oled-disp');
const oled = new Oled({ width: 128, height: 64, dcPin: 24, rstPin : 25});

    oled.begin(()=>{
        oled.clearDisplay(false);
        setInterval(updateScreen, 150);
    });
*/
/*async function getColorStart(){
    if(!isMainThread){
        sendMessage({type:"colorStart", color:valueColor, start:valueStart});
    }
    return;
}*/
async function getStart(){
    if(!isMainThread){
        sendMessage({type:"start", start:valueStart});
    }
    return;
}

async function run(msg){
    //if(msg.action == "getColorStart") getColorStart();
    if(msg.action == "getStart") getStart();
    //if(msg.action == "setScore" && "score" in msg) score = msg.score;
    //if(msg.action == "setColors" && "colors" in msg) colors = msg.colors;
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
}

function updateScreen(){
  /*oled.clearDisplay(false);
  let colorText = ""+colors[valueColor];
  let startText = valueStart?"":".";
  oled.setCursor(1, 1);
  oled.writeString(2, colorText, 2, false);

  oled.setCursor(70, 1);
  oled.writeString(2, startText, 2, false);

  oled.setCursor(80, 1);
  oled.writeString(2, ""+timer+"s", 2, false);

  oled.setCursor(1, 18);
  oled.writeString(6, ""+score, 2, false);
  oled.update();*/
}

main();
