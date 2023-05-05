#include "moving.h"
#include "pin_def.h"


const double wheelPerimeter = 176.75d;// 186.5d //188.495559215;//mm = pi*d = pi*60
const double reductionFactor = 3.75d;//3.75d

/*#ifdef TEENSYDUINO
const double wheelDistanceA = 125;//mm
const double wheelDistanceB = 125;//mm
const double wheelDistanceC = 125;//mm
const double wheelDistances[NB_MOTORS] = {wheelDistanceA, wheelDistanceB, wheelDistanceC};
#else
const double wheelDistanceA = 120;//mm
const double wheelDistanceB = 125.4;//mm
const double wheelDistanceC = 123;//mm
const double wheelDistances[NB_MOTORS] = {wheelDistanceA, wheelDistanceB, wheelDistanceC};
#endif*/

const double wheelDistanceA = 97.178;//mm
const double wheelDistanceB = 97.178;//mm
const double wheelDistanceC = 97.178;//mm
const double wheelDistances[NB_MOTORS] = {wheelDistanceA, wheelDistanceB, wheelDistanceC};

//#define BRUSHLESSFOCMOTORS // change to BRUSHLESSMOTORS or SERIALMOTORS or I2CMOTORS if needed and add dedicated .c and .h files
#define BRUSHLESSMOTORS

#ifdef BRUSHLESSFOCMOTORS
#include "BrushlessFOCMotor.h"
BrushlessFOCMotor motorC(PIN_MOT1_INU, PIN_MOT1_INV, PIN_MOT1_INW, wheelPerimeter, false, PIN_MOT1_INH, PIN_MOT1_CS, PIN_MOT1_IMU, PIN_MOT1_IMV, PIN_MOT1_IMW); //enable and CS pin are on MCP23017
BrushlessFOCMotor motorA(PIN_MOT2_INU, PIN_MOT2_INV, PIN_MOT2_INW, wheelPerimeter, false, PIN_MOT2_INH, PIN_MOT2_CS, _NC,          PIN_MOT2_IMV, PIN_MOT2_IMW); //enable and CS pin are on MCP23017
BrushlessFOCMotor motorB(PIN_MOT3_INU, PIN_MOT3_INV, PIN_MOT3_INW, wheelPerimeter, false, PIN_MOT3_INH, PIN_MOT3_CS, _NC,          PIN_MOT3_IMV, PIN_MOT3_IMW); //enable and CS pin are on MCP23017
volatile BrushlessFOCMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#endif

#ifdef BRUSHLESSMOTORS
#include "BrushlessMotor.h"
BrushlessMotor motorA(PIN_MOT2_INU, PIN_MOT2_INV, PIN_MOT2_INW, wheelPerimeter, true);
BrushlessMotor motorB(PIN_MOT3_INU, PIN_MOT3_INV, PIN_MOT3_INW, wheelPerimeter, true);
BrushlessMotor motorC(PIN_MOT1_INU, PIN_MOT1_INV, PIN_MOT1_INW, wheelPerimeter, true);
BrushlessMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#include <Adafruit_MCP23X17.h> // from https://github.com/adafruit/Adafruit-MCP23017-Arduino-Library
Adafruit_MCP23X17 motor_enable_mcp;
#endif

#ifdef SERIALMOTORS
#include "SerialMotor.h"
SerialMotor motorA(&Serial3, wheelPerimeter / reductionFactor, true, true);
SerialMotor motorB(&Serial4, wheelPerimeter / reductionFactor, true);
SerialMotor motorC(&Serial2, wheelPerimeter / reductionFactor, true);
SerialMotor motors[NB_MOTORS] = {motorA, motorB, motorC};
#endif

#ifdef I2CMOTORS
#include "I2CMotor.h"
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

#ifdef BRUSHLESSFOCMOTORS
  // Obscure magic but encoders need to all be enabled before any motor calibration
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT1_CS))->init();
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT2_CS))->init();
  (new MagneticSensorSPIWithMCP23017(AS5048_SPI, PIN_MOT3_CS))->init();
#endif

  for (uint8_t i = 0; i < NB_MOTORS; i++) {
    while(!motors[i].begin());
  }

#ifdef BRUSHLESSMOTORS
  motorLowLevel();
  // Enable motors through MCP23017
  bool mcpInitOk = false;
  while(!mcpInitOk){
    mcpInitOk = motor_enable_mcp.begin_I2C(MCP23017_ADDR, &Wire2);
    if(!mcpInitOk) {
      Serial.println("# Cannot initialize MCP23017 from moving.cpp .");
      delay(1);
    }
  }
  motor_enable_mcp.pinMode(PIN_MOT1_INH, OUTPUT);
  motor_enable_mcp.digitalWrite(PIN_MOT1_INH, 1);
  motor_enable_mcp.pinMode(PIN_MOT2_INH, OUTPUT);
  motor_enable_mcp.digitalWrite(PIN_MOT2_INH, 1);
  motor_enable_mcp.pinMode(PIN_MOT3_INH, OUTPUT);
  motor_enable_mcp.digitalWrite(PIN_MOT3_INH, 1);
#endif
}

void motorLowLevel(){
  #ifdef BRUSHLESSFOCMOTORS
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].runFOC();
  #endif
  
  #ifdef BRUSHLESSMOTORS
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].spin();
  #endif  
}

void motorHighLevel() {
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

void enableMotors(){
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].enable();
}
void disableMotors(){
  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].disable();
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
    speedsAngle[i] = 2.0d * PI * (wheelDistances[i] / 1000.d) * (targetAngleSpeed_dps / 360.0d); // Compute Rotation speed , arcLength in meters => speed m.s-1
    speeds[i] += speedsAngle[i] * 1.25; // Compound
  }

  for (uint8_t i = 0; i < NB_MOTORS; i++)
    motors[i].setSpeed(speeds[i]);
}

double getMotorSpeed(uint8_t i) {
  return motors[i].getSpeed();
}
