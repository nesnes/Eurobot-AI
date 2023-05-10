#include "HardwareSerial.h"
#include "actuators.h"

SCSCL feetechSCSDriver;
SMS_STS feetechSTSDriver;

Vector <Actuator*> actuators{
  new ActuatorFeetechSTS(10, "ACL", &feetechSTSDriver, 40 , false,  0.f ),  // AC Lift
  new ActuatorFeetechSCS(11, "ACD", &feetechSCSDriver, 150, false,  5.f ),  // AC Distributor
  new ActuatorFeetechSCS(12, "ACC", &feetechSCSDriver, 150, true , -5.f ),  // AC C door
  new ActuatorFeetechSCS(13, "ACA", &feetechSCSDriver, 150, false,  0.f ),  // AC A door

  new ActuatorFeetechSTS(20, "BCL", &feetechSTSDriver, 40 , false,  2.f ),  // BC Lift
  new ActuatorFeetechSCS(21, "BCD", &feetechSCSDriver, 150, false,  0.f ),  // BC Distributor
  new ActuatorFeetechSCS(22, "BCB", &feetechSCSDriver, 150, true ,  3.f ),  // BC A door
  new ActuatorFeetechSCS(23, "BCC", &feetechSCSDriver, 150, false, -10.f),  // BC B door

  new ActuatorFeetechSTS(30, "ABL", &feetechSTSDriver, 40 , true ,  2.f ),  // AB Lift
  new ActuatorFeetechSCS(31, "ABD", &feetechSCSDriver, 150, true , -7.f ),  // AB Distributor
  new ActuatorFeetechSCS(32, "ABA", &feetechSCSDriver, 150, true , -4.f ),  // AB A door
  new ActuatorFeetechSCS(33, "ABB", &feetechSCSDriver, 150, false,  3.f ),  // AB B door
};

Vector<ActuatorGroup*> actuatorGroups{
  new ActuatorGroup(0, "ACG", actuators, {"ACL", "ACD", "ACC", "ACA"}),
  new ActuatorGroup(1, "ABG", actuators, {"ABL", "ABD", "ABA", "ABB"}),
  new ActuatorGroup(2, "BCG", actuators, {"BCL", "BCD", "BCB", "BCC"})
};


void initActuators() {
  Serial2.begin(1000000);
  feetechSCSDriver.pSerial = &Serial2;
  feetechSTSDriver.pSerial = &Serial2;
}

void updateServos() {
  /*for (size_t i=0;i<actuators.size();i++) {
    actuators.at(i)->update();
  }*/
  static uint16_t actuatorIdx = 0;
  if(actuatorIdx>=actuators.size()) actuatorIdx = 0;
  actuators.at(actuatorIdx)->update();  
  actuatorIdx++;
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
