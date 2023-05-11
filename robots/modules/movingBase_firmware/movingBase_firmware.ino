#include "comunication.h"
#include "moving.h"
#include "pin_def.h"
#include <Metro.h>    //Include Metro library
//#define SERIAL_DEBUG

float positionFrequency = 200; //Hz
float controlFrequency = 200; //Hz
float motorFrequency = 500; //Hz
float debugFrequency = 200; //Hz
Metro updatePos = Metro(1000.f / positionFrequency);
Metro updateControl = Metro(1000.f / controlFrequency);
Metro updateDebug = Metro(1000.f / debugFrequency);
Metro updateMotor = Metro(1000.f / motorFrequency);
Metro updateLed = Metro(500);

// measure control frequency
unsigned long freqStartTimeUpdateMotor = 0;
float freqUpdateMotor = 0.f;
unsigned long freqStartTimeFoc = 0;
float freqFoc = 0.f;
unsigned long freqStartTimeControl = 0;
float freqControl = 0.f;

//IntervalTimer focTimer;


#define LED_PIN PIN_LED_DEBUG
bool ledValue = true;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  comunication_begin(7);// Init communication I2C address 7 (not used, we're in serial mode for now)
  //delay(2500);
  initMotors();         // Init brushless motors
  //focTimer.begin(onFocInterrup, 1250); // every N microseconds
  //focTimer.priority(200); // lower priority than potential other interrupts
}

void loop() {
  executeOrder();

  // Run position loop
  if (updatePos.check()) { updatePosition(); }

#ifdef SERIAL_DEBUG
  if (updateDebug.check()) { printCharts(); }
#endif

  // Run control loop
  if (updateControl.check()) {
    control();
    unsigned long elapsed = micros() - freqStartTimeControl;
    freqControl = freqControl* 0.99f+0.01f *1.f/((float)(elapsed)/1000000.f);
    freqStartTimeControl = micros();
  }

  if (updateLed.check()) { // blink led
    ledValue = !ledValue;
    digitalWrite(LED_PIN, ledValue);
  }

  // Update motor control
  if (updateMotor.check()) {
    motorHighLevel();
    unsigned long elapsed = micros() - freqStartTimeUpdateMotor;
    freqUpdateMotor = freqUpdateMotor* 0.99f+0.01f *1.f/((float)(elapsed)/1000000.f);
    freqStartTimeUpdateMotor = micros();
  }
  
  motorLowLevel();
  unsigned long elapsed = micros() - freqStartTimeFoc;
  freqFoc = freqFoc* 0.99f+0.01f *1.f/((float)(elapsed)/1000000.f);
  freqStartTimeFoc = micros();
}


/*#include "MagneticSensorSPIWithMCP23017.h"
MagneticSensorSPIWithMCP23017*  encoder1{nullptr};
MagneticSensorSPIWithMCP23017*  encoder2{nullptr};
MagneticSensorSPIWithMCP23017*  encoder3{nullptr};

#include <Adafruit_MCP23X17.h>
Adafruit_MCP23X17 mcp_ext;
#include "BrushlessFOCMotor.h"
//BrushlessFOCMotor motor1(PIN_MOT1_INU, PIN_MOT1_INV, PIN_MOT1_INW, 186.5, false, PIN_MOT1_INH, PIN_MOT1_CS, PIN_MOT1_IMU, PIN_MOT1_IMV, PIN_MOT1_IMW);
//BrushlessFOCMotor motor1(PIN_MOT3_INU, PIN_MOT3_INV, PIN_MOT3_INW, 186.5, false, PIN_MOT3_INH, PIN_MOT3_CS, _NC, PIN_MOT3_IMV, PIN_MOT3_IMW);
//BrushlessFOCMotor motor1(PIN_MOT2_INU, PIN_MOT2_INV, PIN_MOT2_INW, 186.5, false, PIN_MOT2_INH, PIN_MOT2_CS, _NC, PIN_MOT2_IMV, PIN_MOT2_IMW);

void setup() {
  pinMode(PIN_LED_DEBUG, OUTPUT);
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT1_CS))->init();
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT2_CS))->init();
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT3_CS))->init();

  encoder1 = new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT1_CS);
  encoder1->init();
  encoder2 = new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT2_CS);
  encoder2->init();
  encoder3 = new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT2_CS);
  encoder3->init();
  
  Serial.println("# Befor init");
  //Serial.print(motor1.begin());
  Serial.println("# Start loop.");
  //motor1.setSpeed(0.1);
}

void loop() {

  if(updateControl.check()) {
    //motor1.spin();
    //Serial.print(">ActualSpeed:"); Serial.print(motor1.getSpeed(), 6);Serial.println("§m/s");
    //Serial.print(">ActualSpeedRaw:"); Serial.print(motor1.m_encoder->getVelocity(), 6);Serial.println("§m/s");
    //Serial.print(">q:"); Serial.print(motor1.m_motor->c.q, 6);Serial.println("§mA");

  encoder1->update();
  Serial.print(">angle1:"); Serial.print(encoder1->getAngle(), 4);Serial.println("§rad");
  encoder2->update();
  Serial.print(">angle2:"); Serial.print(encoder2->getAngle(), 4);Serial.println("§rad");
  encoder3->update();
  Serial.print(">angle3:"); Serial.print(encoder3->getAngle(), 4);Serial.println("§rad");

  }
  //Serial.print(">TargetSpeed:"); Serial.print(0.05);Serial.println("§_");
  //Serial.print(">phaseA:"); Serial.print(motor1.m_currentSense->getPhaseCurrents().a);Serial.println("§A");
  //Serial.print(">phaseB:"); Serial.print(motor1.m_currentSense->getPhaseCurrents().b);Serial.println("§A");
  //Serial.print(">phaseC:"); Serial.print(motor1.m_currentSense->getPhaseCurrents().c);Serial.println("§A");
  
  //delay(1);
  //delayMicroseconds(50);
}*/


