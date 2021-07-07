#include "BrushlessMotor.h"

BrushlessMotor::BrushlessMotor(int pinA, int pinB, int pinC, float wheelPerimeter, bool invert)
  : m_pinA(pinA)
  , m_pinB(pinB)
  , m_pinC(pinC)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
{
  
}

BrushlessMotor::~BrushlessMotor(){
  
}
  
void BrushlessMotor::begin(){
  m_currentStepA = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*0.0f);
  m_currentStepB = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*1.0f);
  m_currentStepC = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*2.0f);

  for(int i=0;i<BRUSHLESS_STEPCOUNT;i++){
    m_pwmSin[i] = 0.5f + 0.5f*sin( ((2.0f*PI)/(float)(BRUSHLESS_STEPCOUNT)) *(float)(i) );
    /*Serial.print(i);
    Serial.print("=");
    Serial.println(m_pwmSin[i]);*/
  }

  m_resolutionMaxValue = 1023;
  ledcSetup(0, 25000, 10);
  ledcSetup(1, 25000, 10);
  ledcSetup(2, 25000, 10);
  ledcAttachPin(m_pinA, 0);
  ledcAttachPin(m_pinB, 1);
  ledcAttachPin(m_pinC, 2);
}

double BrushlessMotor::getAndResetDistanceDone(){
  double stepsDone = m_stepsDone;
  m_stepsDone = 0;
  if(stepsDone==0) return 0;
  double revolutions = (1.0d/double(BRUSHLESS_STEP_PER_REVOLUTION))*stepsDone;
  double distance = (revolutions*m_wheelPerimeter)/1000.0d; //meters
  if(m_inverted) distance *= -1.0d;
  m_totalDist += distance;
  return distance;
}

float BrushlessMotor::getTotalDistanceDone(){
  getAndResetDistanceDone();
  return m_totalDist;
}

void BrushlessMotor::setSpeed(double speed){ // m/s
  m_requestedSpeed = speed;
}

double BrushlessMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

void BrushlessMotor::setVoltageLimit(float voltage){
  if(voltage<0) voltage = 0;
  if(voltage>POWER_SUPPLY_VOLTAGE) voltage = POWER_SUPPLY_VOLTAGE;
  m_voltageLimit = voltage;
}

void BrushlessMotor::computeSpeed(){
  //Acceleration
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

  // Compute voltage limit
  double absCurrSpeed = abs(m_currSpeed);
  if(absCurrSpeed>0.3) setVoltageLimit(15);
  else if(absCurrSpeed>0.2) setVoltageLimit(14);
  else if(absCurrSpeed>0.1) setVoltageLimit(12);
  else if(absCurrSpeed>0.01) setVoltageLimit(10);
  else setVoltageLimit(8);
  
  //Compute timers
  if(m_inverted) m_direction = m_currSpeed>0.0d?-1:1;
  else  m_direction = m_currSpeed>0.0d?1:-1;

  if(m_wheelPerimeter==0) return; // avoid division by 0
  double revPerMeter = (absCurrSpeed*1000.0d)/m_wheelPerimeter; //speed*1000 -> m to mm
  unsigned long stepCount = double(BRUSHLESS_STEP_PER_REVOLUTION) * revPerMeter;
  if(stepCount>=1UL)
    m_currSleep = 1000000UL/stepCount;
  else
    m_currSleep = 0; 
}

void BrushlessMotor::spin(){
  unsigned long currMicro = micros();
  unsigned long diffMicro = currMicro - m_lastMicro;
  if(currMicro < m_lastMicro){ //handle overflow (not in any expected usage duration)
    diffMicro = 0;
  }

  computeSpeed();
  
  
  if(m_outputInitialized)
  {
    if(m_currSleep == 0UL || diffMicro < m_currSleep) return; //Nothing to do
  }
  m_lastMicro = currMicro;

  m_currentStepA = m_currentStepA + m_direction;
  if(m_currentStepA > BRUSHLESS_STEPCOUNT-1) m_currentStepA = 0;
  if(m_currentStepA<0) m_currentStepA = BRUSHLESS_STEPCOUNT-1;
   
  m_currentStepB = m_currentStepB + m_direction;
  if(m_currentStepB > BRUSHLESS_STEPCOUNT-1) m_currentStepB = 0;
  if(m_currentStepB<0) m_currentStepB = BRUSHLESS_STEPCOUNT-1;
   
  m_currentStepC = m_currentStepC + m_direction;
  if(m_currentStepC > BRUSHLESS_STEPCOUNT-1) m_currentStepC = 0;
  if(m_currentStepC<0) m_currentStepC = BRUSHLESS_STEPCOUNT-1;

  float voltageFactor = m_voltageLimit / POWER_SUPPLY_VOLTAGE;
  float dc_a = _constrain(m_pwmSin[m_currentStepA]*voltageFactor, 0.f, 1.f);
  float dc_b = _constrain(m_pwmSin[m_currentStepB]*voltageFactor, 0.f, 1.f);
  float dc_c = _constrain(m_pwmSin[m_currentStepC]*voltageFactor, 0.f, 1.f);
  unsigned int duty_a = _constrain(dc_a*m_resolutionMaxValue, 0, m_resolutionMaxValue);
  unsigned int duty_b = _constrain(dc_b*m_resolutionMaxValue, 0, m_resolutionMaxValue);
  unsigned int duty_c = _constrain(dc_c*m_resolutionMaxValue, 0, m_resolutionMaxValue);

  ledcWrite(0, duty_a);
  ledcWrite(1, duty_b);
  ledcWrite(2, duty_c);

  if(m_outputInitialized) m_stepsDone += m_direction;
  else m_outputInitialized = true;
}
