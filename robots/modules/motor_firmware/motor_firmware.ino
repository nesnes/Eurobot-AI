
#include <SimpleFOC.h>
#include <analogWrite.h>
#include <Adafruit_NeoPixel.h>

#define PIXEL_COUNT 12
#define REDUCTION_FACTOR 3.7
#define CONTACT_A 4
#define CONTACT_B 16
Adafruit_NeoPixel pixels(PIXEL_COUNT, 0, NEO_GRB + NEO_KHZ800);

MagneticSensorI2C sensor = MagneticSensorI2C(AS5600_I2C);

InlineCurrentSense current_sense = InlineCurrentSense(0.01, 50.0, A4, A5);
// BLDC motor & driver instance
BLDCMotor motor = BLDCMotor(11);
BLDCDriver3PWM driver = BLDCDriver3PWM(27, 12, 14, 25);
 
// velocity set point variable
float target_velocity = 0;
bool enableMotor = false;
bool useOpenLoop = true;
double openLoopAngle = 0.0;

// instantiate the commander
Commander command = Commander(Serial);
void doTarget(char* cmd) {
  command.scalar(&target_velocity, cmd);
  if(isnan(target_velocity)) target_velocity = 0.0d;
}
void setEnable(char* cmd) { 
  float shouldEnable = false;
  command.scalar(&shouldEnable, cmd);
  enableMotor = shouldEnable>0.5f;
}

void getMotorAngle(char* cmd) {
  Serial.print("G ");
  if(useOpenLoop)  Serial.println(openLoopAngle);
  else Serial.println(motor.shaft_angle);
}
  
void getButtons(char* cmd) {
  Serial.print("B ");
  Serial.print(digitalRead(CONTACT_A));
  Serial.print(" ");
  Serial.println(digitalRead(CONTACT_B));
}


void setup() {

  Serial.begin(115200);
  
  pinMode(CONTACT_A, INPUT);
  pinMode(CONTACT_B, INPUT);
 
  pixels.begin();
  setPixels(231, 76, 60);//red
  pixels.setBrightness(200);

  sensor.init();
    
  if(not useOpenLoop){
    motor.linkSensor(&sensor);
  }

  driver.voltage_power_supply = 15.5;
  driver.init();
  motor.linkDriver(&driver);


  if(not useOpenLoop){
    //current_sense.gain_b *=-1;
    //current_sense.skip_align = true;
    current_sense.init();
    motor.linkCurrentSense(&current_sense);
  }

  if(useOpenLoop){
    motor.controller = MotionControlType::velocity_openloop;
    motor.voltage_limit = 8;
    motor.velocity_limit = 100;
  }
  else {
    motor.torque_controller = TorqueControlType::dc_current; 
    motor.controller = MotionControlType::velocity;
    motor.PID_velocity.P = 0.2;
    motor.PID_velocity.I = 10;
    motor.PID_velocity.D = 0.0001;
    motor.voltage_sensor_align = 12;
    motor.voltage_limit = 15.5;
    motor.current_limit = 3.0;
    motor.velocity_limit = 100;
    // jerk control using voltage voltage ramp
    // default value is 300 volts per sec  ~ 0.3V per millisecond
    motor.PID_velocity.output_ramp = 10000;
    // velocity low pass filtering
    // default 5ms - try different values to see what is the best. 
    // the lower the less filtered
    motor.LPF_velocity.Tf = 0.01;
  }
  
  //motor.useMonitoring(Serial);

  setPixels(243, 156, 18);//orange

  // initialize motor
  motor.enable();
  motor.init();
  if(not useOpenLoop){
    // align sensor and start FOC
    int retryCount = 0;
    while(!motor.initFOC()){
      motor.enable();
      if(retryCount % 2) setPixels(243, 156, 18);//orange
      else setPixels(211, 84, 0);//dark orange
      retryCount++;
    }
  }

  // add target command T
  command.add('T', doTarget, "target voltage");
  command.add('G', getMotorAngle, "current motor angle");
  command.add('B', getButtons, "current buttons state");
  command.add('E', setEnable, "target enable state 0 or 1");
  
  setPixels(46, 204, 113);

  //Serial.println(F("Motor ready."));
  //Serial.println(F("Set the target velocity using serial terminal:"));
  _delay(100);
}

void setPixels(int r, int g, int b){
  pixels.fill(pixels.gamma32(pixels.Color(r, g, b)));
  pixels.show();
}

void computePixels(){
  bool ca = digitalRead(CONTACT_A);
  bool cb = digitalRead(CONTACT_B);
  pixels.clear();
  int index = (abs((int)((motor.shaft_angle/REDUCTION_FACTOR)*180.f/PI)) % 360)*((float)(PIXEL_COUNT)/360.f);
  if(motor.shaft_angle>0) index = PIXEL_COUNT-index;
  
  uint32_t blue = pixels.Color(0, 0, 255);
  uint32_t white = pixels.Color(255, 255, 255);
  uint32_t green = pixels.Color(0, 255, 0);
  uint32_t violet = pixels.Color(255, 0, 255);
  uint32_t color = blue;
  if(ca && cb) color = white;
  else if(ca) color =  green;
  else if(cb) color = violet;
  int n0 = index-1; if(n0<0) n0 = PIXEL_COUNT-1;
  int n1 = index;
  int n2 = index+1; if(n2 >= PIXEL_COUNT) n2 = 0;
  if(0 <= n0 && n0 < PIXEL_COUNT) pixels.setPixelColor(n0, color);
  if(0 <= n1 && n1 < PIXEL_COUNT) pixels.setPixelColor(n1, color);
  if(0 <= n2 && n2 < PIXEL_COUNT) pixels.setPixelColor(n2, color);
  
  pixels.show();
}

float motorOpenLoopPrevAngle = 0.0;
float full_rotation_offset = 0.0;
void computeOpenLoop() {
  if (enableMotor) {
    //Adapt max voltage based on target speed
    float absTargetVelocity = abs(target_velocity);
    if(absTargetVelocity>90) motor.voltage_limit = 15;
    else if(absTargetVelocity>80) motor.voltage_limit = 14;
    else if(absTargetVelocity>70) motor.voltage_limit = 13;
    else if(absTargetVelocity>60) motor.voltage_limit = 12;
    else if(absTargetVelocity>50) motor.voltage_limit = 11;
    else if(absTargetVelocity>40) motor.voltage_limit = 10;
    else if(absTargetVelocity>30) motor.voltage_limit = 9;
    else if(absTargetVelocity>20) motor.voltage_limit = 8;
    else if(absTargetVelocity>10) motor.voltage_limit = 7;
    else if(absTargetVelocity>5) motor.voltage_limit = 6;
    else motor.voltage_limit = 5;
  }

  float rawAngle = motor.shaft_angle;
  int delta = rawAngle - motorOpenLoopPrevAngle;
  // if overflow happened track it as full rotation
  if(abs(delta) > (0.8*_2PI) ) full_rotation_offset += delta > 0 ? -_2PI : _2PI; 
  
  openLoopAngle = full_rotation_offset + ( rawAngle / _2PI);
  motorOpenLoopPrevAngle = rawAngle; 
}

unsigned long int lastPixelTime = 0;
void loop() {
  unsigned long int now = millis();
  if(now - lastPixelTime >= 30){
    computePixels();
    lastPixelTime = now;
  }
  
  if (not enableMotor) motor.voltage_limit = 1;

  if(not useOpenLoop) motor.loopFOC();
  else computeOpenLoop();
  motor.move(target_velocity);
  //motor.monitor();
  command.run();
}
