#include "HardwareSerial.h"
#include "actuators.h"

SCSCL feetechSCSDriver;
SMS_STS feetechSTSDriver;

Vector <Actuator*> actuators{
  new ActuatorFeetechSTS(10, "STS", &feetechSTSDriver, 90), // test in progress
  new ActuatorFeetechSCS(11, "SCS", &feetechSCSDriver, 90), // test in progress
  //new ActuatorOnPCA9685(0,  "AC0", 0,  65), // AC shoulder
  //new ActuatorOnPCA9685(1,  "AC1", 1,  10), // AC elbow
  //new ActuatorOnPCA9685(2,  "AC2", 2,  90), // AC wrist
  //new ActuatorOnPCA9685(3,  "ACP", 3,  0, 0, 2500),  // AC pump
  //new ActuatorOnPCA9685(12, "ACM", 12, 0, 0, 2500),  // AC motor
  //new ActuatorOnPCA9685(4,  "AB0", 4,  65), // AB shoulder
  //new ActuatorOnPCA9685(5,  "AB1", 5,  10), // AB elbow
  //new ActuatorOnPCA9685(6,  "AB2", 6,  90), // AB wrist
  //new ActuatorOnPCA9685(7,  "ABP", 7,  0, 0, 2500),  // AB pump
  //new ActuatorOnPCA9685(8,  "BC0", 8,  65), // BC shoulder
  //new ActuatorOnPCA9685(9,  "BC1", 9,  10), // BC elbow
  //new ActuatorOnPCA9685(10, "BC2", 10, 90), // BC wrist
  //new ActuatorOnPCA9685(11, "BCP", 11, 0, 0, 2500)   // BC pump
};

Vector<ActuatorGroup*> actuatorGroups{
  //new ActuatorGroup(0, "ACG", actuators, {"AC0", "AC1", "AC2"}),
  //new ActuatorGroup(1, "ABG", actuators, {"AB0", "AB1", "AB2"}),
  //new ActuatorGroup(2, "BCG", actuators, {"BC0", "BC1", "BC2"})
};


void initActuators() {
  Serial2.begin(1000000);
  feetechSCSDriver.pSerial = &Serial2;
  feetechSTSDriver.pSerial = &Serial2;
}

void updateServos() {
  for (size_t i=0;i<actuators.size();i++) {
    actuators.at(i)->update();
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
