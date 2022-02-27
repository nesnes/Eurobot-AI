#include "actuators.h"

const int MIN_PULSE = 500;
const int MAX_PULSE = 2500;

// Servos "alone"

const uint8_t SERVO_AC_A = 17;
const uint8_t SERVO_AC_C = 23;
const uint8_t SERVO_AB_A = 20;
const uint8_t SERVO_AB_B = 16;
const uint8_t SERVO_BC_B = 15;
const uint8_t SERVO_BC_C = 13;
const uint8_t SERVO_FLAG = 14;
const uint8_t SERVO_PINS[NB_SERVOS] = {SERVO_AC_A, SERVO_AC_C, SERVO_AB_A, SERVO_AB_B, SERVO_BC_B, SERVO_BC_C, SERVO_FLAG};

const int SERVO_AC_A_DEFAULT = 70;
const int SERVO_AC_C_DEFAULT = 110;
const int SERVO_AB_A_DEFAULT = 110;
const int SERVO_AB_B_DEFAULT = 70;
const int SERVO_BC_B_DEFAULT = 110;
const int SERVO_BC_C_DEFAULT = 70;
const int SERVO_FLAGS_DEFAULT = 27;
const int SERVO_DEFAULTS[NB_SERVOS] = {SERVO_AC_A_DEFAULT, SERVO_AC_C_DEFAULT, SERVO_AB_A_DEFAULT, SERVO_AB_B_DEFAULT, SERVO_BC_B_DEFAULT, SERVO_BC_C_DEFAULT, SERVO_FLAGS_DEFAULT};

Servo servos[NB_SERVOS];
ramp servoRamps[NB_SERVOS];

// Servos Arm
const int NB_SERVO_ARM_M = 5;
const int pinNumberServo_M[NB_SERVO_ARM_M] = {0, 24, 28, 1, 32};
Servo servos_M[NB_SERVO_ARM_M];
ramp servosRamp_M[NB_SERVO_ARM_M];
int positionServo_M_DefaultOut[NB_SERVO_ARM_M] = {90, 90, 90, 90, 90};//Z 40 90 90 90 90 140 0
int positionServo_M_Default[NB_SERVO_ARM_M] = {50, 90, 140, 50, 90};//Z 40 10 150 60 90 140 0

// Pumps
const int pinNumberPump_L = 22;
const int pinNumberPump_R = 21;
const int pinNumberPumps[NB_PUMPS] = {pinNumberPump_L, pinNumberPump_R};

void initActuators() {
  // Setup Servos
  for (uint8_t i = 0; i < NB_SERVOS; i++) {
    servos[i].attach(SERVO_PINS[i], MIN_PULSE, MAX_PULSE);
    servoRamps[i].go(SERVO_DEFAULTS[i], 0);
  }

  // Setup Arm M
  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++) {
    servos_M[i].attach(pinNumberServo_M[i], MIN_PULSE, MAX_PULSE);
    setArmPose(positionServo_M_DefaultOut, 0);
  }

  updateServos();

  //Setup pumps
  for (uint8_t i = 0; i < NB_PUMPS; i++) {
    pinMode(pinNumberPumps[i], OUTPUT);
    setPump(i, LOW);
  }
}

void setArmPose(int* pose, int duration) {
  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++)
    servosRamp_M[i].go(pose[i], duration);
}

void updateServos() {
  for (uint8_t i = 0; i < NB_SERVOS; i++)
    servos[i].write(servoRamps[i].update());

  for (uint8_t i = 0; i < NB_SERVO_ARM_M; i++)
    servos_M[i].write(servosRamp_M[i].update());
}

void setServo(uint8_t servo, int angle, int duration) {
  servoRamps[servo].go(angle, duration);
}

void setPump(uint8_t pump, bool state) {
  digitalWrite(pinNumberPumps[pump], state);
}
