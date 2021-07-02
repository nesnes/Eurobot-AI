
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

// instantiate the commander
Commander command = Commander(Serial);
void doTarget(char* cmd) { command.scalar(&target_velocity, cmd); }
void getMotorAngle(char* cmd) { Serial.print("G "); Serial.println(motor.shaft_angle); }
void getButtons(char* cmd) {
  Serial.print("B ");
  Serial.print(digitalRead(CONTACT_A));
  Serial.print(" ");
  Serial.println(digitalRead(CONTACT_B));
}

void setup() {

  pinMode(CONTACT_A, INPUT);
  pinMode(CONTACT_B, INPUT);
 
  pixels.begin();
  // initialise magnetic sensor hardware
  sensor.init();
  // link the motor to the sensor
  motor.linkSensor(&sensor);

  // driver config
  // power supply voltage [V]
  driver.voltage_power_supply = 14;
  driver.init();
  // link the motor and the driver
  motor.linkDriver(&driver);


  //current_sense.gain_b *=-1;
  //current_sense.skip_align = true;
  current_sense.init();
  // link the current sense to the motor
  motor.linkCurrentSense(&current_sense);
  
  // set motion control loop to be used
  motor.torque_controller = TorqueControlType::dc_current; 
  motor.controller = MotionControlType::velocity;

  // contoller configuration 
  // default parameters in defaults.h

  // velocity PI controller parameters
  motor.PID_velocity.P = 0.1;
  motor.PID_velocity.I = 10;
  motor.PID_velocity.D = 0.0001;
  // default voltage_power_supply
  motor.voltage_limit = 14;
  motor.current_limit = 3.3;
  motor.velocity_limit = 100;
  // jerk control using voltage voltage ramp
  // default value is 300 volts per sec  ~ 0.3V per millisecond
  motor.PID_velocity.output_ramp = 1000;
  
  // velocity low pass filtering
  // default 5ms - try different values to see what is the best. 
  // the lower the less filtered
  motor.LPF_velocity.Tf = 0.01;

  // use monitoring with serial 
  Serial.begin(115200);
  // comment out if not needed
  //motor.useMonitoring(Serial);

  // initialize motor
  motor.enable();
  motor.init();
  // align sensor and start FOC
  motor.initFOC();

  // add target command T
  command.add('T', doTarget, "target voltage");
  command.add('G', getMotorAngle, "current motor angle");
  command.add('B', getButtons, "current buttons state");

  Serial.println(F("Motor ready."));
  Serial.println(F("Set the target velocity using serial terminal:"));
  _delay(100);
}

void computePixels(){
  bool ca = digitalRead(CONTACT_A);
  bool cb = digitalRead(CONTACT_B);
  pixels.clear();
  int index = ((int)((motor.shaft_angle/REDUCTION_FACTOR)*180.f/PI) % 360)*((float)(PIXEL_COUNT)/360.f);
  if(index < PIXEL_COUNT) pixels.setPixelColor(index, pixels.Color(cb?150:0, ca?150:0, 150));
  pixels.show();
}

void loop() {
  motor.loopFOC();
  motor.move(target_velocity);
  //motor.monitor();
  command.run();
  computePixels();
}
