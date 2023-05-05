#ifndef BrushlessMotor_h
#define BrushlessMotor_h

#include <Arduino.h>
//#define BRUSHLESS_STEPCOUNT 30
//#define BRUSHLESS_STEP_PER_REVOLUTION 210
//#define BRUSHLESS_STEPCOUNT 60
//#define BRUSHLESS_STEP_PER_REVOLUTION 2445
//#define BRUSHLESS_STEP_PER_REVOLUTION 420
#define BRUSHLESS_STEPCOUNT 360
#define BRUSHLESS_POLE_PAIR_COUNT 4
#define BRUSHLESS_STEP_PER_REVOLUTION BRUSHLESS_STEPCOUNT * BRUSHLESS_POLE_PAIR_COUNT

#define _constrain(amt,low,high) ((amt)<(low)?(low):((amt)>(high)?(high):(amt)))

#define POWER_SUPPLY_VOLTAGE 24.f
#define BRUSHLESS_STATIC_POWER 0.15 // when speed is at 0
#define BRUSHLESS_MIN_POWER 0.3
#define BRUSHLESS_MAX_POWER 0.5 //0.70
#define BRUSHLESS_MAX_POWER_SPEED 0.3 // higher wheel speed will always use max power 

class BrushlessMotor
{
public:
  BrushlessMotor(int pinA, int pinB, int pinC, float wheelPerimeter=100, bool invert=false); //mm
  ~BrushlessMotor();
  
  bool begin();
  void setSpeed(double speed); // m/s
  double getSpeed(); //m/s
  void spin();
  float getTotalDistanceDone();
  void setPowerTarget(float value, bool overrideLimit=false); // from 0.0 to 1.0
  void enable();
  void disable();


//private:
  void computeSpeed();
  double getAndResetDistanceDone();
  void setVoltageLimit(float voltage);
  
  uint8_t m_pinA;
  uint8_t m_pinB;
  uint8_t m_pinC;
  
  float m_pwmSin[BRUSHLESS_STEPCOUNT];
  float m_resolutionMaxValue = 255;
  
  int m_currentStepA;
  int m_currentStepB;
  int m_currentStepC;
  float m_dcA;
  float m_dcB;
  float m_dcC;

  bool m_enabled = false;
  bool m_inverted = false;
  unsigned long m_lastMicro = 0;
  unsigned long m_lastAccelMicro = 0;
  unsigned long m_currSleep = 0;
  int m_direction = 1; //1 or -1
  float m_wheelPerimeter = 100; //mm
  float m_acceleration = 1.2;//m/s^2
  double m_currSpeed = 0;
  double m_requestedSpeed = 0;
  double m_totalDist = 0.0;
  float m_powerTarget = 1.0;
  double m_stepsDone = 0;
};

#endif // BrushlessMotor_h
