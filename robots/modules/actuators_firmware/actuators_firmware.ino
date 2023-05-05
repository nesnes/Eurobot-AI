#include "comunication.h"

#include "actuators.h"
#include <ServoEasing.hpp> //https://github.com/ArminJo/ServoEasing //Used in actruators but forward hpp include required here

#include <Chrono.h>    //https://github.com/SofaPirate/Chrono
#include <Adafruit_NeoPixel.h>

#define LED_PIN 13
bool ledValue = true;
Chrono updateLed;

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
}

void loop() {
  executeOrder();
  updateServos();

  if (updateLed.hasPassed(500)) { // blink led
    updateLed.restart();
    ledValue = !ledValue;
    digitalWrite(LED_PIN, ledValue);
  }

  if(updateNeopixel.hasPassed(100)) {
    neopixels.show();
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
    }
    else {
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}