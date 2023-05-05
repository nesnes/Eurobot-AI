#ifndef moving_h
#define moving_h
#include <Wire.h>
enum {
  A,
  B,
  C,
  NB_MOTORS
};

void initMotors();
void enableMotors();
void disableMotors();
void motorLowLevel();
void motorHighLevel();
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
