#include "SMS_STS.h"
#ifndef actuators_h
#define actuators_h

// Servos
#include <Arduino.h>
#include <initializer_list>
#include <Array.h> //https://github.com/janelia-arduino/Array
#include <Ramp.h> //https://github.com/siteswapjuggler/RAMP
#define USE_PCA9685_SERVO_EXPANDER
#define SUPPRESS_HPP_WARNING
#include <Servo.h>
#include <ServoEasing.h> //https://github.com/ArminJo/ServoEasing
#include <FeetechServo.h> //https://github.com/Robot-Maker-SAS/FeetechServo

#define ACTUATOR_MAX_ARRAY_SIZE 50
template <typename T>
class Vector : public Array<T, ACTUATOR_MAX_ARRAY_SIZE>{
public:
  Vector(){};
  Vector(std::initializer_list<T> list) {
    for(auto obj : list) {
      this->push_back(obj);
    }
  }
};

class Actuator {
public:
  Actuator(uint8_t id_, const char* name_, uint8_t pin_, int defaultValue_)
  : id(id_)
  , name(name_)
  , pin(pin_)
  , defaultValue(defaultValue_)
  , lastTarget(defaultValue_)
  , targetSpeed(0)
  , needMove(true)
  {
    rampObj.go(defaultValue, 0);
  }

  void move(int value, int duration = 0) {
    if (duration > 0) {
      targetSpeed = abs(floor( float(value - lastTarget) / (float(duration)/1000.f) )); // Ticks per sec
    }
    else {
      targetSpeed = 0;
    }
    rampObj.go(value, duration);
    lastTarget = value;
    needMove = true;
  }

  bool shouldMove() {
    return needMove;
  }

  virtual void update() = 0;
  virtual void enable(bool on=true) {};
  virtual int getPosition() {
    return rampObj.update();
  };
  virtual int getLoad() {
    return 0;
  };
  virtual void setMaxTorque(int value){};
  
  const uint8_t id;
  const char* name;
  const uint8_t pin;
  const int defaultValue;
  int lastTarget;
  int targetSpeed;
  bool needMove;
protected:
  rampInt rampObj;
};

class ActuatorOnPWM : public Actuator {
public:
  ActuatorOnPWM(uint8_t id_, const char* name_, uint8_t pin_, int defaultValue_, int minUs = 400, int maxUs = 2500)
  : Actuator(id_, name_, pin_, defaultValue_)
  {
    servo.attach(pin, minUs, maxUs);
    update();
  }

  void update() {
    needMove = rampObj.isRunning();
    servo.write(rampObj.update());
  }
  
private:
  Servo servo;
};

class ActuatorOnGPIO : public Actuator {
public:
  ActuatorOnGPIO(uint8_t id_, const char* name_, uint8_t pin_, int defaultValue_=0)
  : Actuator(id_, name_, pin_, defaultValue_)
  {

    pinMode(pin, OUTPUT);
    digitalWrite(pin, defaultValue_);
    update();
  }

  void update() {
    needMove = false;
    digitalWrite(pin, rampObj.getTarget());
  }
  
private:
  Servo servo;
};

class ActuatorOnPCA9685 : public Actuator {
public:
  ActuatorOnPCA9685(uint8_t id_, const char* name_, uint8_t pin_, int defaultValue_, int minUs = 400, int maxUs = 2500)
  : Actuator(id_, name_, pin_, defaultValue_)
  , servo(PCA9685_DEFAULT_ADDRESS, &Wire)
  {
    servo.attach(pin, defaultValue, minUs, maxUs);
  }

  void update() {
    needMove = rampObj.isRunning();
    servo.write(rampObj.update());
  }
  
private:
  ServoEasing servo;
};

class ActuatorFeetechSCS : public Actuator {
public:
  ActuatorFeetechSCS(uint8_t id_, const char* name_, SCSCL* driver_, int defaultValue_, bool reversed_=false, float offset_=0.f, uint16_t maxSpeed_=0)
  : Actuator(id_, name_, 0, defaultValue_)
  , driver(driver_)
  , reversed(reversed_)
  , offset(offset_)
  , maxSpeed(maxSpeed_)
  {
    //servo.attach(pin, defaultValue, minUs, maxUs);
  }

  void update() {
    needMove = false;
    //deg to value
    int target = map(rampObj.getTarget() + offset, 0, 300, 0, 1024); // 300° range
    if(reversed) target = 1024 - target;
    int scaledSpeed = abs(floor(float(targetSpeed) * (1024.f/300.f)));
    driver->WritePos(id, target, 0, min(scaledSpeed, maxSpeed));
  }

