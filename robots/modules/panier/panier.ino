#include <SPI.h>
#include <Wire.h>
#include <Servo.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Chrono.h>

#define OLED_MOSI   9
#define OLED_CLK   10
#define OLED_DC    11
#define OLED_CS    12
#define OLED_RESET 13
Adafruit_SSD1306 display(OLED_MOSI, OLED_CLK, OLED_DC, OLED_RESET, OLED_CS);
Chrono displayTimer;

#define NEOPIXEL_PIN 8
#define NUMPIXELS 20
Adafruit_NeoPixel pixels(NUMPIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
Chrono pixelTimer;

#include "SoftwareSerial.h"
#include "DFRobotDFPlayerMini.h" //https://github.com/DFRobot/DFRobotDFPlayerMini
SoftwareSerial dfSerial(A4, A5); // RX, TX
DFRobotDFPlayerMini dfPlayer;

#define SERVO_SHAKE_PIN 4
#define SERVO_FLOWER_PIN 6
#define SENSOR_TOP 7
#define SENSOR_BOTTOM 3
unsigned long minActivationDelay = 5; //ms
unsigned long lastCherryTime = 0;

int sensorTopState = 1, sensorBottomState = 1;
unsigned long sensorTopChangeTime = 0, sensorBottomChangeTime = 0;
Servo servoFlower;
Servo servoShake;
int servoShakeHigh = 0;
int servoShakeLow = 48;

int cherryCount = 0;
int pointCount = 5;
unsigned long lastRotationTime = 0;

void setup()   {                
  Serial.begin(115200);
  display.begin(SSD1306_SWITCHCAPVCC);
  display.clearDisplay();

  pixels.begin();
  pixels.setBrightness(255);

  dfSerial.begin(9600);
  dfPlayer.begin(dfSerial);
  dfPlayer.volume(30);
  dfPlayer.playFolder(1, 1);

  pinMode(SENSOR_TOP, INPUT);
  pinMode(SENSOR_BOTTOM, INPUT);
  servoFlower.attach(SERVO_FLOWER_PIN);
  servoShake.attach(SERVO_SHAKE_PIN);
  servoShake.write(servoShakeLow);
}

void loop() {
  updateSensors();

  updateFlower();

  if(pixelTimer.hasPassed(50)){
    pixelTimer.restart();
    pixels.show();
  }
  
  if(displayTimer.hasPassed(200)){
    displayTimer.restart();
    updateDisplay();
  }
}

void onSensorTopActivated(){
  lastRotationTime = millis();
}
void onSensorBottomActivated(){
  if(millis() - lastCherryTime > 100){
    cherryCount++;
    pointCount++;
    if(cherryCount==1) pointCount += 5;
    dfPlayer.playFolder(2, cherryCount);
  }
  lastCherryTime = millis();
}

void updateFlower(){
  unsigned long timeSinceLastRotate = millis() - lastRotationTime;
  
  if(lastRotationTime > 0 && timeSinceLastRotate < 15 * 1000){
    servoFlower.attach(SERVO_FLOWER_PIN);
    servoShake.attach(SERVO_SHAKE_PIN);
    //if(timeSinceLastRotate < 1 * 1000) servoFlower.write(78); // Spin slowly reversed
    //else                               servoFlower.write(86); // Spin slowly`
    
    int backwardTime = millis() - (millis()/1000*1000);
    if(backwardTime < 200) servoFlower.write(68); // Spin backward slowly
    else servoFlower.write(96); // Spin slowly
    
    pixels.fill(pixels.Color(0, 150, 0), 0, NUMPIXELS);

    if(backwardTime < 250) servoShake.write(servoShakeHigh);
    else if(backwardTime < 500) servoShake.write(servoShakeLow);
    else if(backwardTime < 600) servoShake.write(servoShakeHigh);
    else if(backwardTime < 700) servoShake.write(servoShakeLow);
    else if(backwardTime < 800) servoShake.write(servoShakeHigh);
    else if(backwardTime < 900) servoShake.write(servoShakeLow);
  }
  else{
    servoShake.write(servoShakeLow);
    delay(200);
    servoShake.detach();
    servoFlower.detach();
    pixels.fill(pixels.Color(0, 0, 0), 0, NUMPIXELS);
  }
}

void updateSensors(){
  // Read Sensor Top
  /*if(digitalRead(SENSOR_TOP) != sensorTopState){
    sensorTopState = digitalRead(SENSOR_TOP);
    sensorTopChangeTime = millis();
  }*/
  
  // Read Sensor Bottom
  /*if(digitalRead(SENSOR_BOTTOM) != sensorBottomState){
    sensorBottomState = digitalRead(SENSOR_BOTTOM);
    sensorBottomChangeTime = millis();
  }*/

  // Is Sensor Top Activated
  /*if(!sensorTopState && sensorTopChangeTime>0 && millis()-sensorTopChangeTime > minActivationDelay){
    sensorTopChangeTime = 0;
    onSensorTopActivated();
  }*/

  // Is Sensor Bottom Activated
  /*if(!sensorBottomState && sensorBottomChangeTime>0 && millis()-sensorBottomChangeTime > minActivationDelay){
    sensorBottomChangeTime = 0;
    onSensorBottomActivated();
  }*/

  if(!digitalRead(SENSOR_TOP)){
    onSensorTopActivated();
  }
  
  if(!digitalRead(SENSOR_BOTTOM)){
    onSensorBottomActivated();
  }
}

void updateDisplay(){
  display.clearDisplay();
  
  display.setTextSize(2);
  display.setCursor(0,0);
  display.print("Cerise Pts");

  display.setTextSize(5);
  display.setTextColor(WHITE);
  display.setCursor(0,20);
  display.print(cherryCount);
  display.setCursor(68,20);
  display.print(pointCount);
  
  display.drawLine(73, 0, 52, 63, WHITE);

  display.fillRect(0, 0, 3, 3, !digitalRead(SENSOR_TOP));
  display.fillRect(0, 60, 3, 3, !digitalRead(SENSOR_BOTTOM));

  display.display();
}
