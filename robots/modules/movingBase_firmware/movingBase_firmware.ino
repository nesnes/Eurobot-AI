#include "comunication.h"
#include "actuators.h"
#include "moving.h"
#include <Metro.h>    //Include Metro library

int positionFrequency = 100; //Hz
int controlFrequency = 100; //Hz
Metro updatePos = Metro(1000 / positionFrequency);
Metro updateControl = Metro(1000 / controlFrequency);
Metro updateLed = Metro(500);


#define LED_PIN 13
bool ledValue = true;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  delay(2500);
  initActuators();      // Init servo and pumps
  initMotors();         // Init brushless motors
  comunication_begin(7);// Init communication I2C address 7 (not used, we're in serial mode for now)
}

void loop() {
  executeOrder();

  if (updatePos.check())  // Run position loop
    updatePosition();

  if (updatePos.check())  // Run control loop
    control();

  updateServos();

  if (updateLed.check()) { // blink led
    ledValue = !ledValue;
    digitalWrite(LED_PIN, ledValue);
  }

  spinMotors();
}



/*void loop() { // Motor test loop
  for (uint8_t i = 0; i < NB_MOTORS; i++)
   motors[i].setSpeed(0.1);

  while(1){
   for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].spin();
  }
  }*/




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

bool movementEnabled = false;
bool emergencyStop = false;
bool manualMode = false;

//In meters, degrees, m/s and °/s
double xStart = 0, yStart = 0, angleStart = 0;
double xTarget = 0, yTarget = 0, angleTarget = 0, speedTarget = 3.5, angleSpeedTarget = 50;

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
      setXPos((float)(x_pos) / 1000.0f);
      setYPos((float)(y_pos) / 1000.0f);
      setAnglePos(angle_pos);
      xTarget = getXPos();
      yTarget = getYPos();
      angleTarget = getAnglePos();
      updateAsserv();
    }
    else if (strstr(comunication_InBuffer, "pos getXY")) {
      sprintf(comunication_OutBuffer, "pos %i %i %i %i", (int)(getYPos() * 1000.0f), (int)(getXPos() * 1000.0f), (int)(getAnglePos()), (int)(targetSpeed_mps * 10));
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
      xStart = getXPos();
      yStart = getYPos();
      angleStart = getAnglePos();
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
        xStart = getXPos();
        yStart = getYPos();
        angleStart = getAnglePos();
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
      sprintf(comunication_OutBuffer, "%s %i %i %i %i %i", status, (int)(getYPos() * 1000.0f), (int)(getXPos() * 1000.0f), (int)(getAnglePos()), (int)(targetSpeed_mps * 10), targetPathIndex);
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
      xTarget = getXPos();
      yTarget = getYPos();
      angleTarget = getAnglePos();
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
      if (c1 == 'A' && c2 == 'C' && c3 == 'A') setServo(AC_A, angle, duration);
      if (c1 == 'A' && c2 == 'C' && c3 == 'C') setServo(AC_C, 180 - angle, duration);
      if (c1 == 'A' && c2 == 'B' && c3 == 'A') setServo(AB_A, 180 - angle, duration);
      if (c1 == 'A' && c2 == 'B' && c3 == 'B') setServo(AB_B, angle, duration);
      if (c1 == 'B' && c2 == 'C' && c3 == 'B') setServo(BC_B, 180 - angle, duration);
      if (c1 == 'B' && c2 == 'C' && c3 == 'C') setServo(BC_C, angle, duration);
      if (c1 == 'F' && c2 == 'L' && c3 == 'A') setServo(Flag, angle, duration);
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
      if (c1 == 'L' && c2 == 'E' && c3 == 'F') setPump(L, value);
      if (c1 == 'R' && c2 == 'I' && c3 == 'G') setPump(R, value);
    }
    else {
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}

void control() {
  if (emergencyStop || !movementEnabled) {
    stopMotors();
    return;
  }
  if (runTargetPath)
    updatePath();
  if (!manualMode)
    updateAsserv();
    
#ifdef SERIAL_DEBUG
  printCharts();
#endif

  setRobotSpeed(targetSpeed_mps, targetMovmentAngle, targetAngleSpeed_dps);
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
  double translationError = sqrt(pow(getXPos() - xTarget, 2) + pow(getYPos() - yTarget, 2)); // meters
  double rotationError = angleDiff(angleTarget, getAnglePos());
  if (targetPathIndex < targetPathSize - 1
      && translationError < nextPathTranslationError
      && rotationError < nextPathRotationError) {
    targetPathIndex++;
    //Reset startPos for accel ramp
    xStart = getXPos();
    yStart = getYPos();
    angleStart = getAnglePos();
  }

  //Set new target
  xTarget = targetPath[targetPathIndex].x;
  yTarget = targetPath[targetPathIndex].y;
  angleTarget = targetPath[targetPathIndex].angle;
}

void updateAsserv() {
  //Translation
  double xDiff = xTarget - getXPos();
  double yDiff = yTarget - getYPos();
  double translationError = sqrt(pow(getXPos() - xTarget, 2) + pow(getYPos() - yTarget, 2)); // meters
  double translationAngle = 0;
  if (xDiff != 0.f)
    translationAngle = atan2(xDiff, yDiff) * RAD_TO_DEG;
  else if (yDiff < 0.f)
    translationAngle = -180;

  targetMovmentAngle = angleDiff(translationAngle, getAnglePos());

  //Translation Speed
  double minSpeed = 0.05;
  if (runTargetPath && targetPathIndex > 0 && targetPathIndex < targetPathSize - 1)
    minSpeed = 0.1;
  double slowDownDistance = 0.20;//m
  double distFromStart = sqrt(pow(getXPos() - xStart, 2) + pow(getYPos() - yStart, 2)); // meters
  double distFromEnd = translationError;
  targetSpeed_mps = applySpeedRamp(distFromStart, distFromEnd, slowDownDistance, speedTarget, minSpeed);

  //Rotation
  double angleMinSpeed = 10;//deg/s
  double slowDownAngle = 25;//deg
  double rotationError = angleDiff(angleTarget, getAnglePos());
  double rotationFromStart = angleDiff(angleStart, getAnglePos());

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

double applySpeedRamp(double distFromStart, double distFromEnd, double rampDist, double speedTarget, double minSpeed) {
  double speed = speedTarget;
  double errorSign = distFromEnd > 0 ? 1 : -1;
  double startRampDist = rampDist / 4;
  double endRampDist = rampDist;

  if (abs(distFromStart) < startRampDist or abs(distFromEnd) < endRampDist) {
    if (abs(distFromStart) < abs(distFromEnd)) {
      speed = minSpeed + (speedTarget - minSpeed) * 1.0 / startRampDist * abs(distFromStart);
    }
    else {
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


void printCharts() {
  //Position
  Serial.print(getXPos() * 1000); Serial.print(" ");
  Serial.print(getYPos() * 1000); Serial.print(" ");
  Serial.print(xTarget * 1000); Serial.print(" ");
  Serial.print(yTarget * 1000); Serial.print(" ");

  //Angle
  Serial.print(getAnglePos()); Serial.print(" ");
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
    Serial.print(getMotorSpeed(i)); Serial.print(" ");
    //Serial.print(getMotorSpeed(i)*1000);Serial.print(" ");
  }

  Serial.print("\r\n");
}
