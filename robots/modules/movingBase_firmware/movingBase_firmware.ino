#include "BrushlessMotor.h"
//#include "SerialMotor.h"
//#include "I2CMotor.h"
#include <Wire.h>
//#define MODE_I2C
#ifndef MODE_I2C
#define MODE_SERIAL
//#define SERIAL_DEBUG
#endif
#include "comunication.h"

#define LED_PIN 13
bool ledValue = true;

const double wheelPerimeter = 186.5d;//188.495559215;//mm = pi*d = pi*60
const double reductionFactor = 3.75d;//3.75d

#define NB_MOTORS 3

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

//--FRONT---Y----
//-A-----C--^----
//---\-/----|----
//----|-----|----
//----B-----o-->X
//--BACK---------

// Servos
#include <Servo.h>
#include <Ramp.h>

const int MIN_PULSE = 500;
const int MAX_PULSE = 2500;

// Servos "alone"
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

const uint8_t SERVO_AC_A = 17;
const uint8_t SERVO_AC_C = 23;
const uint8_t SERVO_AB_A = 20;
const uint8_t SERVO_AB_B = 16;
const uint8_t SERVO_BC_B = 15;
const uint8_t SERVO_BC_C = 13;
const uint8_t SERVO_FLAG = 14;
const uint8_t SERVO_PINS[NB_SERVOS] = {SERVO_AC_A, SERVO_AC_C, SERVO_AB_A, SERVO_AB_B, SERVO_BC_B, SERVO_BC_C, SERVO_FLAG};

const int SERVO_AC_A_DEFAULT = 70;
const int SERVO_AC_C_DEFAULT = 110;
const int SERVO_AB_A_DEFAULT = 110;
const int SERVO_AB_B_DEFAULT = 70;
const int SERVO_BC_B_DEFAULT = 110;
const int SERVO_BC_C_DEFAULT = 70;
const int SERVO_FLAGS_DEFAULT = 27;
const int SERVO_DEFAULTS[NB_SERVOS] = {SERVO_AC_A_DEFAULT, SERVO_AC_C_DEFAULT, SERVO_AB_A_DEFAULT, SERVO_AB_B_DEFAULT, SERVO_BC_B_DEFAULT, SERVO_BC_C_DEFAULT, SERVO_FLAGS_DEFAULT};

Servo servos[NB_SERVOS];
ramp servoRamps[NB_SERVOS];

// Servos Arm
const int NB_SERVO_ARM_M = 5;
const int pinNumberServo_M[NB_SERVO_ARM_M] = {0, 24, 28, 1, 32};
Servo servos_M[NB_SERVO_ARM_M];
ramp servosRamp_M[NB_SERVO_ARM_M];
int positionServo_M_DefaultOut[NB_SERVO_ARM_M] = {90, 90, 90, 90, 90};//Z 40 90 90 90 90 140 0
int positionServo_M_Default[NB_SERVO_ARM_M] = {50, 90, 140, 50, 90};//Z 40 10 150 60 90 140 0

// Pumps
const int NB_PUMPS = 2;
const int pinNumberPump_L = 22;
const int pinNumberPump_R = 21;
const int pinNumberPumps[NB_PUMPS] = {pinNumberPump_L, pinNumberPump_R};


typedef struct {
  float x = 0;
  float y = 0;
  float angle = 0;
  void PathSegment(float _x, float _y, float _angle) {
    this->x = _x;
    this->y = _y;
    this->angle = _angle;
  }
} PathSegment;

PathSegment targetPath[50];
int targetPathIndex = 0;
int targetPathSize = 0;
bool runTargetPath = false;

void setArmPose(int* pose, int duration) {
  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++)
    servosRamp_M[i].go(pose[i], duration);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  delay(2500);

  // Setup Servos
  for (uint8_t i = 0; i < NB_SERVOS; i++) {
    servos[i].attach(SERVO_PINS[i], MIN_PULSE, MAX_PULSE);
    servoRamps[i].go(SERVO_DEFAULTS[i], 0);
  }

  // Setup Arm M
  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++) {
    servos_M[i].attach(pinNumberServo_M[i], MIN_PULSE, MAX_PULSE);
    setArmPose(positionServo_M_DefaultOut, 0);
  }

  updateServos();

  //Setup pumps
  for (uint8_t i = 0; i < NB_PUMPS; i++) {
    pinMode(pinNumberPumps[i], OUTPUT);
    digitalWrite(pinNumberPumps[i], LOW);
  }

  //Init motors
  Wire.begin();
  for (uint8_t i = 0; i < NB_MOTORS; i++) {
    motors[i].begin();
  }

  //Init communication
  comunication_begin(7);//I2C address 7 (not used, we're in serial mode for now)
}

