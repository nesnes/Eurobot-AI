#include "ElmoMotor.h"

ElmoMotor::ElmoMotor(HardwareSerial& serial, float wheelPerimeter, bool invert)
  : m_updateFrequency(1000.f / 200.f) // 200HZ of communication to write speed target
  , m_serial(serial)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
{
    memset(m_serialBuffer, '\0', ELMO_SERIAL_READ_BUFFER_SIZE);
}

ElmoMotor::~ElmoMotor(){
	
}
  
bool ElmoMotor::begin(){
  m_serial.begin(115200);
  return true;
}


void ElmoMotor::enable()
{
  if(m_enabled) return;
  m_enabled = true;
  m_serial.print("MO=1;");
}

void ElmoMotor::disable()
{
  if(!m_enabled) return;
  m_enabled = false;
  m_serial.print("MO=0;");
}

double ElmoMotor::getAndResetDistanceDone(){
  // Handle intialization
  if(!gotFirstPosition){
    m_positionAtReset = m_lastPositionRead;
    gotFirstPosition = true;
  }

  // Compute difference from last update
  double stepsDone = m_lastPositionRead - m_positionAtReset;
  m_positionAtReset = m_lastPositionRead;

  // Compute distance in meters
  if(stepsDone==0) return 0.d;
  double revolutions = (1.0d/double(ELMO_ENCODER_RESOLUTION))*stepsDone;
  double distance = (revolutions*m_wheelPerimeter)/1000.0d; //meters
  if(m_inverted) distance *= -1.0d;
  return distance;
}

void ElmoMotor::setSpeed(double speed){ // m/s
  m_requestedSpeed = speed;
}

double ElmoMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

void ElmoMotor::computeSpeed(){
  // Compute speed based on acceleration
  unsigned long now = micros();
  unsigned long elapsed = now - m_lastAccelMicro;
  if(now < m_lastAccelMicro){ //handle overflow (~every hours)
    elapsed = 0;
  }
  if(m_acceleration==0) return; // avoid division by 0
  double maxDelta = (double)(elapsed) / 1.0e6 * m_acceleration;
  if(abs(m_currSpeed - m_requestedSpeed) > maxDelta)
    m_currSpeed = m_currSpeed<m_requestedSpeed ? m_currSpeed+maxDelta : m_currSpeed-maxDelta;
  else m_currSpeed = m_requestedSpeed;
  m_lastAccelMicro = now;

  double revPerSecond = m_currSpeed / (m_wheelPerimeter/1000.d); // m/s divided by perimeter in meters
  m_currSpeedTicksPerSec = revPerSecond * double(ELMO_ENCODER_RESOLUTION);
  
  //Compute direction
  if(m_inverted) m_direction = m_currSpeed>0.0d?-1:1;
  else  m_direction = m_currSpeed>0.0d?1:-1;
}

void ElmoMotor::spin(){
  // Compute target speed
  computeSpeed();

  // Read incomming serial data
  while (m_serial.available()) {
    char inChar = (char)m_serial.read();
    //Serial.print(inChar);
    if (inChar == ';' || m_serialReadIndex>=ELMO_SERIAL_READ_BUFFER_SIZE-1) {
      m_serialBuffer[m_serialReadIndex+1] = '\0';
      // Parse data
      if (strstr(m_serialBuffer, "FP")) {
        // nope
      }
      else {
        sscanf(m_serialBuffer, "%li", &m_lastPositionRead);
      }
      
      memset(m_serialBuffer, '\0', ELMO_SERIAL_READ_BUFFER_SIZE);
      m_serialReadIndex = 0;
      break;
    }
    else{
      m_serialBuffer[m_serialReadIndex++] = inChar;
    }
  }

  // Apply speed target
  //speedInTicksPerSec
  if(m_updateFrequency.check()){
    if(m_enabled) {
      int32_t outputSpeed = m_direction ? m_currSpeedTicksPerSec : -m_currSpeedTicksPerSec;
      m_serial.print("JV="); m_serial.print(outputSpeed);m_serial.print(";"); // Set jog speed
      m_serial.print("BG;"); // Begin jog movement
      //Serial.print("JV="); Serial.print(outputSpeed);Serial.print(";"); // Set jog speed
      //Serial.print("BG;"); // Begin jog movement
    }
    m_serial.print("FP;"); // Request position
    //Serial.print("FP;"); // Request position. Answer is "FP;123456789;"
  }
}
