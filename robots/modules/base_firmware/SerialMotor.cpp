#include "SerialMotor.h"

SerialMotor::SerialMotor(HardwareSerial* serial, float wheelPerimeter, bool invert)
	: serial_(serial)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
{
	
}

SerialMotor::~SerialMotor(){
	
}
  
void SerialMotor::begin(){
  serial_->begin(115200);
}

double SerialMotor::getAndResetDistanceDone(){
  if(isnan(m_motorAngle) && isnan(m_angleDoneOffset)) {
    return 0.0d; //not initialized
  }
  if(!isnan(m_motorAngle) && isnan(m_angleDoneOffset)) {
    m_angleDoneOffset = m_motorAngle;
    return 0.0d; //initializing
  }

  double angleDone = m_motorAngle - m_angleDoneOffset; //get
  m_angleDoneOffset = m_motorAngle; //reset  
  double revolutions = angleDone/_2XPI;// 360.0;
  double distance = (revolutions*m_wheelPerimeter)/1000.0d; //meters
  if(m_inverted) distance *= -1.0d;
  return distance;
  //return 0.0d;
}

void SerialMotor::setSpeed(double speed, double syncFactor){ // m/s
  m_requestedSpeed = speed;
  m_syncFactor = syncFactor;
}

double SerialMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

void SerialMotor::parseInput(){
  switch(serialBufferIn[0]){
    case 'G':{
      float angle=0;
      sscanf(serialBufferIn, "G %f", &angle);
      if(!isnan(angle)) m_motorAngle = angle;
      break;
    }
    case 'B':{
      int bA=0, bB=0;
      sscanf(serialBufferIn, "B %i %i", &bA, &bB);
      m_buttonA = bA;
      m_buttonB = bB;
      break;
    }
    default: {break;}
  }
}

void SerialMotor::spin(){
  unsigned long int now = millis();

  if(now - lastTargetTime >= 15) { // Send speed target
    if(m_inverted) m_currSpeed = -m_requestedSpeed;
    else m_currSpeed = m_requestedSpeed;
    double revPerMeter = (m_currSpeed*1000.0d)/m_wheelPerimeter;
    double radSpeed = revPerMeter*2.0*PI;  
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"T %f\r\n", radSpeed);
    serial_->print((char*)serialBufferOut);
    lastTargetTime = now;
  }
  else if(now - lastAngleTime >= 15) {  // Send angle request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"G\r\n");
    serial_->print((char*)serialBufferOut);
    lastAngleTime = now;
  }
  else if(now - lastButtonTime >= 30) {  // Send button request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"B\r\n");
    serial_->print((char*)serialBufferOut);
    lastButtonTime = now;
  }

  if (serial_->available()) {
    char byteIn = serial_->read();
    if (byteIn == '\n' || byteIn == '\r') {
      parseInput();
      serialInIndex = 0;
    }
    else if(serialInIndex < SERIAL_MOTOR_BUFFER_SIZE-1) {
      serialBufferIn[serialInIndex] = byteIn;
      serialInIndex++;
    }
    else {
      serialInIndex = 0;
    }
  }
  
  
}
