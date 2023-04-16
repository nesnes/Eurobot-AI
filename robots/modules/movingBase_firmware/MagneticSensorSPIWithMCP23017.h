#ifndef MAGNETICSENSORSPIWITHMCP23017_LIB_H
#define MAGNETICSENSORSPIWITHMCP23017_LIB_H


#include "Arduino.h"
#include <SPI.h>
/*#include "../common/base_classes/Sensor.h"
#include "../common/foc_utils.h"
#include "../common/time_utils.h"*/
#include <SimpleFOC.h>
#include "OneEuroFilter.h"

#include <Adafruit_MCP23X17.h> // from https://github.com/adafruit/Adafruit-MCP23017-Arduino-Library
#include "pin_def.h"
#define ENCODER_VELOCITY_HISTORY_SIZE 10

class MagneticSensorSPIWithMCP23017: public Sensor{
 public:
    /**
     *  MagneticSensorSPI class constructor
     * @param cs  SPI chip select pin 
     * @param bit_resolution   sensor resolution bit number
     * @param angle_register  (optional) angle read register - default 0x3FFF
     */
    MagneticSensorSPIWithMCP23017(int cs, float bit_resolution, int angle_register = 0);
    /**
     *  MagneticSensorSPI class constructor
     * @param config   SPI config
     * @param cs  SPI chip select pin
     */
    MagneticSensorSPIWithMCP23017(MagneticSensorSPIConfig_s config, int cs);

    /** sensor initialise pins */
    void init(SPIClass* _spi = &SPI);

    // implementation of abstract functions of the Sensor class
    /** get current angle (rad) */
    float getSensorAngle() override;

    float getVelocity() override;

    // returns the spi mode (phase/polarity of read/writes) i.e one of SPI_MODE0 | SPI_MODE1 | SPI_MODE2 | SPI_MODE3
    int spi_mode;
    
    /* returns the speed of the SPI clock signal */
    long clock_speed;
    

  //private:
    float cpr; //!< Maximum range of the magnetic sensor
    // spi variables
    int angle_register; //!< SPI angle register to read
    int chip_select_pin; //!< SPI chip select pin
	  SPISettings settings; //!< SPI settings variable
    // spi functions
    /** Stop SPI communication */
    void close(); 
    /** Read one SPI register value */
    word read(word angle_register);
    /** Calculate parity value  */
    byte spiCalcEvenParity(word value);

    /**
     * Function getting current angle register value
     * it uses angle_register variable
     */
    int getRawCount();
    
    int bit_resolution; //!< the number of bites of angle data
    int command_parity_bit; //!< the bit where parity flag is stored in command
    int command_rw_bit; //!< the bit where read/write flag is stored in command
    int data_start_bit; //!< the the position of first bit
    float velocityHistory[ENCODER_VELOCITY_HISTORY_SIZE];
    int velocityHistoryIdx = 0;
    OneEuroFilter velocityFilter{800, 0.0001, 0.2, 0.7};
    SPIClass* spi;
    Adafruit_MCP23X17 mcp;
};


#endif