//In meters, degrees, m/s and °/s
double xStart = 0, yStart = 0, angleStart = 0;
double xPos = 0, yPos = 0, anglePos = 0;
double xTarget = 0, yTarget = 0, angleTarget = 0, speedTarget = 3.5, angleSpeedTarget = 50;

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

double targetMovmentAngle = 0;
double targetSpeed_mps = 0.0;// m/s
double targetAngleSpeed_dps = 0;// °/s

double targetAngleError = 1.5; //° 1.0
double targetPosError = 0.015; //meters 0.005
bool targetReached = true;
int targetReachedCountTarget = 10;
int targetReachedCount = 0;

float nearTranslationError = 0.05;//meters
float nearAngleError = 5;//degrees
bool nearTarget = false;

double applySpeedRamp(double distFromStart, double distFromEnd, double rampDist, double speedTarget, double minSpeed) {
  double speed = speedTarget;
  double errorSign = distFromEnd > 0 ? 1 : -1;
  double startRampDist = rampDist / 4;
  double endRampDist = rampDist;

  if (abs(distFromStart) < startRampDist or abs(distFromEnd) < endRampDist) {
    if (abs(distFromStart) < abs(distFromEnd)) {
      speed = minSpeed + (speedTarget - minSpeed) * 1.0 / startRampDist * abs(distFromStart);
    } else {
      speed = minSpeed + (speedTarget - minSpeed) * 1.0 / endRampDist * abs(distFromEnd);
    }
  } else {
    speed = speedTarget;
  }

  //Bound speed
  if (abs(speed) > speedTarget) speed = speedTarget;
  if (abs(speed) < minSpeed) speed = minSpeed;
  speed *= errorSign;
  return speed;
}

//Y is forward, X is right side
void updateAsserv() {
  //Translation
  double xDiff = xTarget - xPos;
  double yDiff = yTarget - yPos;
  double translationError = sqrt(pow(xPos - xTarget, 2) + pow(yPos - yTarget, 2)); // meters
  double translationAngle = 0;
  if (xDiff != 0.f)
    translationAngle = atan2(xDiff, yDiff) * RAD_TO_DEG;
  else if (yDiff < 0.f)
    translationAngle = -180;

  targetMovmentAngle = angleDiff(translationAngle, anglePos);

  //Translation Speed
  double minSpeed = 0.05;
  if (runTargetPath && targetPathIndex > 0 && targetPathIndex < targetPathSize - 1)
    minSpeed = 0.1;
  double slowDownDistance = 0.20;//m
  double distFromStart = sqrt(pow(xPos - xStart, 2) + pow(yPos - yStart, 2)); // meters
  double distFromEnd = translationError;
  targetSpeed_mps = applySpeedRamp(distFromStart, distFromEnd, slowDownDistance, speedTarget, minSpeed);


  //Rotation
  double angleMinSpeed = 10;//deg/s
  double slowDownAngle = 25;//deg
  double rotationError = angleDiff(angleTarget, anglePos);
  double rotationFromStart = angleDiff(angleStart, anglePos);

  targetAngleSpeed_dps = applySpeedRamp(rotationFromStart, rotationError, slowDownAngle, angleSpeedTarget, angleMinSpeed);

  nearTarget = (!runTargetPath and translationError <= nearTranslationError and fabs(rotationError) <= nearAngleError);

  if (translationError > targetPosError || fabs(rotationError) > targetAngleError) {
    targetReached = false;
    targetReachedCount = 0;
  }
  else {
    if (targetReachedCount >= targetReachedCountTarget)
      targetReached = true;
    targetReachedCount++;
    targetAngleSpeed_dps = 0;
    targetSpeed_mps = 0;
  }
}

