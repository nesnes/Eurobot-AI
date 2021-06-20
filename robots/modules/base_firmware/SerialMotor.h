#ifndef SerialMotor_h
#define SerialMotor_h

#include <Arduino.h>

#define SERIAL_MOTOR_BUFFER_SIZE 30
#define _2XPI 6.28318530718d

class SerialMotor
{
public:
  SerialMotor(HardwareSerial* serial, float wheelPerimeter=100, bool invert=false); //mm
  ~SerialMotor();
  
  void begin();

  void setSpeed(double speed, double syncFactor=1); //speed: m/s, syncFactor: 0..1 slows speed variation to keep sync with other motors
  double getSpeed(); //m/s
  void spin();
  void spinDegrees(float degrees);
  double getAndResetDistanceDone();


//private:
  void parseInput();
  HardwareSerial* serial_;
  
  bool m_inverted = false;
  int m_direction = 1; //1 or -1
  float m_wheelPerimeter = 100; //mm
  double m_currSpeed = 0;
  double m_requestedSpeed = 0;
  double m_syncFactor = 1;
  
  double m_oldSpeed = 0;

  double m_stepsDone = 0;
  double m_angleDoneOffset = NAN;
  double m_motorAngle = NAN;
  bool m_buttonA = false;
  bool m_buttonB = false;
  volatile char serialBufferOut[SERIAL_MOTOR_BUFFER_SIZE];
  volatile char serialBufferIn[SERIAL_MOTOR_BUFFER_SIZE];
  unsigned int serialInIndex = 0;
  unsigned long int lastTargetTime = 0;
  unsigned long int lastAngleTime = 0;
  unsigned long int lastButtonTime = 0;
};

#endif // BrushlessMotor_h
