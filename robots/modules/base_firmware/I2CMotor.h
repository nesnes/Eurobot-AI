#ifndef I2CMotor_h
#define I2CMotor_h

#include <Arduino.h>
#include <Wire.h>
#include <WirePacker.h>
#include <WireSlaveRequest.h>

#define SERIAL_MOTOR_BUFFER_SIZE 30
#define _2XPI 6.28318530718d

template <typename T> int I2C_writeAnything (WirePacker& packer, const T& value)
  {
    const byte * p = (const byte*) &value;
    unsigned int i;
    for (i = 0; i < sizeof value; i++)
          packer.write(*p++);
    return i;
  }  // end of I2C_writeAnything

template <typename T> int I2C_readAnything(WireSlaveRequest& slaveReq, T& value)
  {
    byte * p = (byte*) &value;
    unsigned int i;
    for (i = 0; i < sizeof value; i++)
          *p++ = slaveReq.read();
    return i;
  }
template <typename T> int I2C_singleWriteAnything (WirePacker& packer, const T& value) {
  int size = sizeof value;
  byte vals[size];
  const byte* p = (const byte*) &value;
  unsigned int i;
  for (i = 0; i < sizeof value; i++) {
    vals[i] = *p++;
  }
  
  packer.write(vals, size);
  return i;
}
  
class I2CMotor
{
public:
  I2CMotor(int address, float wheelPerimeter=100, bool invert=false, bool debug=false); //mm
  ~I2CMotor();
  
  void begin();

  void setSpeed(double speed, double syncFactor=1); //speed: m/s, syncFactor: 0..1 slows speed variation to keep sync with other motors
  double getSpeed(); //m/s
  double getRadSpeed(); //rad/s
  void spin();
  void spinDegrees(float degrees);
  double getAndResetDistanceDone();


//private:
  void parseInput();
  int m_address;
  
  bool m_inverted = false;
  bool m_debug = false;
  int m_direction = 1; //1 or -1
  float m_wheelPerimeter = 100; //mm
  double m_currSpeed = 0;
  double m_requestedSpeed = 0;
  double m_maxSpeed = 100;//rad/s
  unsigned long int lastAccelTime = 0;
  double m_maxAccel = 2.0;//rad/s^2 
  double m_syncFactor = 1;
  
  double m_oldSpeed = 0;

  double m_stepsDone = 0;
  double m_distanceDoneOffset = NAN;
  double m_distance = NAN;
  bool m_buttonA = false;
  bool m_buttonB = false;
  volatile char serialBufferOut[SERIAL_MOTOR_BUFFER_SIZE];
  volatile char serialBufferIn[SERIAL_MOTOR_BUFFER_SIZE];
  unsigned int serialInIndex = 0;
  unsigned long int lastTargetTime = 0;
  unsigned long int lastAngleTime = 0;
  unsigned long int lastButtonTime = 0;
};

#endif
