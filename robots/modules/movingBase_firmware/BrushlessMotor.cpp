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
  
bool BrushlessMotor::begin(){
  m_currentStepA = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*0.0f);
  m_currentStepB = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*1.0f);
  m_currentStepC = (int)(((float)(BRUSHLESS_STEPCOUNT)/3.0f)*2.0f);
  for(int i=0;i<BRUSHLESS_STEPCOUNT;i++){
    m_pwmSin[i] = 0.5f + 0.5f*sin( ((2.0f*PI)/(float)(BRUSHLESS_STEPCOUNT)) *(float)(i) );
  }
  m_resolutionMaxValue = 1023;
  pinMode(m_pinA, OUTPUT);
  pinMode(m_pinB, OUTPUT);
  pinMode(m_pinC, OUTPUT);
  analogWriteFrequency(m_pinA, 18310); //31250 //146484
  analogWriteFrequency(m_pinB, 18310);
  analogWriteFrequency(m_pinC, 18310);
  analogWriteResolution(10);
  return true;
}


void BrushlessMotor::enable()
{
  if(m_enabled) return;
  m_enabled = true;
}

void BrushlessMotor::disable()
{
  if(!m_enabled) return;
  m_enabled = false;
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

void BrushlessMotor::setSpeed(double speed){ // m/s
  m_requestedSpeed = speed;
}

double BrushlessMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

void BrushlessMotor::setPowerTarget(float value, bool overrideLimit){
  if(overrideLimit){
    m_powerTarget = _constrain(value, 0.f, 1.f);
  }
  else {
    m_powerTarget = _constrain(value, BRUSHLESS_MIN_POWER, BRUSHLESS_MAX_POWER);
  }
}

void BrushlessMotor::computeSpeed(){
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

  // Compute target power
  double absCurrSpeed = abs(m_currSpeed);
  double factorOfMaxSpeed = _constrain(absCurrSpeed / BRUSHLESS_MAX_POWER_SPEED, 0.0, 1.0);
  double targetPower = _constrain(factorOfMaxSpeed*BRUSHLESS_MAX_POWER, BRUSHLESS_MIN_POWER, BRUSHLESS_MAX_POWER);
  if(!m_enabled){
    setPowerTarget(0.0, true);
  }
  else if(absCurrSpeed < 0.001){
    setPowerTarget(BRUSHLESS_STATIC_POWER, true);
  }
  else {
    setPowerTarget(targetPower);
  }
  
  //Compute direction
  if(m_inverted) m_direction = m_currSpeed>0.0d?-1:1;
  else  m_direction = m_currSpeed>0.0d?1:-1;

  // Compute sleep duration between steps
  if(m_wheelPerimeter==0) return; // avoid division by 0
  double revPerMeter = (absCurrSpeed*1000.0d)/m_wheelPerimeter; //speed*1000 -> m to mm
  unsigned long stepCount = double(BRUSHLESS_STEP_PER_REVOLUTION) * revPerMeter;
  if(stepCount>=1UL)
    m_currSleep = 1000000UL/stepCount;
  else
    m_currSleep = 0; 
}

void BrushlessMotor::spin(){
  // Compute time since last call to spin
  unsigned long currMicro = micros();
  unsigned long diffMicro = currMicro - m_lastMicro;
  if(currMicro < m_lastMicro){ //handle overflow (not in any expected usage duration)
    diffMicro = 0;
  }

  // Compute target speed
  computeSpeed();
  
  
  /*if(m_outputInitialized)
  {
    if(m_currSleep == 0UL || diffMicro < m_currSleep) return; //Nothing to do
  }*/
  // Update target motor step
  if(m_currSleep != 0 && diffMicro>=m_currSleep){
    m_currentStepA = m_currentStepA + m_direction;
    if(m_currentStepA > BRUSHLESS_STEPCOUNT-1) m_currentStepA = 0;
    if(m_currentStepA<0) m_currentStepA = BRUSHLESS_STEPCOUNT-1;
     
    m_currentStepB = m_currentStepB + m_direction;
    if(m_currentStepB > BRUSHLESS_STEPCOUNT-1) m_currentStepB = 0;
    if(m_currentStepB<0) m_currentStepB = BRUSHLESS_STEPCOUNT-1;
     
    m_currentStepC = m_currentStepC + m_direction;
    if(m_currentStepC > BRUSHLESS_STEPCOUNT-1) m_currentStepC = 0;
    if(m_currentStepC<0) m_currentStepC = BRUSHLESS_STEPCOUNT-1;
    m_lastMicro = currMicro;
    m_stepsDone += m_direction;
  }

  // Compute output analog phase values
  m_dcA = _constrain(m_pwmSin[m_currentStepA]*m_powerTarget, 0.f, 1.f);
  m_dcB = _constrain(m_pwmSin[m_currentStepB]*m_powerTarget, 0.f, 1.f);
  m_dcC = _constrain(m_pwmSin[m_currentStepC]*m_powerTarget, 0.f, 1.f);
  unsigned int duty_a = _constrain(m_dcA*m_resolutionMaxValue, 0, m_resolutionMaxValue);
  unsigned int duty_b = _constrain(m_dcB*m_resolutionMaxValue, 0, m_resolutionMaxValue);
  unsigned int duty_c = _constrain(m_dcC*m_resolutionMaxValue, 0, m_resolutionMaxValue);

  // Apply phase values
  analogWrite(m_pinA, duty_a);
  analogWrite(m_pinB, duty_b);
  analogWrite(m_pinC, duty_c);
}
