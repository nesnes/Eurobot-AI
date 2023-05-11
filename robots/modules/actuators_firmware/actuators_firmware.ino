#include "comunication.h"

#include "actuators.h"
#include <ServoEasing.hpp> //https://github.com/ArminJo/ServoEasing //Used in actruators but forward hpp include required here

#include <Chrono.h>    //https://github.com/SofaPirate/Chrono
Chrono updateActuators;
#include "LD06.h"
LD06 lidar(&Serial1);

#include "Localisation.h"
LidarLocalisation loc;
LidarLocPosition robotPosition{2700, -300, 0};
bool abortPositionMatch = false;
//#define LOCALISATION_DEBUG

#define LED_PIN 13
bool ledValue = true;
Chrono updateLed;

#include <Adafruit_NeoPixel.h>
#define NEOPIXEL_COUNT 12
Adafruit_NeoPixel neopixels(NEOPIXEL_COUNT, 33, NEO_GRB + NEO_KHZ800);
Chrono updateNeopixel;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  comunication_begin(7);// Init communication I2C address 7 (not used, we're in serial mode for now)
  initActuators();      // Init servo and pumps
  neopixels.begin();
  neopixels.show();

  lidar.init();
  lidar.setUpsideDown(true);
  lidar.setMinConfidence(200);
  lidar.setMinDistance(200);//mm
  lidar.setMaxDistance(4000);//mm

  // Create rectangle map
  loc.addLineToMap({{0,0}, {3000,0}});
  loc.addLineToMap({{3000,0}, {3000,-2000}});
  loc.addLineToMap({{3000,-2000}, {0,-2000}});
  loc.addLineToMap({{0,-2000}, {0,0}});
}

void loop() {
  // Answer orders from IA
  executeOrder();

  // Update each actuator one-by-one
  if(updateActuators.hasPassed(5)){
    updateActuators.restart();
    updateServos(); // update 1 servo at a time = ~400us
  }
  
  if (updateLed.hasPassed(500)) { // blink led
    updateLed.restart();
    ledValue = !ledValue;
    digitalWrite(LED_PIN, ledValue);
    //lidar.teleplot();
  }

  // Update lidar
  bool isNewScan = lidar.run();
  
  // Run localisation
  runLocalisation(isNewScan);  
}

void runLocalisation(bool isNewScan){
  uint16_t pointCloudSkipping = 2; // will only match cloud every N points (to speed compuation, to match more candidates)
  if(isNewScan){
    // Extract best position from last scan
    LidarLocPositionCandidate candidate = loc.getBestCandidate();
    if(!abortPositionMatch && candidate.score > 0){
      // Store new robot position
      robotPosition.x = candidate.position.x;
      robotPosition.y = candidate.position.y;
      robotPosition.angle = candidate.position.angle;
    }
#ifdef LOCALISATION_DEBUG
    Serial.println(String()+">candidateCount:"+loc.getCandidateCount());
    loc.teleplot(Serial, robotPosition, (LidarLocMeasure*)lidar.getPoints(), lidar.getPointCount(), pointCloudSkipping);
#endif
    loc.clearCandidates();
    abortPositionMatch = false;
  }
  else {
    //Generate position candidates to match against current lidar cloud
    LidarLocPosition testPosition;
    auto startTime = micros();

    // Generate very close position
    testPosition = loc.generateRandomPosition(robotPosition, 20, 5); //mm  and deg
    loc.evaluateCandidate(testPosition, (LidarLocMeasure*)lidar.getPoints(), lidar.getPointCount(), pointCloudSkipping);

    // Generate close position
    for(int i=0;i<2;i++){
      testPosition = loc.generateRandomPosition(robotPosition, 100, 30); //mm  and deg
      loc.evaluateCandidate(testPosition, (LidarLocMeasure*)lidar.getPoints(), lidar.getPointCount(), pointCloudSkipping);
    }

    // Generate far position
    testPosition = loc.generateRandomPosition(robotPosition, 400, 120); //mm  and deg
    loc.evaluateCandidate(testPosition, (LidarLocMeasure*)lidar.getPoints(), lidar.getPointCount(), pointCloudSkipping);
    
    auto endTime = micros();
#ifdef LOCALISATION_DEBUG
    Serial.println(String()+">candidatesTimeUs:"+(endTime-startTime));
#endif
  }  
}

