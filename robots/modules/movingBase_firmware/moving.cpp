#include "moving.h"

const double wheelPerimeter = 186.5d;//188.495559215;//mm = pi*d = pi*60
const double reductionFactor = 3.75d;//3.75d

#ifdef TEENSYDUINO
const double wheelDistanceA = 125;//mm
const double wheelDistanceB = 125;//mm
const double wheelDistanceC = 125;//mm
const double wheelDistances[NB_MOTORS] = {wheelDistanceA, wheelDistanceB, wheelDistanceC};
#else
const double wheelDistanceA = 120;//mm
const double wheelDistanceB = 125.4;//mm
const double wheelDistanceC = 123;//mm
const double wheelDistances[NB_MOTORS] = {wheelDistanceA, wheelDistanceB, wheelDistanceC};
#endif

#define BRUSHLESSMOTORS // change to SERIALMOTORS or I2CMOTORS if needed and add dedicated .c and .h files

#ifdef BRUSHLESSMOTORS
BrushlessMotor motorA(10, 11, 12, wheelPerimeter, false);
BrushlessMotor motorB(7, 8, 9, wheelPerimeter, false);
BrushlessMotor motorC(4, 5, 6, wheelPerimeter, false);
BrushlessMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#endif

#ifdef SERIALMOTORS
SerialMotor motorA(&Serial3, wheelPerimeter / reductionFactor, true, true);
SerialMotor motorB(&Serial4, wheelPerimeter / reductionFactor, true);
SerialMotor motorC(&Serial2, wheelPerimeter / reductionFactor, true);
SerialMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#endif

#ifdef I2CMOTORS
I2CMotor motorA(0x10, wheelPerimeter / reductionFactor, true);
I2CMotor motorB(0x11, wheelPerimeter / reductionFactor, true);
I2CMotor motorC(0x12, wheelPerimeter / reductionFactor, true);
I2CMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#endif


const double motorA_angle = -60;//°
const double motorB_angle = 180;//°
const double motorC_angle = 60;//°
const double motors_angle[NB_MOTORS] = {motorA_angle, motorB_angle, motorC_angle};
//Y is forward, X is right side
//--FRONT---Y----
//-A-----C--^----
//---\-/----|----
//----|-----|----
//----B-----o-->X
//--BACK---------


void initMotors() {
  //Init motors
  Wire.begin();
  for (uint8_t i = 0; i < NB_MOTORS; i++) {
    motors[i].begin();
  }
}

void spinMotors() {
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].spin();
}

double xPos = 0, yPos = 0, anglePos = 0;

double getXPos() {
  return xPos; 
}

double getYPos() {
  return yPos; 
}

double getAnglePos() {
  return anglePos; 
}

void setXPos(double x) {
  xPos = x; 
}

void setYPos(double y) {
  yPos = y; 
}

void setAnglePos(double angle) {
  anglePos = angle; 
}

void updatePosition() {
  double dists[NB_MOTORS];
  double x = 0;
  double y = 0;
  double angle = 0;

  if (NB_MOTORS == 3) {
    for (uint8_t i = 0; i < NB_MOTORS; i++) {
      dists[i] = motors[i].getAndResetDistanceDone();
      x += cos((motors_angle[i] + anglePos) * DEG_TO_RAD) * dists[i];
      y += -sin((motors_angle[i] + anglePos) * DEG_TO_RAD) * dists[i];
      angle += (dists[i] * 360) / (2.0d * PI * (wheelDistances[i] / 1000.0d));
    }
    xPos += x * 0.635; // 0.635 is a magic number that we need to achieve real-scale positioning, but we have no idea why. "shrug"
    yPos += y * 0.635;
    anglePos += angle / 3.0d;
    if (anglePos > 180.0d) anglePos += -360.0d;
    if (anglePos < -180.0d) anglePos += 360.0d;
  }
}


double custom_mod(double a, double n) {
  return a - floor(a / n) * n;
}

double angleDiff(double a, double b) {
  return custom_mod((a - b) + 180, 360) - 180;
}

void stopMotors() {
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].setSpeed(0);
}

void setRobotSpeed(double targetSpeed_mps, double targetMovmentAngle, double targetAngleSpeed_dps) {
    //Compute translation
  double speeds[NB_MOTORS];
  double speedsAngle[NB_MOTORS];

  for (uint8_t i = 0; i < NB_MOTORS; i++) {
    speeds[i] = targetSpeed_mps * sin((targetMovmentAngle - motors_angle[i]) * DEG_TO_RAD); // Compute Linear speed
    //Serial.print(speeds[i]*1000000.f);Serial.print("\t");  // Display Linear speed
    speedsAngle[i] = 2.0d * PI * (wheelDistances[i] / 1000.d) * (targetAngleSpeed_dps / 360.0d); // Compute Rotation speed , arcLength in meters => speed m.s-1
    //Serial.print(speedsAngle[i]*1000000.f);Serial.print("\t"); // Display Rotation speed
    speeds[i] += speedsAngle[i] * 1.25; // Compound
    //Serial.print(speeds[i]*1000000.f);Serial.print("\t");  // Display compound speed
    //Serial.print("\n");
  }

  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].setSpeed(speeds[i]);
}

double getMotorSpeed(uint8_t i) {
  return motors[i].getSpeed();
}