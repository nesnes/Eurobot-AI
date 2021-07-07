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
}

double SerialMotor::getAndResetDistanceDone(){
  if(isnan(m_distance) && isnan(m_distanceDoneOffset)) {
    return 0.0d; //not initialized
  }
  if(!isnan(m_distance) && isnan(m_distanceDoneOffset)) {
    m_distanceDoneOffset = m_distance;
    return 0.0d; //initializing
  }

  double distanceDone = m_distance - m_distanceDoneOffset; //get
  m_distanceDoneOffset = m_distance; //reset  
  if(m_inverted) distanceDone *= -1.0d;
  return distanceDone;
}

void SerialMotor::setSpeed(double speed, double syncFactor){ // m/s
  if(isnan(speed)) speed = 0.0;
  if(abs(speed) > m_maxSpeed) speed = speed>0.0?m_maxSpeed:-m_maxSpeed;
  /*unsigned long int now = millis();
  unsigned long int elapsed = now - lastAccelTime;
  double maxDelta = elapsed / 1000.0 * m_maxAccel;
  if(abs(speed - m_requestedSpeed) > maxDelta)
    speed = speed>m_requestedSpeed ? m_requestedSpeed+maxDelta : m_requestedSpeed-maxDelta;
  lastAccelTime = now;
  */
  m_requestedSpeed = speed;
  m_syncFactor = syncFactor;
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
      float distance=0;
      sscanf(serialBufferIn, "G %f", &distance);
      if(!isnan(distance)) m_distance = distance;
      break;
    }
    case 'B':{
      int bA=0, bB=0;
      sscanf(serialBufferIn, "B %i %i", &bA, &bB);
      m_buttonA = bA;
      m_buttonB = bB;
      break;
    }
    case 'T':{
      break;
    }
    default: {
      if(m_debug){ Serial.print("<< "); Serial.println((char*)serialBufferIn); }
      break;
    }
  }
}

void SerialMotor::spin(){
  unsigned long int now = millis();

  if(now - lastTargetTime >= 10) { // Send speed target
    double dir = 1.0;
    if(m_inverted) dir = -1.0;
    m_currSpeed = m_requestedSpeed * dir;
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    if(!isnan(m_currSpeed)) sprintf(serialBufferOut,"T %.5f\r\n", m_currSpeed);
    else sprintf(serialBufferOut,"T 0\r\n");
    serial_->print((char*)serialBufferOut);
    //if(m_debug) Serial.print((char*)serialBufferOut);
    lastTargetTime = now;
  }
  else if(now - lastAngleTime >= 10) {  // Send angle request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"G\r\n");
    serial_->print((char*)serialBufferOut);
    //if(m_debug) Serial.print((char*)serialBufferOut);
    lastAngleTime = now;
  }
  else if(now - lastButtonTime >= 200) {  // Send button request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"B\r\n");
    serial_->print((char*)serialBufferOut);
    //if(m_debug) Serial.print((char*)serialBufferOut);
    lastButtonTime = now;
  }
  else if(now - lastMemoryTime >= 100) {  // Send button request
    memset(serialBufferOut, '\0', SERIAL_MOTOR_BUFFER_SIZE);
    sprintf(serialBufferOut,"M\r\n");
    serial_->print((char*)serialBufferOut);
    //if(m_debug) Serial.print((char*)serialBufferOut);
    lastMemoryTime = now;
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