void executeOrder() {
  comunication_read();
  if (comunication_msgAvailable()) {
    if (comunication_InBuffer[0] == '#' && comunication_InBuffer[1] != '\0') {
      //ignore
    }
    else if (strstr(comunication_InBuffer, "id")) {
      sprintf(comunication_OutBuffer, "Actuators2023");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "S ")) { // set servo by name
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      char c[4]{'\0'};
      int value = 90, duration = 0;
      sscanf(comunication_InBuffer, "S %c%c%c %i %i", &c[0], &c[1], &c[2], &value, &duration);
      setActuator(c, value, duration);
    }
    else if (strstr(comunication_InBuffer, "s ")) { // set servo by id
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      int id=-1, value = 90, duration = 0;
      sscanf(comunication_InBuffer, "s %i %i %i", &id, &value, &duration);
      setActuator(id, value, duration);
    }
    else if (strstr(comunication_InBuffer, "Z ")) { //set servo group by name
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      char c[4]{'\0'};
      int v[ACTUATOR_MAX_ARRAY_SIZE];
      int  t = 0;
      int matches = sscanf(comunication_InBuffer, "Z %c%c%c %i %i %i %i %i %i %i %i %i %i %i",  &c[0], &c[1], &c[2], &t, &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6], &v[7], &v[8], &v[9]);
      Vector<int> values;
      matches -= 4; // length of group name and duration(t)
      for(int i=0;i<matches && i<ACTUATOR_MAX_ARRAY_SIZE;i++) {
        values.push_back(v[i]);
      }
      setActuatorGroup(c, values, t);
    }
    else if (strstr(comunication_InBuffer, "z ")) { //set servo group by id
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      int v[ACTUATOR_MAX_ARRAY_SIZE], t = 0, id = -1;
      int matches = sscanf(comunication_InBuffer, "z %i %i %i %i %i %i %i %i %i %i %i %i",  &id, &t, &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6], &v[7], &v[8], &v[9]);
      Vector<int> values;
      matches -= 2; // length of id and duration(t)
      for(int i=0;i<matches && i<ACTUATOR_MAX_ARRAY_SIZE;i++) {
        values.push_back(v[i]);
      }
      setActuatorGroup(id, values, t);
    }
    else if (strstr(comunication_InBuffer, "G ")) { // get servo by name (position, load)
      char c[4]{'\0'};
      int value = 90, duration = 0;
      sscanf(comunication_InBuffer, "G %c%c%c %i %i", &c[0], &c[1], &c[2], &value, &duration);
      int position = getActuator(c)->getPosition();
      int load = getActuator(c)->getLoad();
      sprintf(comunication_OutBuffer, "G %c%c%c %i %i", c[0], c[1], c[2], position, load);//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "p ")) { //set neopixel color
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      int v[NEOPIXEL_COUNT]{0}, b=0;
      int matches = sscanf(comunication_InBuffer, "p %i %i %i %i %i %i %i %i %i %i %i %i %i", &b, &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6], &v[7], &v[8], &v[9], &v[10], &v[11]);
      matches -= 1; // brightness
      for(int i=0;i<matches && i<NEOPIXEL_COUNT;i++) {
        neopixels.setPixelColor(i, neopixels.ColorHSV(v[i]<<8));
      }
      neopixels.setBrightness(b);
      neopixels.show();
    }
    else if (strstr(comunication_InBuffer, "L ")) { //get lidar scan
      uint16_t pointDivider = 1, pointOffset = 0, maxDist = 3000;
      sscanf(comunication_InBuffer, "L %u %u %u", &pointDivider, &pointOffset, &maxDist);
      if(pointDivider==0) pointDivider = 1;
      // Create lidar msg
      int bufferIndex = sprintf(comunication_OutBuffer, "L");
      for(int i=0;i<lidar.getPointCount()  && bufferIndex<COMUNICATION_BUFFER_OUT_SIZE-20 ;i+=pointDivider){
        LD06Point* point =  lidar.getPoint(i);
        if(point->distance<maxDist){
          bufferIndex += sprintf(comunication_OutBuffer+bufferIndex, " %i,%.2f", point->distance, point->angle);
        }
      }
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "support pos")) { //get position
      sprintf(comunication_OutBuffer, "support 1");
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "X")) { //get position
      sprintf(comunication_OutBuffer, "X %i %i %i", (int)(robotPosition.x), (int)(-robotPosition.y), (int)(robotPosition.angle*100.f));
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "Y ")) { //set position
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      int x_pos = (int)(robotPosition.x), y_pos = (int)(robotPosition.y), angle_pos = (int)(robotPosition.angle*100.f);
      sscanf(comunication_InBuffer, "Y %i %i %i", &x_pos, &y_pos, &angle_pos);
      robotPosition.x = (float)(x_pos);
      robotPosition.y = (float)(-y_pos);
      robotPosition.angle = (float)(angle_pos)/100.f;
      abortPositionMatch = true;
    }
    else {
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}