  int getPosition() override {
    int pos = map(driver->ReadPos(id), 0, 1024, 0, 300) + offset;
    return reversed ? 300 - pos : pos;
  }

  int getLoad() override {
    return driver->ReadLoad(id);
  }

  void enable(bool on=true) override {
    driver->EnableTorque(id, on);
  }
  
private:
  SCSCL* driver;
  bool reversed;
  float offset;
  uint16_t maxSpeed;
};

class ActuatorFeetechSTS : public Actuator {
public:
  ActuatorFeetechSTS(uint8_t id_, const char* name_, SMS_STS* driver_, int defaultValue_, bool reversed_=false, float offset_=0.f)
  : Actuator(id_, name_, 0, defaultValue_)
  , driver(driver_)
  , reversed(reversed_)
  , offset(offset_)
  {
    //servo.attach(pin, defaultValue, minUs, maxUs);
  }

  void update() {
    //deg to value
    needMove = false;
    int target = map(rampObj.getTarget() + offset, 0, 360, 0, 4096); // 360° range
    if(reversed) target = 4096 - target;
    int scaledSpeed = abs(floor( float(targetSpeed) * (4096.f/360.f)));
    driver->WritePosEx(id, target, scaledSpeed);
  }

  int getPosition() override {
    int pos = map(driver->ReadPos(id), 0, 4096, 0, 360) + offset;
    return reversed ? 360 - pos : pos;
  }

  int getLoad() override {
    return driver->ReadLoad(id);
  }

  void enable(bool on=true) override {
    driver->EnableTorque(id, on);
  }

  void setMaxTorque(int value) override { // between 0 and 1000
    driver->writeWord(id, SMS_STS_TORQUE_LIMIT_L, value);
  }
  
private:
  SMS_STS* driver;
  bool reversed;
  float offset;
};

class ActuatorGroup {
public:
  ActuatorGroup(int id_, const char* name_, Vector<Actuator*> source, Vector<const char*> names)
  : id(id_)
  , name(name_)
  {
    for(size_t i=0;i<names.size();i++){
      for(size_t j=0;j<source.size();j++){
        if(strcmp(names.at(i), source.at(j)->name) != 0) continue;
        elements.push_back(source.at(j));
      }
    }
  }
  
  ActuatorGroup(int id_, const char* name_, Vector<Actuator*> source, Vector<const int> ids)
  : id(id_)
  , name(name_)
  {
    for(size_t i=0;i<ids.size();i++){
      for(size_t j=0;j<source.size();j++){
        if(ids.at(i) != source.at(j)->id) continue;
        elements.push_back(source.at(j));
      }
    }
  }
  const int id;
  const char* name;
  Vector<Actuator*> elements;
};

void initActuators();
Actuator* getActuator(const char* name);
Actuator* getActuator(const int id);
ActuatorGroup* getActuatorGroup(const char* name);
ActuatorGroup* getActuatorGroup(const int id);
void setActuator(const char* name, const int value, const int duration);
void setActuator(const int id, const int value, const int duration);
void setActuator(Actuator* actuator, const int value, const int duration);
void setEnableActuator(const char* name, const bool value);
void setEnableActuator(const int id, const bool value);
void setEnableActuator(Actuator* actuator, const bool value);
void setTorqueActuator(const char* name, const int value);
void setTorqueActuator(const int id, const int value);
void setTorqueActuator(Actuator* actuator, const int value);
void setActuatorGroup(const char* name, const Vector<int> values, const int duration);
void setActuatorGroup(const int id, const Vector<int> values, const int duration);
void setActuatorGroup(ActuatorGroup* group, const Vector<int> values, const int duration);
void setEnableActuatorGroup(const char* name, const Vector<bool> values);
void setEnableActuatorGroup(const int id, const Vector<bool> values);
void setEnableActuatorGroup(ActuatorGroup* group, const Vector<bool> values);
void setTorqueActuatorGroup(const char* name, const Vector<int> values);
void setTorqueActuatorGroup(const int id, const Vector<int> values);
void setTorqueActuatorGroup(ActuatorGroup* group, const Vector<int> values);
void updateServos(uint8_t updateCount=1);

extern Vector <Actuator*> actuators;
extern Vector<ActuatorGroup*> actuatorGroups;

#endif
