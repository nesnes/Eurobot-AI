#ifndef PIN_DEF_H
#define PIN_DEF_H

/* pinout MCP23017 */
#define PIN_MOT1_INH    5
#define PIN_MOT2_INH    6
#define PIN_MOT3_INH    7

#define PIN_MOT1_CS     9
#define PIN_MOT2_CS     10
#define PIN_MOT3_CS     8

/* pinout Teensy */
#define PIN_MOT1_INU    6
#define PIN_MOT1_INV    5
#define PIN_MOT1_INW    2

#define PIN_MOT2_INU    3
#define PIN_MOT2_INV    4
#define PIN_MOT2_INW    10

#define PIN_MOT3_INU    9
#define PIN_MOT3_INV    8
#define PIN_MOT3_INW    7

#define PIN_MOT_MOSI    11
#define PIN_MOT_MISO    12
#define PIN_MOT_CLK     13

#define PIN_LED_DEBUG   14

#define PIN_MOT1_IMU    15
#define PIN_MOT1_IMV    23
#define PIN_MOT1_IMW    22

#define PIN_MOT2_IMU    21
#define PIN_MOT2_IMV    20
#define PIN_MOT2_IMW    19

#define PIN_MOT3_IMU    18
#define PIN_MOT3_IMV    17
#define PIN_MOT3_IMW    16

#define MCP23017_ADDR    0x25

#endif /* PIN_DEF_H */