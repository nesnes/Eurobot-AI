#ifndef moving_h
#define moving_h

#include <Wire.h>
#include "BrushlessMotor.h"
//#include "SerialMotor.h"
//#include "I2CMotor.h"

enum {
  A,
  B,
  C,
  NB_MOTORS
};

void initMotors();
void spinMotors();
double getXPos();
double getYPos();
double getAnglePos();
void setXPos(double x);
void setYPos(double y);
void setAnglePos(double angle);
void updatePosition();
double angleDiff(double a, double b);
void stopMotors();
void setRobotSpeed(double targetSpeed_mps, double targetMovmentAngle, double targetAngleSpeed_dps);
double getMotorSpeed(uint8_t i);

#endif
