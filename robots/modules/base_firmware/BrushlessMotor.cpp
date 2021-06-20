#include "BrushlessMotor.h"

BrushlessMotor::BrushlessMotor(int pinA, int pinB, int pinC, int sensorPin, int currentSensA, int currentSensB, float wheelPerimeter, bool invert)
	: motor(11)
  , driver(pinA, pinB, pinC)
  , sensor(sensorPin, 2, 1023)
  , current_sense(0.01, 50.0, currentSensA, currentSensB)
  , m_pinA(pinA)
  , m_pinB(pinB)
  , m_pinC(pinC)
  , m_wheelPerimeter(wheelPerimeter) //mm
  , m_inverted(invert)
{
	
}

BrushlessMotor::~BrushlessMotor(){
	
}
  
void BrushlessMotor::begin(){
  if(useFOC) {
    sensor.init();
    motor.linkSensor(&sensor);
  }
  
  driver.voltage_power_supply = 14;
  driver.init();
  motor.linkDriver(&driver);
  current_sense.init();
  motor.linkCurrentSense(&current_sense);

   
  if(useFOC){
    motor.torque_controller = TorqueControlType::dc_current; 
    motor.controller = MotionControlType::velocity;
  }
  else {
    motor.controller = MotionControlType::velocity_openloop;
  }
  motor.PID_velocity.P = 0.2;
  motor.PID_velocity.I = 20;
  motor.PID_velocity.D = 0;
  motor.LPF_velocity.Tf = 0.01;
  
  motor.voltage_limit = 14;
  motor.current_limit = 1.3;
  motor.velocity_limit = 100; // [rad/s]
  // jerk control using voltage voltage ramp
  // default value is 300 volts per sec  ~ 0.3V per millisecond
  motor.PID_velocity.output_ramp = 1000;
  
  motor.init();
  if(useFOC)
  {
    motor.initFOC();
  }
}

double BrushlessMotor::getAndResetDistanceDone(){
  double angleDone = motor.shaft_angle/**180.0/PI*/ - m_angleDoneOffset; //get
  m_angleDoneOffset = motor.shaft_angle; //reset
  //double stepsDone = m_stepsDone;
  //m_stepsDone = 0;
  //if(stepsDone==0) return 0;
  double revolutions = angleDone/_2PI;// 360.0;
  double distance = (revolutions*m_wheelPerimeter)/1000.0d; //meters
  if(m_inverted) distance *= -1.0d;
  return distance;
}

void BrushlessMotor::setSpeed(double speed, double syncFactor){ // m/s
  m_requestedSpeed = speed;
  m_syncFactor = syncFactor;
}

double BrushlessMotor::getSpeed(){ // m/s
  return m_currSpeed;  
}

float BrushlessMotor::getPower(){ // m/s
  return m_power;  
}

void BrushlessMotor::computeSpeed(){
  //Acceleration
  double speedStep = 0.005*m_syncFactor;//0.001
  double absCurrSpeed = abs(m_currSpeed);
  double absRequestedSpeed = abs(m_requestedSpeed);
  if(m_requestedSpeed == 0 && absCurrSpeed<=speedStep){
    m_currSpeed = 0;
    absCurrSpeed = 0;
  }
  else if(m_requestedSpeed>m_currSpeed) m_currSpeed += speedStep;
  else if (m_requestedSpeed<m_currSpeed) m_currSpeed -= speedStep;
  absCurrSpeed = fabs(m_currSpeed);

  //Power
  m_powerCount+=m_syncFactor;
  if(m_power>BRUSHLESS_MAX_POWER) m_power = BRUSHLESS_MAX_POWER;
  if(m_power<BRUSHLESS_MIN_POWER) m_power = BRUSHLESS_MIN_POWER;
  
  //Compute timers
  if(m_inverted) m_direction = m_currSpeed>0.0d?-1:1;
  else  m_direction = m_currSpeed>0.0d?1:-1;
  double revPerMeter = (absCurrSpeed*1000.0d)/m_wheelPerimeter; //speed*1000 -> m to mm
  double stepCount = double(BRUSHLESS_STEP_PER_REVOLUTION) * revPerMeter;
  if(stepCount>=1)
    m_currSleep = 1000000.0d/stepCount;
  else
    m_currSleep = 0;
 
}

void BrushlessMotor::spin(){
  //computeSpeed();
  if(m_inverted) m_currSpeed = -m_requestedSpeed;
  else m_currSpeed = m_requestedSpeed;
  // convert speed from m/s to rad/s
  //double absCurrSpeed = abs(m_currSpeed);
  double revPerMeter = (m_currSpeed*1000.0d)/m_wheelPerimeter;
  double radSpeed = revPerMeter*2.0*PI;
  if(useFOC) motor.loopFOC();
  motor.move(radSpeed);
}
