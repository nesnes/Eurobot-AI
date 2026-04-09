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
  
  //new ActuatorFeetechSTS(10, "CCR", &feetechSTSDriver, 160, false,  0.f ),  // C Rotation
  //new ActuatorFeetechSTS(12, "CCS", &feetechSTSDriver, 255, false,  0.f ),  // C Shoulder
  //new ActuatorFeetechSTS(13, "CCE", &feetechSTSDriver, 180, false,  0.f ),  // C Elbow
  //new ActuatorFeetechSCS(14, "CCW", &feetechSCSDriver, 200, false,  0.f, 300u ),  // C Wrist
  //new ActuatorFeetechSCS(16, "CCC", &feetechSCSDriver, 170, false,  0.f ),   // C Clamp
  
  //new ActuatorFeetechSTS(20, "AAR", &feetechSTSDriver, 160, true,  0.f ),  // C Rotation
  //new ActuatorFeetechSTS(22, "AAS", &feetechSTSDriver, 255, true,  0.f ),  // C Shoulder
  //new ActuatorFeetechSTS(23, "AAE", &feetechSTSDriver, 180, true,  0.f ),  // C Elbow
  //new ActuatorFeetechSCS(24, "AAW", &feetechSCSDriver, 200, true,  5.f, 300u ),  // C Wrist
  //new ActuatorFeetechSCS(26, "AAC", &feetechSCSDriver, 170, true,  0.f ),   // C Clamp

  /*new ActuatorFeetechSTS(10, "ACE", &feetechSTSDriver, 260, false,  0.f), // AC Elbow
  new ActuatorFeetechSTS(11, "ACW", &feetechSTSDriver, 340, false,  0.f), // AC Wrist
  new ActuatorFeetechSCS(12, "ACT", &feetechSCSDriver, 200, false,  0.f ),// AC Thumb
  new ActuatorFeetechSCS(13, "ACF", &feetechSCSDriver, 180,  true,  6.f ),// AC Finger
  new ActuatorFeetechSCS(14, "ACC", &feetechSCSDriver, 45, false,  10.f ),// AC C door
  new ActuatorFeetechSCS(15, "ACA", &feetechSCSDriver, 45,  true,  7.f ),// AC A door

  new ActuatorFeetechSTS(20, "ABE", &feetechSTSDriver, 260, false,  0.f), // AB Elbow
  new ActuatorFeetechSTS(21, "ABW", &feetechSTSDriver, 340, false,  0.f), // AB Wrist
  new ActuatorFeetechSCS(22, "ABT", &feetechSCSDriver, 200, false,  0.f ),// AB Thumb
  new ActuatorFeetechSCS(23, "ABF", &feetechSCSDriver, 180,  true,  0.f ),// AB Finger
  new ActuatorFeetechSCS(24, "ABA", &feetechSCSDriver, 45, false,  10.f ),// AB A door
  new ActuatorFeetechSCS(25, "ABB", &feetechSCSDriver, 45,  true,  15.f ),// AB B door

  new ActuatorFeetechSTS(30, "BCE", &feetechSTSDriver, 260, false,  0.f), // BC Elbow
  new ActuatorFeetechSTS(31, "BCW", &feetechSTSDriver, 340, false,  0.f), // BC Wrist
  new ActuatorFeetechSCS(32, "BCT", &feetechSCSDriver, 200, false,  -4.f ),// BC Thumb
  new ActuatorFeetechSCS(33, "BCF", &feetechSCSDriver, 180,  true,  6.f ),// BC Finger
  new ActuatorFeetechSCS(34, "BCB", &feetechSCSDriver, 45, false,  0.f ),// BC C door
  new ActuatorFeetechSCS(35, "BCC", &feetechSCSDriver, 45,  true,  0.f ) // BC B door*/

  /*new ActuatorFeetechSTS(40, "C3L", &feetechSTSDriver, 200, true ,  0.f), // C 3 Lift
  new ActuatorFeetechSCS(41, "C3S", &feetechSCSDriver, 150, true ,  -5.f), // C 3 Shoulder
  new ActuatorFeetechSCS(42, "C3E", &feetechSCSDriver, 150, true ,  -2.f), // C 3 Elbow
  new ActuatorFeetechSCS(43, "C3C", &feetechSCSDriver, 150, true ,  8.f), // C 3 Clamp

  new ActuatorFeetechSTS(44, "C2L", &feetechSTSDriver, 200, false,  0.f), // C 2 Lift
  new ActuatorFeetechSCS(45, "C2S", &feetechSCSDriver, 150, true ,  -5.f), // C 2 Shoulder
  new ActuatorFeetechSCS(46, "C2C", &feetechSCSDriver, 150, true ,  0.f), // C 2 Clamp

  new ActuatorFeetechSTS(47, "C1L", &feetechSTSDriver, 200, true ,  0.f), // C 1 Lift
  new ActuatorFeetechSCS(48, "C1S", &feetechSCSDriver, 150, true ,  -3.f), // C 1 Shoulder
  new ActuatorFeetechSCS(49, "C1C", &feetechSCSDriver, 150, true ,  -5.f), // C 1 Clamp

  new ActuatorFeetechSTS(50, "C0L", &feetechSTSDriver, 180, false,  0.f), // C 0 Lift
  new ActuatorFeetechSTS(51, "C0S", &feetechSTSDriver, 180, false,  -2.f), // C 0 Shoulder
  new ActuatorFeetechSCS(52, "C0C", &feetechSCSDriver, 150, false,  -3.f), // C 1 Clamp

  new ActuatorFeetechSCS(14, "ACC", &feetechSCSDriver, 15, false,  0.f), // AC C finger
  new ActuatorFeetechSCS(15, "ACA", &feetechSCSDriver, 15, true ,  0.f), // AC A finger

  new ActuatorFeetechSTS(62, "A3L", &feetechSTSDriver, 200, false,  0.f), // A 3 Lift
  new ActuatorFeetechSCS(63, "A3S", &feetechSCSDriver, 150, false,  0.f), // A 3 Shoulder
  new ActuatorFeetechSCS(64, "A3E", &feetechSCSDriver, 150, false,  3.f), // A 3 Elbow
  new ActuatorFeetechSCS(65, "A3C", &feetechSCSDriver, 150, false,  15.f), // A 3 Clamp

  new ActuatorFeetechSTS(59, "A2L", &feetechSTSDriver, 200, true ,  5.f), // A 2 Lift
  new ActuatorFeetechSCS(60, "A2S", &feetechSCSDriver, 150, false,  -5.f), // A 2 Shoulder
  new ActuatorFeetechSCS(61, "A2C", &feetechSCSDriver, 150, false,  -3.f), // A 2 Clamp

  new ActuatorFeetechSTS(56, "A1L", &feetechSTSDriver, 200, false,  3.f), // A 1 Lift
  new ActuatorFeetechSCS(57, "A1S", &feetechSCSDriver, 150, false,  5.f), // A 1 Shoulder
  new ActuatorFeetechSCS(58, "A1C", &feetechSCSDriver, 150, false,  0.f), // A 1 Clamp

  new ActuatorFeetechSTS(53, "A0L", &feetechSTSDriver, 180, true ,  0.f), // A 0 Lift
  new ActuatorFeetechSTS(54, "A0S", &feetechSTSDriver, 180, true ,  -3.f), // A 0 Shoulder
  new ActuatorFeetechSCS(55, "A0C", &feetechSCSDriver, 150, true ,  -8.f) // A 1 Clamp*/

  new ActuatorOnGPIO(5, "FFP", 25, 0), // Front Pump
  new ActuatorOnGPIO(6, "BBP", 24, 0), // Back Pump
  new ActuatorFeetechSTS(40, "FFF", &feetechSTSDriver, 90, false ,  0.f), // Front Fourche
  new ActuatorFeetechSTS(10, "BBF", &feetechSTSDriver, 160, false ,  0.f), // Back Fourche

  new ActuatorFeetechSTS(50, "FS0", &feetechSTSDriver, 120, false ,  0.f), // Front Suction 0
  new ActuatorFeetechSTS(51, "FS1", &feetechSTSDriver, 210, false ,  0.f),  // Front Suction 1

  new ActuatorFeetechSTS(60, "FAC", &feetechSTSDriver, 120, true ,  0.f),  // Front A Clamp
  new ActuatorFeetechSTS(61, "FCC", &feetechSTSDriver, 120, false ,  0.f),  // Front C Clamp

  new ActuatorFeetechSTS(70, "CF0", &feetechSTSDriver, 130, false ,  0.f),  // C Front 0
  new ActuatorFeetechSTS(71, "CF1", &feetechSTSDriver,  25, false ,  0.f),  // C Front 1
  new ActuatorFeetechSTS(72, "CF2", &feetechSTSDriver, 210, false ,  0.f),  // C Front 2
  new ActuatorFeetechSTS(73, "CFC", &feetechSTSDriver, 120, false ,  0.f),  // C Front Clamp

  new ActuatorFeetechSTS(30, "AF0", &feetechSTSDriver, 130, true ,  0.f),  // A Front 0
  new ActuatorFeetechSTS(31, "AF1", &feetechSTSDriver,  25, true ,  0.f),  // A Front 1
  new ActuatorFeetechSTS(32, "AF2", &feetechSTSDriver, 210, true ,  0.f),  // A Front 2
  new ActuatorFeetechSTS(33, "AFC", &feetechSTSDriver, 120, true ,  0.f),  // A Front Clamp

  new ActuatorFeetechSTS(80, "CS0", &feetechSTSDriver, 150, false ,  0.f),  // C Side 0
  new ActuatorFeetechSTS(81, "CS1", &feetechSTSDriver, 140, false ,  0.f),  // C Side 1
  new ActuatorFeetechSTS(82, "CS2", &feetechSTSDriver, 25, false ,  0.f),  // C Side 2
  new ActuatorFeetechSTS(83, "CS3", &feetechSTSDriver, 250, false ,  0.f),  // C Side 3
  new ActuatorFeetechSTS(84, "CS4", &feetechSTSDriver, 120, false ,  0.f),  // C Side 4 Clamp
  new ActuatorFeetechSTS(85, "CS5", &feetechSTSDriver, 120, true ,  0.f),  // C Side 5 Clamp

  new ActuatorFeetechSTS(20, "AS0", &feetechSTSDriver, 150, true ,  0.f),  // A Side 0
  new ActuatorFeetechSTS(21, "AS1", &feetechSTSDriver, 140, true ,  0.f),  // A Side 1
  new ActuatorFeetechSTS(22, "AS2", &feetechSTSDriver, 25, true ,  0.f),  // A Side 2
  new ActuatorFeetechSTS(23, "AS3", &feetechSTSDriver, 250, true ,  0.f),  // A Side 3
  new ActuatorFeetechSTS(24, "AS4", &feetechSTSDriver, 120, true ,  0.f),  // A Side 4 Clamp
  new ActuatorFeetechSTS(25, "AS5", &feetechSTSDriver, 120, false ,  0.f),  // A Side 5 Clamp

  new ActuatorFeetechSTS(90, "BS0", &feetechSTSDriver, 270, false ,  0.f),  // Back Suction 0
  new ActuatorFeetechSTS(91, "BS1", &feetechSTSDriver, 270, false ,  0.f),  // Back Suction 1
  new ActuatorFeetechSTS(92, "BS2", &feetechSTSDriver, 270, false ,  0.f),  // Back Suction 2


  
};

Vector<ActuatorGroup*> actuatorGroups{
  new ActuatorGroup(0, "FFG", actuators, {"FFF"}), // Front Fourche
  new ActuatorGroup(1, "BBG", actuators, {"BBF"}), // Back Fourche
  new ActuatorGroup(2, "FSG", actuators, {"FS0", "FS1", "FFP"}), // Front Suction
  new ActuatorGroup(3, "BSG", actuators, {"BS0", "BS1", "BS2", "BBP"}), // Back Suction
  new ActuatorGroup(4, "FCG", actuators, {"FAC", "FCC"}), // Front Clamp
  new ActuatorGroup(5, "CFG", actuators, {"CF0", "CF1", "CF2", "CFC"}), // Front C arm
  new ActuatorGroup(6, "AFG", actuators, {"AF0", "AF1", "AF2", "AFC"}), // Front A arm
  new ActuatorGroup(7, "CSG", actuators, {"CS0", "CS1", "CS2", "CS3", "CS4", "CS5"}), // Side C arm
  new ActuatorGroup(8, "ASG", actuators, {"AS0", "AS1", "AS2", "AS3", "AS4", "AS5"}) // Side A arm
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
