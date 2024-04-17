#include "HardwareSerial.h"
#include "actuators.h"

SCSCL feetechSCSDriver;
SMS_STS feetechSTSDriver;

Vector <Actuator*> actuators{
  //new ActuatorFeetechSTS(10, "ACL", &feetechSTSDriver, 40 , false,  0.f ),  // AC Lift
  //new ActuatorFeetechSCS(11, "ACD", &feetechSCSDriver, 150, false,  5.f ),  // AC Distributor
  //new ActuatorOnPCA9685(10, "CCR", 0, 45), // C Rotation
  //new ActuatorOnPCA9685(11, "CCS", 1, 45), // C Shoulder
  //new ActuatorOnPCA9685(12, "CCE", 2, 45), // C Elbow
  
  new ActuatorFeetechSTS(10, "CCR", &feetechSTSDriver, 160, false,  0.f ),  // C Rotation
  new ActuatorFeetechSTS(12, "CCS", &feetechSTSDriver, 255, false,  0.f ),  // C Shoulder
  new ActuatorFeetechSTS(13, "CCE", &feetechSTSDriver, 180, false,  0.f ),  // C Elbow
  new ActuatorFeetechSCS(14, "CCW", &feetechSCSDriver, 200, false,  0.f, 300u ),  // C Wrist
  new ActuatorFeetechSCS(16, "CCC", &feetechSCSDriver, 170, false,  0.f ),   // C Clamp
  
  new ActuatorFeetechSTS(20, "AAR", &feetechSTSDriver, 160, true,  0.f ),  // C Rotation
  new ActuatorFeetechSTS(22, "AAS", &feetechSTSDriver, 255, true,  0.f ),  // C Shoulder
  new ActuatorFeetechSTS(23, "AAE", &feetechSTSDriver, 180, true,  0.f ),  // C Elbow
  new ActuatorFeetechSCS(24, "AAW", &feetechSCSDriver, 200, true,  5.f, 300u ),  // C Wrist
  new ActuatorFeetechSCS(26, "AAC", &feetechSCSDriver, 170, true,  0.f ),   // C Clamp

  new ActuatorOnPWM(30, "ACE", 2, 90), // AC Elbow
  new ActuatorOnPWM(31, "ACW", 3, 90), // AC Wrist
  new ActuatorFeetechSCS(32, "ACT", &feetechSCSDriver, 180, false,  0.f ),   // AC Thumb
  new ActuatorFeetechSCS(33, "ACF", &feetechSCSDriver, 180, false,  0.f )    // AC Finger
  
};

Vector<ActuatorGroup*> actuatorGroups{
  new ActuatorGroup(0, "CCG", actuators, {"CCR", "CCS", "CCE", "CCW", "CCC"}),
  new ActuatorGroup(1, "AAG", actuators, {"AAR", "AAS", "AAE", "AAW", "AAC"}),
  new ActuatorGroup(2, "ACG", actuators, {"ACE", "ACW", "ACT", "ACF"})
  //new ActuatorGroup(1, "ABG", actuators, {"ABL", "ABD", "ABA", "ABB"}),
  //new ActuatorGroup(2, "BCG", actuators, {"BCL", "BCD", "BCB", "BCC"})
};


void initActuators() {
  Serial2.begin(1000000);
  feetechSCSDriver.pSerial = &Serial2;
  feetechSTSDriver.pSerial = &Serial2;
}

void updateServos(uint8_t updateCount) {
  /*for (size_t i=0;i<actuators.size();i++) {
    actuators.at(i)->update();
  }*/
  static uint16_t actuatorIdx = 0;
  for(uint8_t i=0;i<updateCount;i++){
    if(actuatorIdx>=actuators.size()) actuatorIdx = 0;
    actuators.at(actuatorIdx++)->update();
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
