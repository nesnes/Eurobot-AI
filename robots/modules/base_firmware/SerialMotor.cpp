#include "SerialMotor.h"

SerialMotor::SerialMotor(HardwareSerial* serial, float wheelPerimeter, bool invert, bool debug)
	: serial_(serial)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
  , m_debug(debug)
{
	
}

SerialMotor::~SerialMotor(){
	
}
  
void SerialMotor::begin(){
  serial_->begin(115200);
  memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
  sprintf(serialBufferOut,"E 1\n");
  serial_->print((char*)serialBufferOut);
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
  if(isnan(speed)) speed = 0.0;
  if(abs(speed) > m_maxSpeed) speed = speed>0.0?m_maxSpeed:-m_maxSpeed;
  unsigned long int now = millis();
  unsigned long int elapsed = now - lastAccelTime;
  double maxDelta = elapsed / 1000.0 * m_maxAccel;
  if(abs(speed - m_requestedSpeed) > maxDelta)
    speed = speed>m_requestedSpeed ? m_requestedSpeed+maxDelta : m_requestedSpeed-maxDelta;
  m_requestedSpeed = speed;
  m_syncFactor = syncFactor;
  lastAccelTime = now;
}

double SerialMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

double SerialMotor::getRadSpeed(){ // rad/s
  double revPerMeter = (m_currSpeed*1000.0d)/m_wheelPerimeter;
  double radSpeed = revPerMeter*_2XPI;
  return radSpeed;
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

  if(now - lastTargetTime >= 5) { // Send speed target
    double dir = 1.0;
    if(m_inverted) dir = -1.0;
    m_currSpeed = m_requestedSpeed * dir;
    
    double revPerMeter = (m_currSpeed*1000.0d)/m_wheelPerimeter;
    double radSpeed = revPerMeter*_2XPI;  
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    if(!isnan(radSpeed)) sprintf(serialBufferOut,"T %.3f\n", radSpeed);
    else sprintf(serialBufferOut,"T 0\n", radSpeed);
    serial_->print((char*)serialBufferOut);
    if(m_debug) Serial.print((char*)serialBufferOut);
    lastTargetTime = now;
  }
  else if(now - lastAngleTime >= 5) {  // Send angle request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"G\n");
    serial_->print((char*)serialBufferOut);
    if(m_debug) Serial.print((char*)serialBufferOut);
    lastAngleTime = now;
  }
  else if(now - lastButtonTime >= 50) {  // Send button request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"B\n");
    serial_->print((char*)serialBufferOut);
    if(m_debug) Serial.print((char*)serialBufferOut);
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
