#ifndef ElmoMotor_h
#define ElmoMotor_h

#include <Arduino.h>
#include <Metro.h>    //Include Metro library

#define _constrain(amt,low,high) ((amt)<(low)?(low):((amt)>(high)?(high):(amt)))
#define ELMO_ENCODER_RESOLUTION 524288 // Encoder ticks per revolution
#define ELMO_SERIAL_READ_BUFFER_SIZE 32

class ElmoMotor
{
public:
  ElmoMotor(HardwareSerial& serial, float wheelPerimeter=100, bool invert=false); //mm
  ~ElmoMotor();
  
  bool begin();
  void setSpeed(double speed); // m/s
  double getSpeed(); //m/s
  void spin();
  void enable();
  void disable();


//private:
  void computeSpeed();
  double getAndResetDistanceDone();
  void setVoltageLimit(float voltage);

  Metro m_updateFrequency;
  HardwareSerial& m_serial;
  char m_serialBuffer[ELMO_SERIAL_READ_BUFFER_SIZE];
  int m_serialReadIndex = 0;
  int32_t m_lastPositionRead = 0;
  int32_t m_positionAtReset = 0;
  bool gotFirstPosition = false;
  bool m_enabled = false;
  bool m_inverted = false;
  unsigned long m_lastAccelMicro = 0;
  int m_direction = 1; //1 or -1
  float m_wheelPerimeter = 100; //mm
  float m_acceleration = 1.2;//m/s^2
  double m_currSpeed = 0;
  double m_currSpeedTicksPerSec = 0;
  double m_requestedSpeed = 0;
};

#endif // BrushlessMotor_h
