#include <Arduino.h>
#include <analogWrite.h>
#include <Adafruit_NeoPixel.h>
#include "BrushlessMotor.h" 
#include <Wire.h>
#include "WireSlave.h"

#define SDA_PIN 21
#define SCL_PIN 22
#define I2C_SLAVE_ADDR 0x12

/*
//#define MODE_I2C
#ifndef MODE_I2C
  #define MODE_SERIAL
  //#define SERIAL_DEBUG
#endif
#include "comunication.h"
*/

#define PIXEL_COUNT 12
#define REDUCTION_FACTOR 3.7
#define CONTACT_A 4
#define CONTACT_B 16
#define LED_PIN 5
bool ledValue = true;
bool contactAValue = false;
bool contactBValue = false;

Adafruit_NeoPixel pixels(PIXEL_COUNT, 0, NEO_GRB + NEO_KHZ800);

const double wheelPerimeter = 186.5d;
const int MOTOR_ENABLE_PIN = 25;
BrushlessMotor motor(27, 12, 14, wheelPerimeter, false); // 11 pairs

void onReceive(int howMany);
void onRequest();
template <typename T> int I2C_writeAnything (const T& value)
  {
    const byte * p = (const byte*) &value;
    unsigned int i;
    for (i = 0; i < sizeof value; i++)
          WireSlave.write(*p++);
    return i;
  }  // end of I2C_writeAnything

template <typename T> int I2C_readAnything(T& value)
  {
    byte * p = (byte*) &value;
    unsigned int i;
    for (i = 0; i < sizeof value; i++)
          *p++ = WireSlave.read();
    return i;
  }
template <typename T> int I2C_singleWriteAnything (const T& value) {
  int size = sizeof value;
  byte vals[size];
  const byte* p = (const byte*) &value;
  unsigned int i;
  for (i = 0; i < sizeof value; i++) {
    vals[i] = *p++;
  }
  
  WireSlave.write(vals, size);
  return i;
}

void setup() {
  Serial.begin(115200);
  pixels.begin();
  setPixels(231, 76, 60);//red
  pixels.setBrightness(200);

  //Init communication
  //comunication_begin(1);//I2C address
  bool success = WireSlave.begin(SDA_PIN, SCL_PIN, I2C_SLAVE_ADDR);
  if (!success) {
      Serial.println("I2C slave init failed");
      while(1) delay(100);
  }
  
  WireSlave.onRequest(onRequest);
  WireSlave.onReceive(onReceive);
  
  pinMode(CONTACT_A, INPUT);
  pinMode(CONTACT_B, INPUT);

  pinMode(MOTOR_ENABLE_PIN, OUTPUT);
  digitalWrite(MOTOR_ENABLE_PIN, 1);
  motor.begin();

  pinMode(LED_PIN, OUTPUT);
  
  setPixels(46, 204, 113);
}

void setPixels(int r, int g, int b){
  pixels.fill(pixels.gamma32(pixels.Color(r, g, b)));
  pixels.show();
}

void computePixels(){
  bool ca = digitalRead(CONTACT_A);
  bool cb = digitalRead(CONTACT_B);
  pixels.clear();
  float motorAngle = motor.getTotalDistanceDone();
  int index = (abs((int)((motorAngle/REDUCTION_FACTOR)*180.f/PI)) % 360)*((float)(PIXEL_COUNT)/360.f);
  if(motorAngle>0) index = PIXEL_COUNT-index;
  
  uint32_t blue = pixels.Color(0, 0, 255);
  uint32_t white = pixels.Color(255, 255, 255);
  uint32_t green = pixels.Color(0, 255, 0);
  uint32_t violet = pixels.Color(255, 0, 255);
  uint32_t color = blue;
  if(ca && cb) color = white;
  else if(ca) color =  green;
  else if(cb) color = violet;
  int n0 = index-1; if(n0<0) n0 = PIXEL_COUNT-1;
  int n1 = index;
  int n2 = index+1; if(n2 >= PIXEL_COUNT) n2 = 0;
  if(0 <= n0 && n0 < PIXEL_COUNT) pixels.setPixelColor(n0, color);
  if(0 <= n1 && n1 < PIXEL_COUNT) pixels.setPixelColor(n1, color);
  if(0 <= n2 && n2 < PIXEL_COUNT) pixels.setPixelColor(n2, color);
  
  pixels.show();
}

/*void executeOrder(){
  comunication_read();
  if(comunication_msgAvailable()){
    if(comunication_InBuffer[0] == '#' && comunication_InBuffer[1] != '\0'){
      //ignore
    }
    else if(strstr(comunication_InBuffer, "id")){
      sprintf(comunication_OutBuffer, "MotorDriver\r\n");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "T ")){
      sprintf(comunication_OutBuffer, "T OK\r\n");//max 29 Bytes
      comunication_write();//async
      float requestedSpeed=0;
      int res = sscanf(comunication_InBuffer, "T %f", &requestedSpeed);
      motor.setSpeed(requestedSpeed);
    }
    else if(strstr(comunication_InBuffer, "G")){
      sprintf(comunication_OutBuffer,"G %.5f\r\n", motor.getTotalDistanceDone());
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "B")){
      sprintf(comunication_OutBuffer,"B %i %i\r\n", digitalRead(CONTACT_A), digitalRead(CONTACT_B));
      comunication_write();//async
    }
    else{
      sprintf(comunication_OutBuffer,"ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}*/

void onReceive(int howMany){
  char currentOrder = '\0';
  if (WireSlave.available()>=1) {
    I2C_readAnything(currentOrder);
  }
  if(currentOrder == 'T' && WireSlave.available() >= sizeof(float)){
    float speed = 0;
    I2C_readAnything(speed);
    /*((byte*)(&speed))[0] = WireSlave.read();
    ((byte*)(&speed))[1] = WireSlave.read();
    ((byte*)(&speed))[2] = WireSlave.read();
    ((byte*)(&speed))[3] = WireSlave.read();*/
    if(isnan(speed)) speed = 0;
    motor.setSpeed(speed);
    /*Serial.print('T');
    Serial.println(speed);*/
  }
  while (WireSlave.available()) WireSlave.read(); // read remaining if any
}

char gotRequest = '\0';
void onRequest(){
  float dist = motor.getTotalDistanceDone();
    //I2C_writeAnything(dist);
    I2C_singleWriteAnything(dist);
    I2C_writeAnything(contactAValue);
    I2C_writeAnything(contactBValue);
}

unsigned long lastPixelTime = 0;
unsigned long lastLedTime = 0;
unsigned long lastButtonTime = 0;
void loop()
{
  WireSlave.update();
  motor.spin();
  //delayMicroseconds(100); // help interrupts, but not the motor
  
  // Blink a LED to monitor program health
  unsigned long now = millis();
  if(now - lastLedTime >= 500){
    ledValue=!ledValue;
    digitalWrite(LED_PIN, ledValue);
    lastLedTime = now;
  }
  
  if(now - lastButtonTime >= 100){
    contactAValue = digitalRead(CONTACT_A);
    contactBValue = digitalRead(CONTACT_B);
    lastButtonTime = now;
  }
  
  /*unsigned long int now = millis();
  if(now - lastPixelTime >= 30){
    computePixels();
    lastPixelTime = now;
  }*/
}