/*void loop() { // Motor test loop
  for (uint8_t i = 0; i < NB_MOTORS; i++)
   motors[i].setSpeed(0.1);

  while(1){
   for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].spin();
  }
  }*/

/*#include "BrushlessMotor.h"
#include <Adafruit_MCP23X17.h> // from https://github.com/adafruit/Adafruit-MCP23017-Arduino-Library
Adafruit_MCP23X17 m_mcp;
BrushlessMotor motor1(PIN_MOT1_INU, PIN_MOT1_INV, PIN_MOT1_INW, 100, false);
BrushlessMotor motor2(PIN_MOT2_INU, PIN_MOT2_INV, PIN_MOT2_INW, 100, false);
BrushlessMotor motor3(PIN_MOT3_INU, PIN_MOT3_INV, PIN_MOT3_INW, 100, false);

void onSpinInterrupt(){
  motor1.spin();
  motor2.spin();
  motor3.spin();
  unsigned long elapsed = micros() - freqStartTimeFoc;
  freqFoc = freqFoc* 0.99f+0.01f *1.f/((float)(elapsed)/1000000.f);
  freqStartTimeFoc = micros();
}

void setup() {
  pinMode(PIN_LED_DEBUG, OUTPUT);
  // MCP23017
  bool mcpInitOk = false;
  while(!mcpInitOk){
    mcpInitOk = m_mcp.begin_I2C(MCP23017_ADDR, &Wire2);
    if(!mcpInitOk) {
      Serial.println("# Cannot initialize MCP23017.");
      delay(1);
    }
  }
  
  m_mcp.pinMode(PIN_MOT1_INH, OUTPUT);
  m_mcp.digitalWrite(PIN_MOT1_INH, 1);
  m_mcp.pinMode(PIN_MOT2_INH, OUTPUT);
  m_mcp.digitalWrite(PIN_MOT2_INH, 1);
  m_mcp.pinMode(PIN_MOT3_INH, OUTPUT);
  m_mcp.digitalWrite(PIN_MOT3_INH, 1);
  motor1.begin();
  motor1.enable();
  motor2.begin();
  motor2.enable();
  motor3.begin();
  motor3.enable();
  onSpinInterrupt();
  delay(10000);
  motor1.setSpeed(0.01);
  motor2.setSpeed(0.01);
  motor3.setSpeed(0.01);
}

void loop() {
  //if(abs(motor1.m_stepsDone) >= BRUSHLESS_STEP_PER_REVOLUTION) motor1.setSpeed(0);
  if (updateDebug.check()) {
    Serial.print(">DCA:");Serial.println(motor1.m_dcA, 4);
    Serial.print(">DCB:");Serial.println(motor1.m_dcB, 4);
    Serial.print(">DCC:");Serial.println(motor1.m_dcC, 4);
    Serial.print(">powerTarget:");Serial.println(motor1.m_powerTarget, 4);
    Serial.print(">FocFreq:"); Serial.print(freqFoc, 2);Serial.println("§Hz");
  }
  onSpinInterrupt();
}*/


bool movementEnabled = false;
bool emergencyStop = false;
bool manualMode = false;

