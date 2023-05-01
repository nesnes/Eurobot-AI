#ifndef BrushlessFOCMotor_h
#define BrushlessFOCMotor_h

#include <Arduino.h>
#include <SimpleFOC.h> // from https://github.com/simplefoc/Arduino-FOC
#include <Adafruit_MCP23X17.h> // from https://github.com/adafruit/Adafruit-MCP23017-Arduino-Library
#include "MagneticSensorSPIWithMCP23017.h"
#include "pin_def.h"

class BrushlessFOCMotor
{
public:
  BrushlessFOCMotor(int pinA, int pinB, int pinC, double wheelPerimeter=100, bool invert=false, int pinEnable=-1, int encoderCS=-1, int pinCurrentSenseA=-1, int pinCurrentSenseB=-1, int pinCurrentSenseC=-1); //mm
  ~BrushlessFOCMotor();
  bool begin();
  void runFOC();
  void spin();
  void enable();
  void disable();
  
  double getAndResetDistanceDone();

  void setSpeed(double speed); // m/s
  double getSpeed(); // m/s
  /*float getTotalDistanceDone();


//private:
  void computeSpeed();
  double getAndResetDistanceDone();
  void setVoltageLimit(float voltage);*/
  

  int m_pinA, m_pinB, m_pinC, m_pinEnable, m_encoderCS, m_pinCurrentSenseA, m_pinCurrentSenseB, m_pinCurrentSenseC;
  double m_inverted = false;
  double m_wheelPerimeter = 100; //mm
  double m_lastAngle{0};
  float m_targetSpeed; // m/s
  float m_targetSpeedRad; // rad/s
  bool m_enabled{false};
  float m_maxCurrent{3.f};

  BLDCMotor*          m_motor{nullptr};
  BLDCDriver*         m_driver{nullptr};
  MagneticSensorSPIWithMCP23017*  m_encoder{nullptr};
  InlineCurrentSense* m_currentSense{nullptr};
  Adafruit_MCP23X17   m_mcp;
};

#endif // BrushlessMotor_h
