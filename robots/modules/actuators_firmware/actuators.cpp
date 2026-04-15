#include "HardwareSerial.h"
#include "actuators.h"

SCSCL feetechSCSDriver;
SMS_STS feetechSTSDriver;

Vector <Actuator*> actuators{
  //new ActuatorFeetechSTS(10, "ACL", &feetechSTSDriver, 40 , false,  0.f ),  // AC Lift
  //new ActuatorFeetechSCS(11, "ACD", &feetechSCSDriver, 150, false,  5.f ),  // AC Distributor
  //new ActuatorOnPCA9685(10, "CCR", 0, 45), // C Rotation
  //new ActuatorOnGPIO(6, "BBP", 24, 0), // Back Pump

  new ActuatorOnGPIO(90, "FAP", 25, 0), // Front A Pump
  new ActuatorFeetechSTS(91, "FAL", &feetechSTSDriver, 180, true ,  0.f), // Front A Lift
  new ActuatorFeetechSTS(92, "FAS", &feetechSTSDriver, 180, false ,  0.f), // Front A Shoulder
  new ActuatorFeetechSTS(93, "FAE", &feetechSTSDriver,  25, false ,  0.f), // Front A Elbow
  new ActuatorFeetechSTS(94, "FAW", &feetechSTSDriver, 180, false ,  0.f), // Front A Wrist

  new ActuatorOnGPIO(80, "FCP", 24, 0), // Front C Pump
  new ActuatorFeetechSTS(81, "FCL", &feetechSTSDriver, 180, false ,  0.f), // Front C Lift
  new ActuatorFeetechSTS(82, "FCS", &feetechSTSDriver, 180, true ,  0.f), // Front C Shoulder
  new ActuatorFeetechSTS(83, "FCE", &feetechSTSDriver,  25, true ,  0.f), // Front C Elbow
  new ActuatorFeetechSTS(84, "FCW", &feetechSTSDriver, 180, true ,  0.f), // Front C Wrist


  
};

Vector<ActuatorGroup*> actuatorGroups{
  new ActuatorGroup(0, "FAG", actuators, {"FAP", "FAL", "FAS", "FAE", "FAW"}), // Front A
  new ActuatorGroup(1, "FCG", actuators, {"FCP", "FCL", "FCS", "FCE", "FCW"}), // Front C
};


void initActuators() {
  Serial2.begin(1000000);
  feetechSCSDriver.pSerial = &Serial2;
  feetechSTSDriver.pSerial = &Serial2;

  // Move actuators slowly to default position
  for(uint8_t i=0; i<actuators.size();i++){
    Actuator* act= actuators.at(i);
    act->move(act->getPosition());
    act->update();
    act->move(act->defaultValue, 3000);
    act->update();
  }
}

void updateServos(uint8_t updateCount) {
  /*for (size_t i=0;i<actuators.size();i++) {
    actuators.at(i)->update();
  }*/
  static uint16_t actuatorIdx = 0;
  uint16_t updated = 0;
  for(uint8_t i=0; i<actuators.size() && updated<updateCount ;i++){
    if(actuatorIdx>=actuators.size()) actuatorIdx = 0;
    if(actuators.at(actuatorIdx)->shouldMove()) {
      actuators.at(actuatorIdx)->update();
      updated++;
    }
    actuatorIdx++;
  }
}

Actuator* getActuator(const char* name) {
  for (size_t i=0;i<actuators.size();i++) {
    if(strcmp(name, actuators.at(i)->name) == 0) return actuators.at(i);
  }
  return nullptr;
}
Actuator* getActuator(const int id) {
  for (size_t i=0;i<actuators.size();i++) {
    if(id == actuators.at(i)->id) return actuators.at(i);
  }
  return nullptr;
}

void setActuator(const char* name, const int value, const int duration) {
   setActuator(getActuator(name), value, duration);
}
void setActuator(const int id, const int value, const int duration) {
   setActuator(getActuator(id), value, duration);
}
void setActuator(Actuator* actuator, const int value, const int duration) {
   if(actuator == nullptr) return;
   actuator->move(value, duration);
}

void setEnableActuator(const char* name, const bool value) {
   setEnableActuator(getActuator(name), value);
}
void setEnableActuator(const int id, const bool value) {
   setEnableActuator(getActuator(id), value);
}
void setEnableActuator(Actuator* actuator, const bool value) {
   if(actuator == nullptr) return;
   actuator->enable(value);
}

void setTorqueActuator(const char* name, const int value) {
   setTorqueActuator(getActuator(name), value);
}
void setTorqueActuator(const int id, const int value) {
   setTorqueActuator(getActuator(id), value);
}
void setTorqueActuator(Actuator* actuator, const int value) {
   if(actuator == nullptr) return;
   actuator->setMaxTorque(value);
}

ActuatorGroup* getActuatorGroup(const char* name) {
  for (size_t i=0;i<actuatorGroups.size();i++) {
    if(strcmp(name, actuatorGroups.at(i)->name) == 0) return actuatorGroups.at(i);
  }
  return nullptr;
}
ActuatorGroup* getActuatorGroup(const int id) {
  for (size_t i=0;i<actuatorGroups.size();i++) {
    if(id == actuatorGroups.at(i)->id) return actuatorGroups.at(i);
  }
  return nullptr;
}

void setActuatorGroup(const char* name, const Vector<int> values, const int duration) {
   setActuatorGroup(getActuatorGroup(name), values, duration);
}
void setActuatorGroup(const int id, const Vector<int> values, const int duration) {
   setActuatorGroup(getActuatorGroup(id), values, duration);
}
void setActuatorGroup(ActuatorGroup* group, const Vector<int> values, const int duration) {
   if(group == nullptr) return;
   if(group->elements.size() != values.size()) return;
   for (size_t i=0;i<group->elements.size();i++) {
     group->elements.at(i)->move(values.at(i), duration);
   }
}

void setEnableActuatorGroup(const char* name, const Vector<bool> values) {
   setEnableActuatorGroup(getActuatorGroup(name), values);
}
void setEnableActuatorGroup(const int id, const Vector<bool> values) {
   setEnableActuatorGroup(getActuatorGroup(id), values);
}
void setEnableActuatorGroup(ActuatorGroup* group, const Vector<bool> values) {
   if(group == nullptr) return;
   if(group->elements.size() != values.size()) return;
   for (size_t i=0;i<group->elements.size();i++) {
     group->elements.at(i)->enable(values.at(i));
   }
}

void setTorqueActuatorGroup(const char* name, const Vector<int> values) {
   setTorqueActuatorGroup(getActuatorGroup(name), values);
}
void setTorqueActuatorGroup(const int id, const Vector<int> values) {
   setTorqueActuatorGroup(getActuatorGroup(id), values);
}
void setTorqueActuatorGroup(ActuatorGroup* group, const Vector<int> values) {
   if(group == nullptr) return;
   if(group->elements.size() != values.size()) return;
   for (size_t i=0;i<group->elements.size();i++) {
     group->elements.at(i)->setMaxTorque(values.at(i));
   }
}
