#include "I2CMotor.h"

I2CMotor::I2CMotor(int address, float wheelPerimeter, bool invert, bool debug)
	: m_address(address)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
  , m_debug(debug)
{
	
}

I2CMotor::~I2CMotor(){
	
}
  
void I2CMotor::begin(){
}

double I2CMotor::getAndResetDistanceDone(){
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

void I2CMotor::setSpeed(double speed, double syncFactor){ // m/s
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

double I2CMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

double I2CMotor::getRadSpeed(){ // rad/s
  double revPerMeter = (m_currSpeed*1000.0d)/m_wheelPerimeter;
  double radSpeed = revPerMeter*_2XPI;
  return radSpeed;
}

void I2CMotor::parseInput(){
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

void I2CMotor::spin(){
  unsigned long int now = millis();

  if(now - lastTargetTime >= 10) { // Send speed target
    double dir = 1.0;
    if(m_inverted) dir = -1.0;
    m_currSpeed = m_requestedSpeed * dir;
    if(isnan(m_currSpeed)) m_currSpeed = 0;
    
    WireSlaveRequest slaveReq(Wire, m_address, 32);
    slaveReq.setAttempts(1);
    slaveReq.setRetryDelay(5);
    bool success = slaveReq.request();
    if (success) {
      
          //Serial.print(m_address);
          if(slaveReq.available()==6){
            //Serial.print("Got");
            float f=0;
            I2C_readAnything(slaveReq, f);
            /*((byte*)(&f))[0] = slaveReq.read();
            ((byte*)(&f))[1] = slaveReq.read();
            ((byte*)(&f))[2] = slaveReq.read();
            ((byte*)(&f))[3] = slaveReq.read();*/
            if(!isnan(f)){ m_distance = f; }
            /*Serial.print(f);
            Serial.print(" ");
            Serial.print(slaveReq.read());
            Serial.print(" ");
            Serial.print(slaveReq.read());*/
          }
          while (slaveReq.available()) {  // loop through all but the last byte
              int c = slaveReq.read();
          }
          
          int x = slaveReq.read();    // receive byte as an integer
          //Serial.println(x);          // print the integer
      }
      /*else {
          // if something went wrong, print the reason
          Serial.print(m_address);
          Serial.println(slaveReq.lastStatusToString());
      }*/
      WirePacker packer;
      packer.write('T');
      I2C_singleWriteAnything(packer, (float)m_currSpeed);
      /*packer.write(((byte*)(&m_currSpeed))[0]);
      packer.write(((byte*)(&m_currSpeed))[1]);
      packer.write(((byte*)(&m_currSpeed))[2]);
      packer.write(((byte*)(&m_currSpeed))[3]);*/
      packer.end();
      Wire.beginTransmission(m_address);
      while (packer.available()) {    // write every packet byte
          Wire.write(packer.read());
      }
      Wire.endTransmission();
    
    /*WirePacker packer;
    packer.write('T');
    I2C_writeAnything(packer, (float)m_currSpeed);
    packer.end();
    
    Wire.beginTransmission(m_address);
    while (packer.available()) {
        Wire.write(packer.read());
    }
    Wire.endTransmission();

    WireSlaveRequest slaveReq(Wire, m_address, 32);
    slaveReq.setAttempts(1);
    slaveReq.setRetryDelay(5);
    bool success = slaveReq.request();
    float distance = NAN;
    int requestSize = sizeof distance + sizeof m_buttonA + sizeof m_buttonB;
    if (success and slaveReq.available() >= requestSize) {
      I2C_readAnything(slaveReq, distance);
      I2C_readAnything(slaveReq, m_buttonA);
      I2C_readAnything(slaveReq, m_buttonB);
    }
    else{
      Serial.print(slaveReq.lastStatusToString());
      Serial.print(" s:");
      Serial.print(success);
      Serial.print(" a:");
      Serial.print(slaveReq.available());
      Serial.print(" / ");
      Serial.println(requestSize);
    }
    if(!isnan(distance)){ m_distance = distance;
      Serial.println(m_distance);
    }
    while(slaveReq.available()) slaveReq.read(); // read remaining if any
    */
    lastTargetTime = now;
  }
  /*else if(now - lastAngleTime >= 50) {  // Send angle request
    WirePacker packer;
    packer.write('G');
    packer.end();
    Wire.beginTransmission(m_address);
    while (packer.available()) {
        Wire.write(packer.read());
    }
    Wire.endTransmission();

    WireSlaveRequest slaveReq(Wire, m_address, 32);
    slaveReq.setRetryDelay(1);
    bool success = slaveReq.request();
    float distance = NAN;
    if (success and slaveReq.available() == sizeof distance) {
      I2C_readAnything(slaveReq, distance);
    }
    if(!isnan(distance)){ m_distance = distance;
    Serial.println(m_distance);
    }
    lastAngleTime = now;
  }
  else if(now - lastButtonTime >= 200) {  // Send button request
    WirePacker packer;
    packer.write('B');
    packer.end();
    Wire.beginTransmission(m_address);
    while (packer.available()) {
        Wire.write(packer.read());
    }
    Wire.endTransmission();

    WireSlaveRequest slaveReq(Wire, m_address, 32);
    slaveReq.setRetryDelay(1);
    bool success = slaveReq.request();
    if (success and slaveReq.available() == sizeof m_buttonA + sizeof m_buttonB) {
      I2C_readAnything(slaveReq, m_buttonA);
      I2C_readAnything(slaveReq, m_buttonB);
    }
    lastButtonTime = now;
  }*/

}