void printCharts() {
  //Position
  Serial.print(xPos * 1000); Serial.print(" ");
  Serial.print(yPos * 1000); Serial.print(" ");
  Serial.print(xTarget * 1000); Serial.print(" ");
  Serial.print(yTarget * 1000); Serial.print(" ");

  //Angle
  Serial.print(anglePos); Serial.print(" ");
  Serial.print(angleTarget); Serial.print(" ");
  Serial.print(targetMovmentAngle); Serial.print(" ");

  //Angle Speed
  Serial.print(targetAngleSpeed_dps); Serial.print(" ");
  Serial.print(angleSpeedTarget); Serial.print(" ");

  //Position Speed
  Serial.print(targetSpeed_mps * 100.0); Serial.print(" ");
  Serial.print(speedTarget * 100.0); Serial.print(" ");

  //Motor Speed
  for (uint8_t i = 0; i < NB_MOTORS; i++) { // Display all motors speed or only 2 => i<2
    Serial.print(motors[i].getSpeed()); Serial.print(" ");
    //Serial.print(motors[i].getSpeed()*1000);Serial.print(" ");
  }

  Serial.print("\r\n");
}


float nextPathTranslationError = 0.05;//meters 0.03
float nextPathRotationError = 5;//degrees

void updatePath() {
  if (!runTargetPath || targetReached) return;
  //Set current target
  xTarget = targetPath[targetPathIndex].x;
  yTarget = targetPath[targetPathIndex].y;
  angleTarget = targetPath[targetPathIndex].angle;

  //Compute error to switch to next target
  double translationError = sqrt(pow(xPos - xTarget, 2) + pow(yPos - yTarget, 2)); // meters
  double rotationError = angleDiff(angleTarget, anglePos);
  if (targetPathIndex < targetPathSize - 1
      && translationError < nextPathTranslationError
      && rotationError < nextPathRotationError) {
    targetPathIndex++;
    //Reset startPos for accel ramp
    xStart = xPos;
    yStart = yPos;
    angleStart = anglePos;
  }

  //Set new target
  xTarget = targetPath[targetPathIndex].x;
  yTarget = targetPath[targetPathIndex].y;
  angleTarget = targetPath[targetPathIndex].angle;
}


bool movementEnabled = false;
bool emergencyStop = false;
bool manualMode = false;

