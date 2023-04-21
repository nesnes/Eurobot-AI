
#include "MagneticSensorSPIWithMCP23017.h"


// MagneticSensorSPI(int cs, float _bit_resolution, int _angle_register)
//  cs              - SPI chip select pin
//  _bit_resolution   sensor resolution bit number
// _angle_register  - (optional) angle read register - default 0x3FFF
MagneticSensorSPIWithMCP23017::MagneticSensorSPIWithMCP23017(int cs, float _bit_resolution, int _angle_register){

  chip_select_pin = cs;
  // angle read register of the magnetic sensor
  angle_register = _angle_register ? _angle_register : DEF_ANGLE_REGISTER;
  // register maximum value (counts per revolution)
  cpr = pow(2,_bit_resolution);
  spi_mode = SPI_MODE1;
  clock_speed = 4000000;
  bit_resolution = _bit_resolution;

  command_parity_bit = 15; // for backwards compatibilty
  command_rw_bit = 14; // for backwards compatibilty
  data_start_bit = 13; // for backwards compatibilty
}

MagneticSensorSPIWithMCP23017::MagneticSensorSPIWithMCP23017(MagneticSensorSPIConfig_s config, int cs){
  chip_select_pin = cs;
  // angle read register of the magnetic sensor
  angle_register = config.angle_register ? config.angle_register : DEF_ANGLE_REGISTER;
  // register maximum value (counts per revolution)
  cpr = pow(2, config.bit_resolution);
  spi_mode = config.spi_mode;
  clock_speed = 4000000;//config.clock_speed;
  bit_resolution = config.bit_resolution;

  command_parity_bit = config.command_parity_bit; // for backwards compatibilty
  command_rw_bit = config.command_rw_bit; // for backwards compatibilty
  data_start_bit = config.data_start_bit; // for backwards compatibilty
}

void MagneticSensorSPIWithMCP23017::init(SPIClass* _spi){
  spi = _spi;

  // init MCP23017
  bool mcpInitOk = false;
  while(!mcpInitOk){
    mcpInitOk = mcp.begin_I2C(MCP23017_ADDR, &Wire2);
    if(!mcpInitOk) {
      //Serial.println("# Cannot initialize MCP23017 from MagneticSensorSPIWithMCP23017.");
      delay(10);
    }
  }
  Wire2.setClock(400000);

	// 1MHz clock (AMS should be able to accept up to 10MHz)
	settings = SPISettings(clock_speed, MSBFIRST, spi_mode);
	//setup pins
	mcp.pinMode(chip_select_pin, OUTPUT);
	//SPI has an internal SPI-device counter, it is possible to call "begin()" from different devices
	spi->begin();
	// do any architectures need to set the clock divider for SPI? Why was this in the code?
  //spi->setClockDivider(SPI_CLOCK_DIV8);
	mcp.digitalWrite(chip_select_pin, HIGH);

  this->Sensor::init(); // call base class init
}

//  Shaft angle calculation
//  angle is in radians [rad]
float MagneticSensorSPIWithMCP23017::getSensorAngle(){
  return (getRawCount() / (float)cpr) * _2PI;
}

// function reading the raw counter of the magnetic sensor
int MagneticSensorSPIWithMCP23017::getRawCount(){
	return (int)MagneticSensorSPIWithMCP23017::read(angle_register);
}

// SPI functions 
/**
 * Utility function used to calculate even parity of word
 */
byte MagneticSensorSPIWithMCP23017::spiCalcEvenParity(word value){
	byte cnt = 0;
	byte i;

	for (i = 0; i < 16; i++)
	{
		if (value & 0x1) cnt++;
		value >>= 1;
	}
	return cnt & 0x1;
}

  /*
  * Read a register from the sensor
  * Takes the address of the register as a 16 bit word
  * Returns the value of the register
  */
word MagneticSensorSPIWithMCP23017::read(word angle_register){

  word command = angle_register;

  if (command_rw_bit > 0) {
    command = angle_register | (1 << command_rw_bit);
  }
  if (command_parity_bit > 0) {
   	//Add a parity bit on the the MSB
  	command |= ((word)spiCalcEvenParity(command) << command_parity_bit);
  }

  //SPI - begin transaction
  spi->beginTransaction(settings);

  //Send the command
  mcp.digitalWrite(chip_select_pin, LOW);
  word register_value = spi->transfer16(command);
  mcp.digitalWrite(chip_select_pin,HIGH);
  
#if defined(ESP_H) && defined(ARDUINO_ARCH_ESP32) // if ESP32 board
  delayMicroseconds(50); // why do we need to delay 50us on ESP32? In my experience no extra delays are needed, on any of the architectures I've tested...
#else
  delayMicroseconds(1); // delay 1us, the minimum time possible in plain arduino. 350ns is the required time for AMS sensors, 80ns for MA730, MA702
#endif

  //Now read the response
  /*mcp.digitalWrite(chip_select_pin, LOW);
  word register_value = spi->transfer16(0x00);
  mcp.digitalWrite(chip_select_pin, HIGH);*/

  //SPI - end transaction
  spi->endTransaction();

  register_value = register_value >> (1 + data_start_bit - bit_resolution);  //this should shift data to the rightmost bits of the word

  const static word data_mask = 0xFFFF >> (16 - bit_resolution);

	return register_value & data_mask;  // Return the data, stripping the non data (e.g parity) bits
}

float MagneticSensorSPIWithMCP23017::getVelocity() {
    // calculate sample time
    float Ts = (angle_prev_ts - vel_angle_prev_ts)*1e-6;
    // TODO handle overflow - we do need to reset vel_angle_prev_ts
    if (Ts < min_elapsed_time) return velocity; // don't update velocity if deltaT is too small

    /*float actualVelocity = ( (float)(full_rotations - vel_full_rotations)*_2PI + (angle_prev - vel_angle_prev) ) / Ts;
    velocityHistory[velocityHistoryIdx++] = actualVelocity;
    if(velocityHistoryIdx>=ENCODER_VELOCITY_HISTORY_SIZE) { velocityHistoryIdx = 0; }
    float meanVel = 0;
    for(int i=0;i<ENCODER_VELOCITY_HISTORY_SIZE;i++) { meanVel += velocityHistory[i];}
    meanVel /= (float)(ENCODER_VELOCITY_HISTORY_SIZE);
    velocity = meanVel;*/
    float actualVel = ( (float)(full_rotations - vel_full_rotations)*_2PI + (angle_prev - vel_angle_prev) ) / Ts;
    float filtered1 = velocity*0.9 + 0.1*actualVel;
    //if(abs(filtered1 - velocity)>0.004) velocity = actualVel;
    velocity = velocityFilter.filter(actualVel, micros()/1000000.d);
    //if(abs(velocity) < 0.025) velocity = 0.f;

    //velocity = velocity*0.95 + 0.05*( (float)(full_rotations - vel_full_rotations)*_2PI + (angle_prev - vel_angle_prev) ) / Ts;
    vel_angle_prev = angle_prev;
    vel_full_rotations = full_rotations;
    vel_angle_prev_ts = angle_prev_ts;
    return velocity;
}

/**
 * Closes the SPI connection
 * SPI has an internal SPI-device counter, for each init()-call the close() function must be called exactly 1 time
 */
void MagneticSensorSPIWithMCP23017::close(){
	spi->end();
}

