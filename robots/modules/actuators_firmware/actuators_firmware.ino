#include "comunication.h"

#include "actuators.h"
#include <ServoEasing.hpp> //https://github.com/ArminJo/ServoEasing //Used in actruators but forward hpp include required here

#include <Chrono.h>    //https://github.com/SofaPirate/Chrono
Chrono updateActuators;
#include "LD06.h"
LD06 lidar(&Serial1);

#include "Localisation.h"
LidarLocalisation loc;
LidarLocPosition robotPosition{500, -500, 0};
bool abortPositionMatch = false;
//#define LOCALISATION_DEBUG
//#define VL53_DEBUG


#include "imu.h"
#define IMU_CS_PIN 10
MPU9250 imu(SPI, IMU_CS_PIN);
unsigned long lastImuUpdate = 0;
float imuYawOffset = 0;

#define LED_PIN 13
bool ledValue = true;
Chrono updateLed;

#include <Adafruit_NeoPixel.h>
#define NEOPIXEL_COUNT 24
Adafruit_NeoPixel neopixels(NEOPIXEL_COUNT, 33, NEO_GRB + NEO_KHZ800);
Chrono updateNeopixel;

// VL53L5CX
#include <SparkFun_VL53L5CX_Library.h> // https://github.com/sparkfun/SparkFun_VL53L5CX_Arduino_Library
SparkFun_VL53L5CX vl53_C;
VL53L5CX_ResultsData vl53_C_data;
SparkFun_VL53L5CX vl53_A;
VL53L5CX_ResultsData vl53_A_data;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  comunication_begin(7);// Init communication I2C address 7 (not used, we're in serial mode for now)
  initActuators();      // Init servo and pumps
  neopixels.begin();
  neopixels.show();

  delay(2000); // might help for flashing firmware

  // VL53
  neopixels.fill(neopixels.Color(0, 0, 255, 5), 0, NEOPIXEL_COUNT);
  neopixels.show();
  // C
  Wire1.begin();
  Wire1.setClock(1000000);
  bool vl53_C_ok = vl53_C.begin(0x29, Wire1);
  Wire1.setClock(400000);
  vl53_C.setResolution(8*8);
  vl53_C.setRangingFrequency(15);
  vl53_C.startRanging();
  if(vl53_C_ok){ neopixels.fill(neopixels.Color(255, 255, 0, 5), 0, NEOPIXEL_COUNT);  }
  else{ neopixels.fill(neopixels.Color(255, 0, 0, 5), 0, NEOPIXEL_COUNT); }
  neopixels.show();
  // A
  Wire.begin();
  Wire.setClock(1000000);
  bool vl53_A_ok = vl53_A.begin(0x29, Wire);
  Wire.setClock(400000);
  vl53_A.setResolution(8*8);
  vl53_A.setRangingFrequency(15);
  vl53_A.startRanging();
  if(vl53_C_ok && vl53_A_ok){ neopixels.fill(neopixels.Color(0, 255, 0, 5), 0, NEOPIXEL_COUNT);  }
  else{ neopixels.fill(neopixels.Color(255, 0, 0, 5), 0, NEOPIXEL_COUNT); }
  neopixels.show();

  lidar.init();
  lidar.setUpsideDown(true);
  lidar.setMinConfidence(200);
  lidar.setMinDistance(200);//mm
  lidar.setMaxDistance(4000);//mm

  imu.begin();
  imu.setGyroRange(MPU9250::GYRO_RANGE_250DPS);
  imu.setDlpfBandwidth(MPU9250::DLPF_BANDWIDTH_184HZ);
  imu.setSrd(0); // 1000 / (1 + diviseur) Hz

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
    updateServos(2); // update 2 servo at a time (up to ~400us per servo)
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

  // Run VL53 measures
  // runVL53();
}

bool validateCandidate(LidarLocPositionCandidate const& candidate){
  return candidate.score > 0
      &&  120 < candidate.position.x && candidate.position.x <  2880
      && -120 > candidate.position.y && candidate.position.y > -2880;
}