void control() {

  if (emergencyStop || !movementEnabled) {
    for (uint8_t i = 0; i < NB_MOTORS; i++)
      motors[i].setSpeed(0);
    return;
  }

  //Update target from path
  if (runTargetPath) updatePath();

  /* Compute speeds with asserv:
      targetMovmentAngle
      targetSpeed_mps
      targetAngleSpeed_dps
  */
  if (!manualMode) updateAsserv();
#ifdef SERIAL_DEBUG
  printCharts();
#endif

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

int positionFrequency = 100; //Hz
int controlFrequency = 100; //Hz

void executeOrder() {
  comunication_read();
  if (comunication_msgAvailable()) {
    if (comunication_InBuffer[0] == '#' && comunication_InBuffer[1] != '\0') {
      //ignore
    }
    else if (strstr(comunication_InBuffer, "id")) {
      sprintf(comunication_OutBuffer, "MovingBaseAlexandreV4");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "move enable")) {
      movementEnabled = true;
      emergencyStop = false;
      sprintf(comunication_OutBuffer, "move OK");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "move disable")) {
      movementEnabled = false;
      sprintf(comunication_OutBuffer, "move OK");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "pos set ")) {
      sprintf(comunication_OutBuffer, "pos OK");//max 29 Bytes
      comunication_write();//async
      int x_pos = 0, y_pos = 0, angle_pos = 0;
      sscanf(comunication_InBuffer, "pos set %i %i %i", &y_pos, &x_pos, &angle_pos);
      xPos = (float)(x_pos) / 1000.0f;
      yPos = (float)(y_pos) / 1000.0f;
      anglePos = angle_pos;
      xTarget = xPos;
      yTarget = yPos;
      angleTarget = anglePos;
      updateAsserv();
    }
    else if (strstr(comunication_InBuffer, "pos getXY")) {
      sprintf(comunication_OutBuffer, "pos %i %i %i %i", (int)(yPos * 1000.0f), (int)(xPos * 1000.0f), (int)(anglePos), (int)(targetSpeed_mps * 10));
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "pos getDA")) {
      sprintf(comunication_OutBuffer, "ERROR");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "move XY ")) {
      sprintf(comunication_OutBuffer, "move OK");
      comunication_write();//async
      int i_x_pos = 0, i_y_pos = 0, i_angle = 0, i_speed_pos = 1, i_near_dist = 0, i_near_angle = 0;
      sscanf(comunication_InBuffer, "move XY %i %i %i %i %i %i", &i_y_pos, &i_x_pos, &i_angle, &i_speed_pos, &i_near_dist, &i_near_angle);
      xStart = xPos;
      yStart = yPos;
      angleStart = anglePos;
      xTarget = (float)(i_x_pos) / 1000.0f;
      yTarget = (float)(i_y_pos) / 1000.0f;
      angleTarget = (float)(i_angle);
      speedTarget = (float)(i_speed_pos) / 10.0f;
      angleSpeedTarget = speedTarget * 180.f;
      nearTranslationError = (float)(i_near_dist) / 1000.0f;
      nearAngleError = (float)(i_near_angle);
      nearTarget = false;
      targetReached = false;
      emergencyStop = false;
      targetReached = false;
      runTargetPath = false;
      movementEnabled = true;
      updateAsserv();
    }
    else if (strstr(comunication_InBuffer, "path set ")) {
      sprintf(comunication_OutBuffer, "path OK");
      comunication_write();//async
      int action = -1, i_x_pos = 0, i_y_pos = 0, i_angle = 0, i_speed_pos = 1;
      sscanf(comunication_InBuffer, "path set %i %i %i %i %i", &action, &i_y_pos, &i_x_pos, &i_angle, &i_speed_pos);
      //0 reset and add 1 point
      //1 add 1 point
      //2 add 1 point and run
      //3 reset, add 1 point and run
      if (action == 0 || action == 3) { //reset
        targetReached = false;
        targetPathIndex = 0;
        targetPathSize = 0;
        runTargetPath = false;
      }
      if (action == 0 || action == 1 || action == 2 || action == 3) { //add
        int idx = targetPathSize;
        targetPath[idx].x = (float)(i_x_pos) / 1000.0f;
        targetPath[idx].y = (float)(i_y_pos) / 1000.0f;
        targetPath[idx].angle = (float)(i_angle);
        speedTarget = (float)(i_speed_pos) / 10.0f;
        angleSpeedTarget = speedTarget * 180.f;
        targetPathSize++;
      }
      if ((action == 2 || action == 3) && targetPathSize) { //run
        xStart = xPos;
        yStart = yPos;
        angleStart = anglePos;
        nearTarget = false;
        targetReached = false;
        runTargetPath = true;
        emergencyStop = false;
        movementEnabled = true;
        updatePath();
        updateAsserv();
      }
    }
    else if (strstr(comunication_InBuffer, "move DA")) {
      sprintf(comunication_OutBuffer, "ERROR");//max 29 Bytes
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "status get")) {
      const char* status = targetReached ? "end" : nearTarget ? "near" : "run";
      sprintf(comunication_OutBuffer, "%s %i %i %i %i %i", status, (int)(yPos * 1000.0f), (int)(xPos * 1000.0f), (int)(anglePos), (int)(targetSpeed_mps * 10), targetPathIndex);
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "speed get")) {
      sprintf(comunication_OutBuffer, "speed %.1f", targetSpeed_mps);
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "move break")) {
      sprintf(comunication_OutBuffer, "move OK");
      comunication_write();//async
      emergencyStop = true;
      targetSpeed_mps = 0;
      targetAngleSpeed_dps = 0;
    }
    else if (strstr(comunication_InBuffer, "move RM")) {
      int i_distance = 0, i_vitesse = 4;
      sscanf(comunication_InBuffer, "move RM %i %i", &i_distance, &i_vitesse);
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "support XY")) {
      sprintf(comunication_OutBuffer, "support 1");
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "support Path")) {
      sprintf(comunication_OutBuffer, "support 1");
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "manual enable")) {
      manualMode = true;
      sprintf(comunication_OutBuffer, "manual OK");
      comunication_write();//async
    }
    else if (strstr(comunication_InBuffer, "manual disable")) {
      sprintf(comunication_OutBuffer, "manual OK");
      comunication_write();//async
      manualMode = false;
      targetMovmentAngle = 0;
      targetSpeed_mps = 0;
      targetAngleSpeed_dps = 0;
      xTarget = xPos;
      yTarget = yPos;
      angleTarget = anglePos;
    }
    else if (strstr(comunication_InBuffer, "manual set ")) {
      sprintf(comunication_OutBuffer, "manual OK");
      comunication_write();//async
      int i_move_angle = 0, i_move_speed = 0, i_angle_speed = 0;
      sscanf(comunication_InBuffer, "manual set %i %i %i", &i_move_angle, &i_move_speed, &i_angle_speed);
      targetMovmentAngle = i_move_angle;
      targetSpeed_mps = (float)(i_move_speed) / 10.0f;
      targetAngleSpeed_dps = i_angle_speed;
      emergencyStop = false;
      runTargetPath = false;
    }
    else if (strstr(comunication_InBuffer, "servo set ")) {
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      char c1, c2, c3;
      int angle = 90, duration = 0;
      sscanf(comunication_InBuffer, "servo set %c%c%c %i %i", &c1, &c2, &c3, &angle, &duration);
      if (c1 == 'A' && c2 == 'C' && c3 == 'A') servoRamps[AC_A].go(angle, duration);
      if (c1 == 'A' && c2 == 'C' && c3 == 'C') servoRamps[AC_C].go(180 - angle, duration);
      if (c1 == 'A' && c2 == 'B' && c3 == 'A') servoRamps[AB_A].go(180 - angle, duration);
      if (c1 == 'A' && c2 == 'B' && c3 == 'B') servoRamps[AB_B].go(angle, duration);
      if (c1 == 'B' && c2 == 'C' && c3 == 'B') servoRamps[BC_B].go(180 - angle, duration);
      if (c1 == 'B' && c2 == 'C' && c3 == 'C') servoRamps[BC_C].go(angle, duration);
      if (c1 == 'F' && c2 == 'L' && c3 == 'A') servoRamps[Flag].go(angle, duration);
    }
    else if (strstr(comunication_InBuffer, "Z ")) {
      int a1 = 90, a2 = 90, a3 = 90, a4 = 90, a5 = 90, t = 0;
      sscanf(comunication_InBuffer, "Z %i %i %i %i %i %i", &a1, &a2, &a3, &a4, &a5, &t);
      int pose[] = { a1, a2, a3, a4, a5};
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      setArmPose(pose, t);
    }
    else if (strstr(comunication_InBuffer, "pump set ")) {
      sprintf(comunication_OutBuffer, "OK");//max 29 Bytes
      comunication_write();//async
      char c1, c2, c3;
      int value = 0;
      sscanf(comunication_InBuffer, "pump set %c%c%c %i", &c1, &c2, &c3, &value);
      value = value ? 1 : 0;
      if (c1 == 'L' && c2 == 'E' && c3 == 'F') digitalWrite(pinNumberPump_L, value);
      if (c1 == 'R' && c2 == 'I' && c3 == 'G') digitalWrite(pinNumberPump_R, value);
    }
    else {
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}