//In meters, degrees, m/s and °/s
double xStart = 0, yStart = 0, angleStart = 0;
double xTarget = 0, yTarget = 0, angleTarget = 0, speedTarget = 3.5, angleSpeedTarget = 50, angleSpeedFactor = 180;

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
double speedLimit_mps = 0.0;//m/s

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
      sprintf(comunication_OutBuffer, "MovingBaseTDS");//max 29 Bytes
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
      int x_pos = 0, y_pos = 0, angle_pos = 0, reset_target = 1;
      sscanf(comunication_InBuffer, "pos set %i %i %i %i", &y_pos, &x_pos, &angle_pos, &reset_target);
      setXPos((float)(x_pos) / 1000.0f);
      setYPos((float)(y_pos) / 1000.0f);
      setAnglePos(angle_pos);
      if(reset_target){
        xTarget = getXPos();
        yTarget = getYPos();
        angleTarget = getAnglePos();
      }
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
      angleSpeedTarget = speedTarget * angleSpeedFactor;
      speedLimit_mps = 0;
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
        speedLimit_mps = 0;
        runTargetPath = false;
      }
      if (action == 0 || action == 1 || action == 2 || action == 3) { //add
        int idx = targetPathSize;
        targetPath[idx].x = (float)(i_x_pos) / 1000.0f;
        targetPath[idx].y = (float)(i_y_pos) / 1000.0f;
        targetPath[idx].angle = (float)(i_angle);
        speedTarget = (float)(i_speed_pos) / 10.0f;
        angleSpeedTarget = speedTarget * angleSpeedFactor;
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
    else if (strstr(comunication_InBuffer, "speed limit")) {
      sprintf(comunication_OutBuffer, "speed OK");
      comunication_write();//async
      int speedLimitInput = 0;
      sscanf(comunication_InBuffer, "speed limit %i", &speedLimitInput);
      speedLimit_mps = abs((float)(speedLimitInput) / 10.f);
    }
    else if (strstr(comunication_InBuffer, "move break")) {
      sprintf(comunication_OutBuffer, "move OK");
      comunication_write();//async
      emergencyStop = true;
      targetSpeed_mps = 0;
      targetAngleSpeed_dps = 0;
      speedLimit_mps = 0;
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
      speedLimit_mps = 0.f;
      emergencyStop = false;
      runTargetPath = false;
    }
    else {
      sprintf(comunication_OutBuffer, "ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}

void control() {
  if(!movementEnabled) { disableMotors(); }
  else { enableMotors(); }

  if (emergencyStop || !movementEnabled) {
    stopMotors();
    return;
  }
  if (runTargetPath) updatePath();
  if (!manualMode)   updateAsserv();
  
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
  double slowDownDistance = 0.20;//abs(0.50 * speedTarget);//m
  double distFromStart = sqrt(pow(getXPos() - xStart, 2) + pow(getYPos() - yStart, 2)); // meters
  double distFromEnd = translationError;
  targetSpeed_mps = applySpeedRamp(distFromStart, distFromEnd, slowDownDistance, speedTarget, minSpeed);

  //Rotation
  double angleMinSpeed = 10;//deg/s
  double slowDownAngle = 25;//deg
  double rotationError = angleDiff(angleTarget, getAnglePos());
  double rotationFromStart = angleDiff(angleStart, getAnglePos());

  targetAngleSpeed_dps = applySpeedRamp(rotationFromStart, rotationError, slowDownAngle, angleSpeedTarget, angleMinSpeed);
  // Apply speed limit
  if(speedLimit_mps>0.01) {
    // translation speed
    if(targetSpeed_mps>0) targetSpeed_mps = min(targetSpeed_mps, speedLimit_mps);
    else targetSpeed_mps = max(targetSpeed_mps, -speedLimit_mps);
    // Rotation speed
    if(targetAngleSpeed_dps>0) targetAngleSpeed_dps = min(targetAngleSpeed_dps, speedLimit_mps*angleSpeedFactor);
    else targetAngleSpeed_dps = max(targetAngleSpeed_dps, -speedLimit_mps*angleSpeedFactor);
  }

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
  // Preview charts with teleplot.fr
  // Position
  Serial.print(">posX:"); Serial.print(getXPos() * 1000, 4);Serial.println("§mm");
  Serial.print(">posY:"); Serial.print(getYPos() * 1000, 4);Serial.println("§mm");
  Serial.print(">targetX:"); Serial.print(xTarget * 1000, 4);Serial.println("§mm");
  Serial.print(">targetY:"); Serial.print(yTarget * 1000, 4);Serial.println("§mm");
  Serial.print(">targetReached:"); Serial.println(targetReached);

  // Angle
  Serial.print(">angle:"); Serial.print(getAnglePos(), 4);Serial.println("§deg");
  Serial.print(">targetAngle:"); Serial.print(angleTarget, 4);Serial.println("§deg");
  Serial.print(">targetMoveAngle:"); Serial.print(targetMovmentAngle, 4);Serial.println("§deg");

  // Angle Speed
  Serial.print(">targetAngleSpeed:"); Serial.print(targetAngleSpeed_dps, 4);Serial.println("§deg/s");
  Serial.print(">maxAngleSpeed:"); Serial.print(angleSpeedTarget, 4);Serial.println("§deg/s");

  // Position Speed
  Serial.print(">targetSpeed:"); Serial.print(targetSpeed_mps, 4);Serial.println("§m/s");
  Serial.print(">maxSpeed:"); Serial.print(speedTarget, 4);Serial.println("§m/s");

  // Motor Speed
  for (uint8_t i = 0; i < NB_MOTORS; i++) { // Display all motors speed or only 2 => i<2
    Serial.print(">motorSpeed");Serial.print(i);Serial.print(":");Serial.print(getMotorSpeed(i), 6);Serial.println("§deg/s");
    //Serial.print(getMotorSpeed(i)*1000);Serial.print(" ");
  }

  // Frequencies
  Serial.print(">MotorSpeedControlFreq:"); Serial.print(freqUpdateMotor, 2);Serial.println("§Hz");
  Serial.print(">XYControlFreq:"); Serial.print(freqControl, 2);Serial.println("§Hz");
  Serial.print(">FocFreq:"); Serial.print(freqFoc, 2);Serial.println("§Hz");
  

  //Serial.print("\r\n");
}