void runLocalisation(bool isNewScan){
  // Update IMU yaw tracking
  unsigned long timeDiff = micros() - lastImuUpdate;
  if(timeDiff<10000){
    imu.readSensor();
    imuYawOffset -= (180.0/PI) * imu.getGyroX_rads() * (float)(timeDiff * 1e-6);
  }
  lastImuUpdate = micros();
  
  // Update Lidar tracking
  uint16_t pointCloudSkipping = 2; // will only match cloud every N points (to speed compuation, to match more candidates)
  if(isNewScan){
    // Extract best position from last scan
    LidarLocPositionCandidate candidate = loc.getBestCandidate(validateCandidate);
    if(!abortPositionMatch && candidate.score > 0){
      // Store new robot position
      robotPosition.x = candidate.position.x;
      robotPosition.y = candidate.position.y;
      robotPosition.angle = candidate.position.angle;
      robotPosition.angle += imuYawOffset;
      imuYawOffset = 0;
    }
    if(abortPositionMatch) imuYawOffset = 0;
#ifdef LOCALISATION_DEBUG
    Serial.println(String()+">robotPosition.x:"+robotPosition.x);
    Serial.println(String()+">robotPosition.y:"+robotPosition.y);
    Serial.println(String()+">robotPosition.angle:"+robotPosition.angle);
    Serial.println(String()+">candidateScore:"+candidate.score);
    Serial.println(String()+">candidateCount:"+loc.getCandidateCount());
    loc.teleplot(Serial, robotPosition, pointCloudSkipping);
#endif
    loc.clearCandidates();
    // Push new cloud to localisation
    loc.clearCloud();
    for(uint16_t i=0;i<lidar.getPointCount();i++){
      loc.addCloudPoint(lidar.getPoints()[i].distance, lidar.getPoints()[i].angle, robotPosition, 150);
    }
    abortPositionMatch = false;
  }
  else {
    //Generate position candidates to match against current lidar cloud
    LidarLocPosition testPosition;
    auto startTime = micros();

    // Generate very close position
    testPosition = loc.generateRandomPosition(robotPosition, 20, 5); //mm  and deg
    loc.evaluateCandidate(testPosition, pointCloudSkipping);
    
    // Generate very close position
    testPosition = loc.generateRandomPosition(robotPosition, 50, 10); //mm  and deg
    loc.evaluateCandidate(testPosition, pointCloudSkipping);

    // Generate close position
    for(int i=0;i<2;i++){
      testPosition = loc.generateRandomPosition(robotPosition, 150, 10); //mm  and deg
      loc.evaluateCandidate(testPosition, pointCloudSkipping);
    }

    // Generate far position
    testPosition = loc.generateRandomPosition(robotPosition, 300, 10); //mm  and deg
    loc.evaluateCandidate(testPosition, pointCloudSkipping);

    // Generate far position
    testPosition = loc.generateRandomPosition(robotPosition, 500, 10); //mm  and deg
    loc.evaluateCandidate(testPosition, pointCloudSkipping);
    
    auto endTime = micros();
#ifdef LOCALISATION_DEBUG
    Serial.println(String()+">candidatesTimeUs:"+(endTime-startTime));
#endif
  }  
}

void runVL53(){
  if (vl53_C.isDataReady() == true) {
    if (vl53_C.getRangingData(&vl53_C_data)) { //Read distance data into array
       #ifdef VL53_DEBUG
          // Fix frame orientation
          for (int y = 0 ; y <= 8 * (8 - 1) ; y += 8) {
            for (int x = 8 - 1 ; x >= 0 ; x--) {
              //3D|mySimpleCube:S:cube:P:1:1:1:R:0:0:0:W:2:H:2:D:2:C:#2ecc71
                String name = String()+"M"+x+"_"+(y/8)+",C";
                String pos = String()+"P:"+x+":"+(y/8)+":"+(float(vl53_C_data.distance_mm[x + y])/10.f);
                Serial.println(String()+">3D|"+name+":S:cube:"+pos+":W:1:D:1:H:0.1");
            }
          }
       #endif
    }
  }
  if (vl53_A.isDataReady() == true) {
    if (vl53_A.getRangingData(&vl53_A_data)) { //Read distance data into array
       #ifdef VL53_DEBUG
          // Fix frame orientation
          for (int y = 0 ; y <= 8 * (8 - 1) ; y += 8) {
            for (int x = 8 - 1 ; x >= 0 ; x--) {
              //3D|mySimpleCube:S:cube:P:1:1:1:R:0:0:0:W:2:H:2:D:2:C:#2ecc71
                String name = String()+"M"+x+"_"+(y/8)+",C";
                String pos = String()+"P:"+x+":"+(y/8)+":"+(float(vl53_A_data.distance_mm[x + y])/10.f);
                Serial.println(String()+">3D|"+name+":S:cube:"+pos+":W:1:D:1:H:0.1");
            }
          }
       #endif
    }
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
      int matches = sscanf(comunication_InBuffer, "p %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i %i", &b, \
                &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6], &v[7], &v[8], &v[9], &v[10], &v[11], &v[12], &v[13], &v[14], &v[15], &v[16], &v[17], &v[18], &v[19], &v[20], &v[21], &v[22], &v[23]);
      matches -= 1; // brightness
      if(matches>0) neopixels.fill(neopixels.ColorHSV(v[0]<<8), 0, NEOPIXEL_COUNT);
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
    else if (strstr(comunication_InBuffer, "T ")) { //get telemeter measure
      char sensorName = '\0';
      sscanf(comunication_InBuffer, "T %c", &sensorName);
      if(sensorName == 'C') {
        if (vl53_C.isDataReady() == true) { vl53_C.getRangingData(&vl53_C_data); }
        int bufferIndex = sprintf(comunication_OutBuffer, "T %c", sensorName);
        for (int y = 0 ; y <= 8 * (8 - 1) ; y += 8) {
          for (int x = 8 - 1 ; x >= 0 ; x--) {
            bufferIndex += sprintf(comunication_OutBuffer+bufferIndex, " %i", vl53_C_data.distance_mm[x + y]);
          }
        }
      }
      if(sensorName == 'A') {
        if (vl53_A.isDataReady() == true) { vl53_A.getRangingData(&vl53_A_data); }
        int bufferIndex = sprintf(comunication_OutBuffer, "T %c", sensorName);
        for (int y = 0 ; y <= 8 * (8 - 1) ; y += 8) {
          for (int x = 8 - 1 ; x >= 0 ; x--) {
            bufferIndex += sprintf(comunication_OutBuffer+bufferIndex, " %i", vl53_A_data.distance_mm[x + y]);
          }
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