void updateServos() {
  for (uint8_t i = 0; i < NB_SERVOS; i++)
    servos[i].write(servoRamps[i].update());

  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++)
    servos_M[i].write(servosRamp_M[i].update());
}

uint32_t lastControlMillis = 0;
uint32_t lastPositionMillis = 0;
uint32_t lastLedTime = 0;

/*
void loop() { // Motor test loop
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].setSpeed(0.1);

  while(1){
    for (uint8_t i = 0; i < NB_MOTORS; i++)
      motors[i].spin();
  }
}
*/

void loop() {
  executeOrder();
  uint32_t currMillis = millis();

  //Run position loop
  uint16_t positionMillis = 1000 / positionFrequency;
  if (currMillis - lastPositionMillis >= positionMillis) {
    lastPositionMillis = currMillis;
    updatePosition();
  }

  //Run control loop
  uint16_t controlMillis = 1000 / controlFrequency;
  if (currMillis - lastControlMillis >= controlMillis) {
    lastControlMillis = currMillis;
    control();
  }

  updateServos();

  // blink led
  if (currMillis - lastLedTime >= 500) {
    ledValue = !ledValue;
    digitalWrite(LED_PIN, ledValue);
    lastLedTime = currMillis;
  }

  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].spin();
}

/* Test PWM extender
  #include <Arduino.h>
  #define USE_PCA9685_SERVO_EXPANDER
  #include "ServoEasing.hpp"
  ServoEasing ServoExt_0(PCA9685_DEFAULT_ADDRESS, &Wire); // If you use more than one PCA9685 you probably must modify MAX_EASING_SERVOS at line 88 in ServoEasing.h
  ServoEasing ServoExt_1(PCA9685_DEFAULT_ADDRESS, &Wire);
  void setup() {
    Wire.begin();
    Wire.beginTransmission(PCA9685_DEFAULT_ADDRESS);
    ServoExt_0.attach(0, 90);
    ServoExt_1.attach(1, 90);
  }
  void loop() {
    ServoExt_0.write(90);
    ServoExt_1.write(90);
    delay(1000);
    ServoExt_0.write(0);
    ServoExt_1.write(0);
    delay(1000);
  }
*/
