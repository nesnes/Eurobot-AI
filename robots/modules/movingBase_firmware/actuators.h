#ifndef actuators_h
#define actuators_h

// Servos
#include <Arduino.h>
#include <initializer_list>
#include <Array.h> //https://github.com/janelia-arduino/Array
#include <Ramp.h>
#define USE_PCA9685_SERVO_EXPANDER
#include "ServoEasing.h" //https://github.com/ArminJo/ServoEasing

#define ACTUATOR_MAX_ARRAY_SIZE 30
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
  {
    rampObj.go(defaultValue, 0);
  }

  void move(int value, int duration = 0) {
    rampObj.go(value, duration);
  }

  virtual void update() = 0;
  
  const uint8_t id;
  const char* name;
  const uint8_t pin;
  const int defaultValue;
protected:
  ramp rampObj;
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
    servo.write(rampObj.update());
  }
  
private:
  ServoEasing servo;
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
void setActuatorGroup(const char* name, const Vector<int> values, const int duration);
void setActuatorGroup(const int id, const Vector<int> values, const int duration);
void setActuatorGroup(ActuatorGroup* group, const Vector<int> values, const int duration);
void updateServos();

#endif
