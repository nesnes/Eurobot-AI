#include "BrushlessFOCMotor.h"

BrushlessFOCMotor::BrushlessFOCMotor(int pinA, int pinB, int pinC, double wheelPerimeter, bool invert, int pinEnable, int encoderCS, int pinCurrentSenseA, int pinCurrentSenseB, int pinCurrentSenseC)
  : m_pinA(pinA)
  , m_pinB(pinB)
  , m_pinC(pinC)
  , m_pinEnable(pinEnable)
  , m_encoderCS(encoderCS)
  , m_pinCurrentSenseA(pinCurrentSenseA)
  , m_pinCurrentSenseB(pinCurrentSenseB)
  , m_pinCurrentSenseC(pinCurrentSenseC)
  , m_inverted(invert?-1.0:1.0)
  , m_wheelPerimeter(wheelPerimeter) //mm
{
   // init MCP23017
  bool mcpInitOk = false;
  while(!mcpInitOk){
    mcpInitOk = m_mcp.begin_I2C(MCP23017_ADDR, &Wire2);
    if(!mcpInitOk) {
      //Serial.println("# Cannot initialize MCP23017 from BrushlessFOCMotor.");
      delay(1);
    }
  }

  // Disable motor while not initialised
  m_mcp.pinMode(m_pinEnable, OUTPUT);
  m_mcp.digitalWrite(m_pinEnable, 0);

}

BrushlessFOCMotor::~BrushlessFOCMotor(){
	
}

void BrushlessFOCMotor::enable()
{
  if(m_enabled) return;
  m_enabled = true;
  m_mcp.digitalWrite(m_pinEnable, 1);
  m_motor->current_limit = m_maxCurrent;
}

void BrushlessFOCMotor::disable()
{
  if(!m_enabled) return;
  m_enabled = false;
  m_mcp.digitalWrite(m_pinEnable, 0);
  m_motor->current_limit = 0.0001;
}
  
bool BrushlessFOCMotor::begin(){
  //SimpleFOCDebug::enable();
  
  // Encoder (AS5048A)
  m_encoder = new MagneticSensorSPIWithMCP23017(AS5048_SPI, m_encoderCS);
  m_encoder->init();

  // Driver
  m_driver = new BLDCDriver3PWM(m_pinA, m_pinB, m_pinC);
  m_driver->pwm_frequency = 20000;
  m_driver->voltage_power_supply = 25;
  m_driver->voltage_limit = 25; // should match power supply
  m_driver->init();

  // Enable motor through MCP23017
  enable();

  m_driver->enable();
  //delay(1000);
  //m_driver->setPwm(3,1,5);
  //return;

  m_currentSense = new InlineCurrentSense(0.005f, 50.f, m_pinCurrentSenseA, m_pinCurrentSenseB, m_pinCurrentSenseC);
  /*m_currentSense->init();
  m_currentSense->gain_a *=-1;
  m_currentSense->gain_b *=-1;
  m_currentSense->gain_c *=-1;*/
  //m_currentSense->skip_align = true;
  m_currentSense->linkDriver(m_driver);

  // Motor (HT02002-A00)
  int polePaires = 4;
  float phaseResistance_R = 0.625;
  float bemf_Ke = 0.060; // V.s/rad
  float speedConstant_Kv = 159.15495; // 60 * (1/ke) / (2PI)  // rpm/v
  float phaseInductance_L = 0.00047; // H
  m_motor = new BLDCMotor(polePaires);//, phaseResistance_R);//, speedConstant_Kv, phaseInductance_L);
  {
    //m_motor->voltage_limit = 3;
    //m_motor->velocity_limit = 5;
    //m_motor->controller = MotionControlType::velocity_openloop;
  }
  m_motor->torque_controller = TorqueControlType::foc_current; // Change to foc_currrent when current sensing available
  m_motor->foc_modulation = FOCModulationType::SinePWM;
  m_motor->controller = MotionControlType::velocity; // Can use velocity_openloop if encoders have issues

  m_motor->voltage_sensor_align = 5; //V
  m_motor->current_limit = 4.0; // Amps
  m_motor->linkDriver(m_driver);
  m_motor->linkSensor(m_encoder);
  m_motor->init();

  m_motor->PID_velocity.P = 30;//30.0;
  m_motor->PID_velocity.I = 0.0;//0.0;
  m_motor->PID_velocity.D = 2.0;//2.0;
  m_motor->PID_velocity.output_ramp = 1000;
  //m_motor->LPF_velocity = 0.01;
  //m_motor->LPF_angle = 0.5;
  //m_encoder->min_elapsed_time = 0.015;
  m_motor->PID_current_q.P = 0.05;//0.05
  m_motor->PID_current_q.I = 6.0;//6.0
  m_motor->PID_current_q.D = 0.0;//0.0;
  //m_motor->LPF_angle.Tf = 0.01;
  
  m_motor->motion_downsample = 0;

  m_currentSense->init();
  m_motor->linkCurrentSense(m_currentSense);

  
  // Commutation
  return m_motor->initFOC();
}

void BrushlessFOCMotor::runFOC(){
  if(!m_motor) return;
  m_motor->loopFOC();
}

void BrushlessFOCMotor::spin(){
  if(!m_motor) return;
  //m_motor->loopFOC();

  if(!m_enabled) {
    m_motor->PID_velocity.reset();
    m_motor->PID_current_q.reset();
    return;
  }

  m_motor->move(m_targetSpeedRad);
}

void BrushlessFOCMotor::setSpeed(double speed){ // speed in m/s
  m_targetSpeedRad = speed / ((m_wheelPerimeter/1000.0d) / TWO_PI); // speed[m/s] / radius[m] = rad/s
}

double BrushlessFOCMotor::getSpeed() {
  if(!m_encoder) return 0;
  return m_encoder->getVelocity() * ((m_wheelPerimeter/1000.0d) / TWO_PI); // speed[rad.s] * radius[m] = m/s
}

double BrushlessFOCMotor::getAndResetDistanceDone(){
  if(!m_encoder) return 0;
  double actualAngle = m_encoder->getPreciseAngle(); // rad
  double elapsedAngle = actualAngle - m_lastAngle; // can be 0
  double distanceDone = m_inverted * (m_wheelPerimeter/1000.0d) * elapsedAngle / TWO_PI; // Meters
  m_lastAngle = actualAngle;
  return distanceDone;
}
