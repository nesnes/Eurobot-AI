#ifndef actuators_h
#define actuators_h

// Servos
#include <Servo.h>
#include <Ramp.h>

enum {
  AC_A,
  AC_C,
  AB_A,
  AB_B,
  BC_B,
  BC_C,
  Flag,
  NB_SERVOS
};

enum {
  L,
  R,
  NB_PUMPS
};

void initActuators();
void setArmPose(int* pose, int duration);
void updateServos();
void setServo(uint8_t servo, int angle = 90, int duration = 0);
void setPump(uint8_t pump, bool state);


#endif
