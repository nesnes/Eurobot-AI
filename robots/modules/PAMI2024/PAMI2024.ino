
//#define DEBUG  // remove to avoid latency in motor control
#define STEPPER_R_STEP 7  // Step of right stepper
#define STEPPER_R_DIR 4   // Direction of right stepper
#define STEPPER_L_STEP 6  // Step of left stepper
#define STEPPER_L_DIR 3   // Direction of left stepper
#define STEPPER_DISABLE 8 // Set to 1 to disable stepper motor power
#define CONTACT_R 10      //Y+Y- Right collision button
#define CONTACT_L 9       //X+X- Left collision button
#define STARTER 11        //Z+Z- Top mounted button
#define IDENTIFIER_A A0   //D12 Used to determine the ID of a robot using jumpers
#define IDENTIFIER_B A1   //D12 Used to determine the ID of a robot using jumpers
bool stepLeftPinVal = 0;
bool stepRightPinVal = 0;
void moveSteppers(bool leftForward, bool rightForward, uint16_t leftSteps, uint16_t rightSteps, uint16_t sleepTime=1);

#define STEPPER_STEP_PER_REV 1600 // motor is 200 (1.8deg) and in halfStep, so 200x2 = 400 (0.9deg)

#define STEP_PER_ROBOT_METER 8100  // number of steps to reach 1 meter
#define TRANSLATION_DIVIDER 100    // 1meter/500 = 2cm per translation step => no floating/rounding issues
#define MM_PER_ROBOT_TRANSLATION 1000/TRANSLATION_DIVIDER  // number of step between two loops
#define STEP_PER_ROBOT_TRANSLATION STEP_PER_ROBOT_METER/TRANSLATION_DIVIDER  // number of step between two loops
int MIN_ROTATION_STEP_DELAY = 800; //600

#define STEP_PER_ROBOT_TURN 1472 //1468 but modified to get rotation divider    // Number of steps for the robot to turn on itself (360)
#define ROTATION_DIVIDER 8        // 360/8 => 45° per rotation step, 1468/8=183.5 small floating/rounding issue
#define DEG_PER_ROBOT_ROTATION 360 / ROTATION_DIVIDER
#define STEP_PER_ROBOT_ROTATION STEP_PER_ROBOT_TURN / ROTATION_DIVIDER      // number of step between two loops
int MIN_TRANSLATION_STEP_DELAY=400;  //200
#define MAX_TRANSLATION_STEP_DELAY 1000 //1000

#define WHEEL_PERIMETER 0.193f // meters //not used
#define WHEEL_DISTANCE  0.0575f // meters //not used

#define SERVO_PIN A2
#include <Servo.h>
Servo servo;

#define NEOPIXEL_PIN A3
#define NEOPIXEL_COUNT 3
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel neopixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

#include <VL53L0X_mod.h> // https://github.com/schnoog/vl53l0x-arduino-mod
VL53L0X_mod vl53;
uint16_t lastRange = 1000;

// Unique ID for each robot
#define ID_PAMI_A 0
#define ID_PAMI_B 1
#define ID_PAMI_C 2
#define ID_PAMI_D 3
int robotId = 0;

// Pre defined LED color
#define COLOR_RED     neopixel.Color(255,   0,   0, 255)
#define COLOR_GREEN   neopixel.Color(  0, 255,   0, 255)
#define COLOR_BLUE    neopixel.Color(  0,   0, 255, 255)
#define COLOR_YELLOW  neopixel.Color(255, 255,   0, 255)
#define COLOR_ORANGE  neopixel.Color(255, 127,   0, 255)
#define COLOR_VIOLET  neopixel.Color(255,   0, 255, 255)
#define COLOR_WHITE   neopixel.Color(255, 255, 255, 255)
#define COLOR_OFF     neopixel.Color(  0,   0,   0, 255)
uint32_t robotIdColor = 0;

// Teams
#define TEAM_A_COLOR COLOR_YELLOW
#define TEAM_B_COLOR COLOR_BLUE
#define TEAM_A 0
#define TEAM_B 1
uint32_t teamColor = 0;
uint8_t team = 0;

// Match parameters
#define MATCH_MODE_OFFICIAL 0
#define MATCH_MODE_TRAINING 1
uint8_t matchMode = 0;
uint32_t matchDurationMs = 100000l;//ms
uint32_t matchStartTimeMs = 0;
uint32_t matchActivationTime = 15250l; // N ms before end of match
int32_t reservedTimeForEnd = 250; //ms to actuate servo

// Pathfinding parameters
#include "pathfinder.h"
struct MapUpdate{
  int16_t x{-1}; //map coordinates
  int16_t y{-1}; //map coordinates
  uint8_t cost{255};
};
#define MAP_UPDATE_MAX 10
uint8_t mapUpdateCount = 0;
MapUpdate mapUpdates[MAP_UPDATE_MAX]; // up to 10 update
int16_t pathfinderPath[PATHFINDER_PATH_SIZE];
uint16_t pathfinderPathIndex = 0;
bool updatePathfinding(MapUpdate newUpdate=MapUpdate());

enum GoalAction {
  NONE,
  FORWARD,
  BACKWARD,
  TURN_TO_ANGLE,
  WAIT_MS
};
struct Goal {
  Goal() : action{GoalAction::NONE}, param1{0}, param2{0} {};
  Goal(GoalAction action_, int32_t param1_, int32_t param2_) : action{action_}, param1{param1_}, param2{param2_} {};
  GoalAction action;
  int32_t param1;
  int32_t param2;
};
#define DEFAULT_GOALS_LENGTH 10
Goal defaultGoals[DEFAULT_GOALS_LENGTH];
int16_t goalIdx = 0;

int16_t positionXmm = 0;
int16_t positionYmm = 0;
int16_t positionAngleDeg = 0;
int16_t targetXmm = 0;
int16_t targetYmm = 0;
int16_t targetAngleDeg = 0;
int16_t targetServoAngle = 0;
float targetNoCollisionDist = 0;

float distanceToTarget() {
  return sqrt(pow(float(targetXmm - positionXmm), 2) + pow(float(targetYmm - positionYmm), 2));
}

void setup() {
  Serial.begin(115200);
  
  // Init steppers (disabled)
  pinMode(STEPPER_L_STEP, OUTPUT);
  pinMode(STEPPER_L_DIR, OUTPUT);
  pinMode(STEPPER_R_STEP, OUTPUT);
  pinMode(STEPPER_R_DIR, OUTPUT);
  pinMode(STEPPER_DISABLE, OUTPUT);
  digitalWrite(STEPPER_DISABLE, 1);

  // Init buttons
  pinMode(CONTACT_L, INPUT_PULLUP);
  pinMode(CONTACT_R, INPUT_PULLUP);
  pinMode(STARTER, INPUT_PULLUP);

  // Establish robot ID
  pinMode(IDENTIFIER_A, INPUT_PULLUP);
  pinMode(IDENTIFIER_B, INPUT_PULLUP);
  bool idA = digitalRead(IDENTIFIER_A);
  bool idB = digitalRead(IDENTIFIER_B);
  if(idA and idB)   { robotId = ID_PAMI_A;  robotIdColor = COLOR_WHITE; }
  if(idA and !idB)  { robotId = ID_PAMI_B;  robotIdColor = COLOR_GREEN; }
  if(!idA and idB)  { robotId = ID_PAMI_C;  robotIdColor = COLOR_VIOLET; }
  if(!idA and !idB) { robotId = ID_PAMI_D;  robotIdColor = COLOR_ORANGE; }

  // Initialize neopixels
  neopixel.begin();
  neopixel.clear();
  neopixel.fill(robotIdColor);
  neopixel.show();

  // Init servo motor
  servo.attach(SERVO_PIN);
  servo.write(170);
  delay(250);
  servo.write(180);

  // Init telemeter
  Wire.begin();
  Wire.setClock(400000);
  vl53.setTimeout(500);
  if (!vl53.init()) {
    neopixel.fill(COLOR_RED);
    neopixel.show();
    delay(1000);
  };
  delay(10);
  // Return signal rate limit (default is 0.25 MCPS)
  vl53.setSignalRateLimit(2);//0.85);
  // Increase laser pulse periods (defaults are 14 and 10 PCLKs)
  vl53.setVcselPulsePeriod(VL53L0X_mod::VcselPeriodPreRange, 18);
  vl53.setVcselPulsePeriod(VL53L0X_mod::VcselPeriodFinalRange, 14);
  vl53.setMeasurementTimingBudget(20000);//20ms
  vl53.startContinuous(20);
  delay(10);
  
  //return;

  // Wait for team selection
  while(digitalRead(STARTER));
  while(true) {
    // Team A
    if(digitalRead(STARTER)) {
      teamColor = TEAM_A_COLOR;
      team = TEAM_A;
    }
    // Team B
    else {
      teamColor = TEAM_B_COLOR;
      team = TEAM_B;
    }
    neopixel.fill(teamColor);
    neopixel.show();
    // Exit team selection
    if(!digitalRead(CONTACT_L) or !digitalRead(CONTACT_R)) {
      uint32_t blinkColor = teamColor;
      int blinkSpeed = 100;
      // Define match mode
      if(!digitalRead(CONTACT_L)) { matchMode = MATCH_MODE_OFFICIAL; }
      else { matchMode = MATCH_MODE_TRAINING; blinkSpeed = 200; blinkColor = COLOR_RED; }
      // Blink team color and match mode
      for(int i=0;i<6;i++){
        neopixel.clear();
        neopixel.show();
        delay(blinkSpeed);
        neopixel.fill(blinkColor);
        neopixel.show();
        delay(blinkSpeed);
      }
      break;
    }
  }
  digitalWrite(STEPPER_DISABLE, 0); // Enable stepper motors to be robust to positioning and starter pull
  neopixel.fill(teamColor);
  neopixel.show();

  // Setup match
  if(matchMode == MATCH_MODE_TRAINING) {
    matchDurationMs = 17*1000;
  }

  // Define start and target positions
  // Position of TEAM A, on the left of the table
  if(robotId==ID_PAMI_A) {
    positionXmm = 1468;   positionYmm =  112; positionAngleDeg  = -90;       // CENTER_BACK
    targetXmm   = 2769;   targetYmm   =  1213; targetAngleDeg    =   0;       //middle right BLUE start zone
    targetNoCollisionDist = 200; targetServoAngle = 0;
    defaultGoals[0] = Goal(GoalAction::FORWARD, 500, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[1] = Goal(GoalAction::TURN_TO_ANGLE, -45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[2] = Goal(GoalAction::FORWARD, 850, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[3] = Goal(GoalAction::TURN_TO_ANGLE, 0, MIN_ROTATION_STEP_DELAY);
    defaultGoals[4] = Goal(GoalAction::FORWARD, 700, MIN_TRANSLATION_STEP_DELAY);
  }
  else if(robotId==ID_PAMI_B) {
    /*positionXmm = 1404;   positionYmm =   112; positionAngleDeg  = -90;       // CENTER_BACK
    targetXmm   = 2585;   targetYmm   =  1053; targetAngleDeg    =   0;       //between middle BLUE start zone and planter
    targetNoCollisionDist = 300; targetServoAngle = 0;
    defaultGoals[0] = Goal(GoalAction::FORWARD, 800, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[1] = Goal(GoalAction::TURN_TO_ANGLE, -45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[2] = Goal(GoalAction::FORWARD, 200, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[3] = Goal(GoalAction::TURN_TO_ANGLE, 0, MIN_ROTATION_STEP_DELAY);
    defaultGoals[4] = Goal(GoalAction::FORWARD, 1050, MIN_TRANSLATION_STEP_DELAY);*/
    positionXmm = 37;   positionYmm =   375; positionAngleDeg  = 0;       
    targetXmm   =  1203;   targetYmm   =  500; targetAngleDeg    =  90;       // Center End Zone
    targetNoCollisionDist = 50; targetServoAngle = 0;
    defaultGoals[0] = Goal(GoalAction::WAIT_MS, 3000, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[1] = Goal(GoalAction::FORWARD, 300, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[2] = Goal(GoalAction::TURN_TO_ANGLE, -45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[3] = Goal(GoalAction::FORWARD, 700, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[4] = Goal(GoalAction::TURN_TO_ANGLE, 0, MIN_ROTATION_STEP_DELAY);
    defaultGoals[5] = Goal(GoalAction::FORWARD, 300, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[6] = Goal(GoalAction::TURN_TO_ANGLE, 45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[7] = Goal(GoalAction::FORWARD, 100, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[8] = Goal(GoalAction::TURN_TO_ANGLE, 90, MIN_ROTATION_STEP_DELAY);
    defaultGoals[9] = Goal(GoalAction::FORWARD, 150, MIN_TRANSLATION_STEP_DELAY);
    
  }
  else if(robotId==ID_PAMI_C) {
    positionXmm = 1340;   positionYmm =  112; positionAngleDeg  = -90;       // CENTER_BACK
    targetXmm   =  50;   targetYmm   = 712; targetAngleDeg    = 180;       //lower left BLUE start zone
    targetNoCollisionDist = 200; targetServoAngle = 0;
    defaultGoals[0] = Goal(GoalAction::FORWARD, 600, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[1] = Goal(GoalAction::WAIT_MS, 1000, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[2] = Goal(GoalAction::TURN_TO_ANGLE, 180, MIN_ROTATION_STEP_DELAY);
    defaultGoals[3] = Goal(GoalAction::FORWARD, 1400, MIN_TRANSLATION_STEP_DELAY);
  }
  else if(robotId==ID_PAMI_D) {
    positionXmm = 37;   positionYmm =   375; positionAngleDeg  = 0;       
    targetXmm   =  1432;   targetYmm   =  487; targetAngleDeg    =  90;       // Center End Zone
    targetNoCollisionDist = 50; targetServoAngle = 0;
    defaultGoals[0] = Goal(GoalAction::FORWARD, 200, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[1] = Goal(GoalAction::TURN_TO_ANGLE, -45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[2] = Goal(GoalAction::FORWARD, 500, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[3] = Goal(GoalAction::TURN_TO_ANGLE, 0, MIN_ROTATION_STEP_DELAY);
    defaultGoals[4] = Goal(GoalAction::FORWARD, 700, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[5] = Goal(GoalAction::TURN_TO_ANGLE, 45, MIN_ROTATION_STEP_DELAY);
    defaultGoals[6] = Goal(GoalAction::FORWARD, 200, MIN_TRANSLATION_STEP_DELAY);
    defaultGoals[7] = Goal(GoalAction::TURN_TO_ANGLE, 90, MIN_ROTATION_STEP_DELAY);
    defaultGoals[8] = Goal(GoalAction::FORWARD, 100, MIN_TRANSLATION_STEP_DELAY);
  }
  if(TEAM_B==team) {                               // TEAM_B
    // Invert start and target positions from TEAM_A to TEAM_B
    auto invertAngle = [](int16_t angle)->int16_t {
      if(angle==0) return 180;
      if(angle==45) return 135;
      if(angle==90) return 90;
      if(angle==135) return 45;
      if(angle==180) return 0;
      if(angle==-135) return -45;
      if(angle==-90) return -90;
      if(angle==-45) return -135;
      return -90;//default!?
    };
    // start position
    positionXmm = 1500 + (1500 - positionXmm);
    positionYmm = positionYmm;
    positionAngleDeg = invertAngle(positionAngleDeg);
    // target position
    targetXmm = 1500 + (1500 - targetXmm);
    targetYmm = targetYmm;
    targetAngleDeg = invertAngle(targetAngleDeg);
    // goals
    for(int i=0;i<DEFAULT_GOALS_LENGTH;i++) {
       if(defaultGoals[i].action == GoalAction::NONE) break;
      if(defaultGoals[i].action == GoalAction::TURN_TO_ANGLE) {
        defaultGoals[i].param1 = invertAngle(defaultGoals[i].param1);
      }
    }
  }

  
  servo.write(150); // Open servo for starter installation
  
  // Wait for match to start
  while(true){
    while(digitalRead(STARTER));  // wait for starter to be installed
    neopixel.fill(COLOR_OFF); neopixel.show();
    // Validate starter
    delay(1000);
    if(!digitalRead(STARTER)) break;
  }
  
  if(matchMode == MATCH_MODE_TRAINING) {
    neopixel.fill(COLOR_RED); neopixel.show();
  }
  else {
    neopixel.fill(COLOR_GREEN); neopixel.show();
  }
  
  delay(500);
  digitalWrite(STEPPER_DISABLE, 1); // Disable stepper while waiting to save battery and avoid heating
  servo.write(175); // Lower arm to fit starting dimensions
  delay(500);
  servo.detach(); // Try to reduce servo usage to avoid strange resets
  
  while(!digitalRead(STARTER)); // wait for starter to be removed
  matchStartTimeMs = millis();
  neopixel.fill(COLOR_WHITE); neopixel.show();
  servo.write(180);

  // Manually correct time drift between nanos
  if(robotId==ID_PAMI_A) {/* used as reference time*/}
  else if(robotId==ID_PAMI_B) { matchStartTimeMs -= 75; }
  else if(robotId==ID_PAMI_C) { matchStartTimeMs -= 150; }
  else if(robotId==ID_PAMI_D) { matchStartTimeMs -= 125; }

  // Wait for activation time
  int32_t remainingTime = matchDurationMs;
  while( remainingTime > matchActivationTime ) {
    // SLOW-Blink team and robot color
    if((remainingTime/1000)%2) {
      neopixel.fill(teamColor);
      servo.write(150);
    }
    else {
      neopixel.fill(robotIdColor);
      servo.write(170);
    }
    neopixel.show();
    delay(2);
    //updateTelemeter(); // To initialize telemeter filter
    int32_t elapsedTime = millis()-matchStartTimeMs;
    remainingTime = matchDurationMs-elapsedTime;
  }
  // Set robot ID color during match to identify them on videos
  neopixel.fill(robotIdColor);
  neopixel.show();
  servo.write(110);

  // Enable steppers motors
  digitalWrite(STEPPER_DISABLE, 0);


  // setup done, start active-match loop!
}

bool isTimeLeft(){
  int32_t remainingTime = matchDurationMs-(millis()-matchStartTimeMs);
  return remainingTime >! reservedTimeForEnd;
}

bool reachedPathEnd = false;
bool emergencyBreak = false;
bool runningGoals = true;
bool collisionDisabled = false;
bool collisionTelemeterDisabled = false;
bool waitingForEnd = false;
int16_t consecutiveForwardCount = 0;
void loop() {
  //isInCollision(8000);
  //return;
  
  // Handle END of match
  if(!isTimeLeft()) {
    // Orient servo
    servo.attach(SERVO_PIN);

    while(true){
      servo.attach(SERVO_PIN);
      servo.write(150);
      delay(300);
      servo.detach();

      delay(300);

      servo.attach(SERVO_PIN);
      servo.write(170);
      delay(300);
      servo.detach();
      delay(300);
    }
    //servo.write(targetServoAngle);
    // Reach target angle
    bool leftContact = !digitalRead(CONTACT_L);
    bool rightContact = !digitalRead(CONTACT_R);
    bool isInContact = leftContact && rightContact;
    if(!isInContact && positionAngleDeg != targetAngleDeg){
      //fake time left to authorize movement
      int32_t prevMatchDuration = matchDurationMs;
      matchDurationMs = 300000;
      turn_to_angle(targetAngleDeg, MIN_ROTATION_STEP_DELAY);
      matchDurationMs = prevMatchDuration;
    }
    // Wait for reserved time, letting servo reach pose before detach (even when angle is already ok)
    delay(reservedTimeForEnd);
    
    // Do not disable steppers to hold position firmly

    // Disable the servo so it won't vibrate
    servo.detach(); 
    // FAST-Blink team and robot color indefinitely
    while(true){
      if((millis()/500)%2) { neopixel.fill(teamColor); }
      else { neopixel.fill(robotIdColor); }
      neopixel.show();
      delay(10);
    }
    return;
  }
  
  // Move to target
  int16_t nextAngle = 0;int16_t distError = 30000;

  // Wait if requested
  if(runningGoals && defaultGoals[goalIdx].action == GoalAction::WAIT_MS) {
    Goal& goal = defaultGoals[goalIdx];
    #ifdef DEBUG
      Serial.print("goal ");Serial.print(goalIdx);Serial.print(" wait_ms ");Serial.println(goal.param1);
    #endif
    delay(goal.param1);
    goalIdx++;
  }
  // Avoid obstacle
  else if(isInCollision(50) or emergencyBreak){
    emergencyBreak=false;
    runningGoals = false;
    // Speed up robot
    MIN_TRANSLATION_STEP_DELAY = 200;
    MIN_ROTATION_STEP_DELAY = 600;
    // Go backward
    if(consecutiveForwardCount>3) delay(100); //some time to emergency break
    consecutiveForwardCount = 0;
    backward(1100);
    backward(850);
    backward(1000);
    // Place obstacle on map forward and compute path
    uint8_t currentMapX = pathfinder_unitToX(positionXmm);
    uint8_t currentMapY = pathfinder_unitToY(positionYmm);
    MapUpdate obstacle;
    obstacle.x = currentMapX;
    obstacle.y = currentMapY;
    if(positionAngleDeg==0) obstacle.x += 1;
    if(positionAngleDeg==180) obstacle.x -= 1;
    if(positionAngleDeg==90) obstacle.y -= 1;
    if(positionAngleDeg==-90) obstacle.y += 1;
    if(positionAngleDeg==45) { obstacle.x += 1; obstacle.y -= 1; }
    if(positionAngleDeg==-45) { obstacle.x += 1; obstacle.y += 1; }
    if(positionAngleDeg==135) { obstacle.x -= 1; obstacle.y -= 1; }
    if(positionAngleDeg==-135) { obstacle.x -= 1; obstacle.y += 1; }
    updatePathfinding(obstacle);
  }
  // Run movement goals
  if(runningGoals)  {
    Goal& goal = defaultGoals[goalIdx];
    if(goal.action == GoalAction::NONE) {
      runningGoals = false;
      reachedPathEnd = true; // prevent path
      return;
    }
    #ifdef DEBUG
      Serial.println();
      Serial.print("goal ");Serial.print(goalIdx); Serial.print(" act ");Serial.print(goal.action); Serial.print(" p1 ");Serial.print(goal.param1); Serial.print(" p2 ");Serial.print(goal.param2);
    #endif
    if(goal.action == GoalAction::FORWARD) {
      moveDistance(goal.param1, goal.param2);
    }
    else if(goal.action == GoalAction::BACKWARD) {
      moveDistance(-goal.param1, goal.param2);
    }
    else if(goal.action == GoalAction::TURN_TO_ANGLE) {
      turn_to_angle(goal.param1, goal.param2);
    }
    goalIdx++;
    neopixel.fill(robotIdColor);
    neopixel.show();
  }
  // Move using pathfinding
  else if(not reachedPathEnd) {
    // Position in map
    uint8_t currentMapX = pathfinder_unitToX(positionXmm);
    uint8_t currentMapY = pathfinder_unitToY(positionYmm);
    int16_t currentMapIdx = pathfinder_XYToIdx(currentMapX, currentMapY);
    #ifdef DEBUG
      Serial.println();
      Serial.print("Move path ");
      Serial.print(currentMapX);Serial.print(" ");Serial.print(currentMapY);Serial.print(" ");Serial.print(currentMapIdx);
    #endif
    // Compute path if empty
    if(pathfinderPath[0] == -1) {
      updatePathfinding();
    }
    // Move along path to find current position
    int16_t currentPathIdx = pathfinderPathIndex;
    for(int i=0;i < PATHFINDER_PATH_SIZE && pathfinderPath[i]!=-1;i++) {
      if(currentMapIdx == pathfinderPath[i]) {
        currentPathIdx = i;
      }
    }
    pathfinderPathIndex = currentPathIdx;
    if(currentPathIdx==-1) return;
    // Get next position along path
    int16_t nextPathIdx = currentPathIdx+1;
    if(nextPathIdx>=PATHFINDER_PATH_SIZE || pathfinderPath[nextPathIdx]==-1) {
      reachedPathEnd = true;
      return;
    }
    // Get direction to next position
    int16_t nextMapX = 0;
    int16_t nextMapY = 0;
    int16_t nextMapIdx = pathfinderPath[nextPathIdx];
    pathfinder_IdxToXY(nextMapIdx, nextMapX, nextMapY);
    // Compute next rotation
         if(nextMapX==currentMapX and nextMapY>currentMapY) { nextAngle= -90; }
    else if(nextMapX==currentMapX and nextMapY<currentMapY) { nextAngle= 90; }
    else if(nextMapX>currentMapX  and nextMapY==currentMapY) { nextAngle= 0; }
    else if(nextMapX<currentMapX  and nextMapY==currentMapY) { nextAngle= 180; }
    else if(nextMapX>currentMapX  and nextMapY>currentMapY) { nextAngle= -45; }
    else if(nextMapX>currentMapX  and nextMapY<currentMapY) { nextAngle= 45; }
    else if(nextMapX<currentMapX  and nextMapY>currentMapY) { nextAngle= -135; }
    else if(nextMapX<currentMapX  and nextMapY<currentMapY) { nextAngle= 135; }
    #ifdef DEBUG
      Serial.print(" next ");
      Serial.print(nextMapX);Serial.print(" ");Serial.print(nextMapY);Serial.print(" angle ");Serial.print(positionAngleDeg);Serial.print(" nextangle ");Serial.print(nextAngle);
    #endif
    if(positionAngleDeg != nextAngle){
      turn_to_angle(nextAngle, MIN_ROTATION_STEP_DELAY);
    }
    else{
      // Compute next movement forward
      int16_t distErrorX = abs(positionXmm - pathfinder_xToUnit(nextMapX, true));
      int16_t distErrorY = abs(positionYmm - pathfinder_yToUnit(nextMapY, true));
      int16_t distErrorDiag = sqrt(2.f)*distErrorX;
           if(positionAngleDeg==0)   distError = distErrorX;
      else if(positionAngleDeg==180) distError = distErrorX;
      else if(positionAngleDeg==90)  distError = distErrorY;
      else if(positionAngleDeg==-90) distError = distErrorY;
      else distError = distErrorDiag;
      moveDistance(distError, MIN_TRANSLATION_STEP_DELAY);
    }
    neopixel.fill(robotIdColor);
    neopixel.show();
  }
  // Target reached time to touch a plant
  else {
    if(waitingForEnd) return; //already done
    collisionDisabled=true;
    // Make sure of target angle
    turn_to_angle(targetAngleDeg, MIN_ROTATION_STEP_DELAY);
    // Try to approach a plant before lowering the servo
    /*int16_t approachDistance = 50;//mm
    neopixel.fill(COLOR_BLUE);
    neopixel.show();
    while(true){
      uint16_t telemeterRange = updateTelemeter();
      bool leftContact = !digitalRead(CONTACT_L);
      bool rightContact = !digitalRead(CONTACT_R);
      #ifdef DEBUG
        Serial.print(" range ");Serial.println(telemeterRange);
      #endif
      if(!isTimeLeft()) break;
      if(leftContact || rightContact) break;
      if(telemeterRange < approachDistance) break;
      forward(MIN_TRANSLATION_STEP_DELAY*1.5);
    }*/
    neopixel.fill(COLOR_GREEN);
    neopixel.show();
    // Move approachDistance and lower arm
    /*for(int i=0;i<(approachDistance/MM_PER_ROBOT_TRANSLATION);i++) {
      forward(MIN_TRANSLATION_STEP_DELAY*4);
    }*/
    waitingForEnd = true;
  }

}

bool isInCollision(int16_t telemMinRange) {
  uint16_t telemeterRange = updateTelemeter();
  bool leftContact = !digitalRead(CONTACT_L);
  bool rightContact = !digitalRead(CONTACT_R);
  float remainingDist = distanceToTarget();
  bool collision = !collisionDisabled
    && remainingDist > targetNoCollisionDist
    && (    leftContact
        or rightContact
        or (!collisionTelemeterDisabled and telemeterRange<telemMinRange)
    );
  #ifdef DEBUG
    if(collision) {
      Serial.print(">range:");Serial.println(telemeterRange);
    }
  #endif
  if(collision) lastRange = 1000; //reset telemeter filter
  return collision;
}
uint16_t updateTelemeter() { // Expeted to last 500us
  uint16_t range = 1000;
  //unsigned long t1 = micros();
  if(vl53.readRangeNoBlocking(range)) {
    lastRange = lastRange*0.6 + range*0.4;
  }
  
  //unsigned long t2 = micros();
  //Serial.print(t2-t1);Serial.print("us;  read ");Serial.print(range);Serial.println("mm");
  return lastRange;
}

bool moveDistance(int16_t distance, int16_t delayTime) {
  if(consecutiveForwardCount == 0) delay(100); //small delay to stabilize after a rotation
  consecutiveForwardCount = 0;
  bool isForward = distance>=0;
  int16_t distError = abs(distance);  
  int16_t stepDuration = MAX_TRANSLATION_STEP_DELAY;
  while(isTimeLeft() && distError >= MM_PER_ROBOT_TRANSLATION) {  
    // Accel
    float speedStep = 100;//300;
    if(consecutiveForwardCount >= 3) speedStep = 75;//200;
    if(consecutiveForwardCount >= 6) speedStep = 50;//100;
    if(consecutiveForwardCount >= 8) speedStep = 25;//50;
    if(consecutiveForwardCount >= 10) speedStep = 15;//25;
    stepDuration -= speedStep;
    stepDuration = max(stepDuration, MIN_TRANSLATION_STEP_DELAY);
    /*if(consecutiveForwardCount == 0) stepDuration = 1500;
    else if(consecutiveForwardCount == 1) stepDuration = 1000;
    else if(consecutiveForwardCount == 2) stepDuration = 600;
    else if(consecutiveForwardCount == 3) stepDuration = 350;
    else if(consecutiveForwardCount == 4) stepDuration = 300;
    else if(consecutiveForwardCount == 5) stepDuration = 275;
    else if(consecutiveForwardCount == 6) stepDuration = 250;
    else if(consecutiveForwardCount == 7) stepDuration = 225;
    else if(consecutiveForwardCount == 8) stepDuration = 200;
    else if(consecutiveForwardCount == 9) stepDuration = 175;*/
    //else if(consecutiveForwardCount == 3) stepDuration = 500;
    if(distError <= 15 ) stepDuration = 1000;
    else if(distError <= 25 ) stepDuration = 750;
    else if(distError <= 35 ) stepDuration = 500;
    else if(distError <= 45 ) stepDuration = 350;
    else if(distError <= 55 ) stepDuration = 300;
    else if(distError <= 65 ) stepDuration = 275;
    else if(distError <= 75 ) stepDuration = 250;
    else if(distError <= 85 ) stepDuration = 225;
    else if(distError <= 95 ) stepDuration = 200;
    else if(distError <= 105 ) stepDuration = 175;

    stepDuration = max(stepDuration, delayTime);

    int16_t collisionDist = 50;
    /*if(stepDuration <= 300) collisionDist = 240;
    else */if(stepDuration <= 750) collisionDist = 110;
    if(isInCollision(collisionDist)) {
      emergencyBreak = true;
      neopixel.fill(COLOR_RED);
      neopixel.show();
      //TODO better handle slow down (avoid from farther away to have slow time)
      int16_t speed1 = min(stepDuration*2, 1000);
      int16_t speed2 = min(stepDuration*4, 1000);
      int16_t speed3 = min(stepDuration*6, 1000);
      isForward?forward(speed1):backward(speed1);
      isForward?forward(speed2):backward(speed2);
      isForward?forward(speed3):backward(speed3);
      break;
    }

    #ifdef DEBUG
      Serial.println();
      Serial.print(" forward err ");Serial.print(distError);Serial.print(" stepDuration ");Serial.print(stepDuration);
    #endif
    isForward?forward(stepDuration):backward(stepDuration);
    consecutiveForwardCount++;
    distError = abs(distance) - MM_PER_ROBOT_TRANSLATION*consecutiveForwardCount;
  }
}

void forward(int16_t delayTime){
  uint16_t steps = STEP_PER_ROBOT_TRANSLATION;
  moveSteppers(true, true, steps, steps, delayTime);
  if(positionAngleDeg==0) positionXmm += MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==180) positionXmm -= MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==90) positionYmm -= MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==-90) positionYmm += MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==45) { positionXmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==-45) { positionXmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==135) { positionXmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==-135) { positionXmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); }
}
void backward(int16_t delayTime){
  uint16_t steps = STEP_PER_ROBOT_TRANSLATION;
  moveSteppers(false, false, steps, steps, delayTime);
  if(positionAngleDeg==0) positionXmm -= MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==180) positionXmm += MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==90) positionYmm += MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==-90) positionYmm -= MM_PER_ROBOT_TRANSLATION;
  if(positionAngleDeg==45) { positionXmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==-45) { positionXmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==135) { positionXmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); }
  if(positionAngleDeg==-135) { positionXmm += MM_PER_ROBOT_TRANSLATION/sqrt(2); positionYmm -= MM_PER_ROBOT_TRANSLATION/sqrt(2); }
}

void turn_to_angle(int16_t targetAngle, int16_t delayTime){
  if(consecutiveForwardCount != 0) delay(50); //small delay to stabilize after a translation
  consecutiveForwardCount = 0;
  #ifdef DEBUG
    Serial.println();
    Serial.print(" turn"); Serial.print(" positionAngleDeg");Serial.print(positionAngleDeg); Serial.print(" targetAngle");Serial.println(targetAngle);
  #endif
  while(isTimeLeft() && positionAngleDeg != targetAngle) {
    if(targetAngle==180 && positionAngleDeg>=0) turn_left(delayTime);
    else if(targetAngle==180 && positionAngleDeg<0) turn_right(delayTime);
    else if(positionAngleDeg==180 && targetAngle>=0) turn_right(delayTime);
    else if(positionAngleDeg==180 && targetAngle<0) turn_left(delayTime);
    else if(targetAngle>positionAngleDeg) turn_left(delayTime);
    else turn_right(delayTime);
  }
}
void turn_left(int16_t delayTime){
  uint16_t steps = STEP_PER_ROBOT_ROTATION;
  // Split rotation into accels
  uint16_t accelASteps = 10;
  uint16_t accelBSteps = 20;
  uint16_t accelCSteps = 40;
  uint16_t stepsMinusAccels = steps - accelASteps*2 - accelBSteps*2 - accelCSteps*2;
  moveSteppers(false, true, accelASteps, accelASteps, delayTime*4);
  moveSteppers(false, true, accelBSteps, accelBSteps, delayTime*3);
  moveSteppers(false, true, accelCSteps, accelCSteps, delayTime*2);
  moveSteppers(false, true, stepsMinusAccels, stepsMinusAccels, delayTime);
  moveSteppers(false, true, accelCSteps, accelCSteps, delayTime*2);
  moveSteppers(false, true, accelBSteps, accelBSteps, delayTime*3);
  moveSteppers(false, true, accelASteps, accelASteps, delayTime*4);
  positionAngleDeg += DEG_PER_ROBOT_ROTATION;
  if(positionAngleDeg<=-180) positionAngleDeg += 360;
  if(positionAngleDeg>180) positionAngleDeg -= 360;
}
void turn_right(int16_t delayTime){
  uint16_t steps = STEP_PER_ROBOT_ROTATION;
  // Split rotation into accels
  uint16_t accelASteps = 20;
  uint16_t accelBSteps = 50;
  uint16_t stepsMinusAccels = steps - accelASteps*2 - accelBSteps*2;
  moveSteppers(true, false, accelASteps, accelASteps, delayTime*4);
  moveSteppers(true, false, accelBSteps, accelBSteps, delayTime*2);
  moveSteppers(true, false, stepsMinusAccels, stepsMinusAccels, delayTime);
  moveSteppers(true, false, accelBSteps, accelBSteps, delayTime*2);
  moveSteppers(true, false, accelASteps, accelASteps, delayTime*4);
  positionAngleDeg -= DEG_PER_ROBOT_ROTATION;
  if(positionAngleDeg<=-180) positionAngleDeg += 360;
  if(positionAngleDeg>180) positionAngleDeg -= 360;
}

void moveSteppers(bool leftForward, bool rightForward, uint16_t leftSteps, uint16_t rightSteps, uint16_t sleepTime) {
  digitalWrite(STEPPER_L_DIR, !leftForward);
  digitalWrite(STEPPER_R_DIR, rightForward);
  while(leftSteps>0 or rightSteps>0) {
    if(leftSteps>0){
      stepLeftPinVal = !stepLeftPinVal;
      digitalWrite(STEPPER_L_STEP, stepLeftPinVal);
      leftSteps--;
    }
    if(rightSteps>0){
      stepRightPinVal = !stepRightPinVal;
      digitalWrite(STEPPER_R_STEP, stepRightPinVal);
      rightSteps--;
    }
    /*if(leftSteps>0 or rightSteps>0)*/ delayMicroseconds(sleepTime); // do not sleep if no step left
  }
}

bool updatePathfinding(MapUpdate newUpdate) {
  const uint8_t W = 255; // cost of a wall
  const uint8_t A = team==TEAM_A?4:10; // cost of a team A zone
  const uint8_t B = team==TEAM_B?4:10; // cost of a team B zone
  const uint8_t U = 3  ; // cost of uncertain zone
  const uint8_t _ = 2  ; // cost of empty space
  static uint8_t map[PATHFINDER_MAP_SIZE] = { // width and height needs to match PATHFINDER_MAP_W and PATHFINDER_MAP_H
    A,A,A,A,A,A,A,A,A,A,B,B,B,B,B,B,B,B,B,B,
    A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,
    A,A,A,_,_,_,_,_,_,U,U,_,_,_,_,_,_,B,B,B,
    A,_,_,_,_,_,_,_,_,U,U,_,_,_,_,_,_,_,_,B,
    A,_,_,_,_,_,U,U,_,_,_,_,U,U,_,_,_,_,_,B,
    B,B,B,_,_,_,U,U,_,_,_,_,U,U,_,_,_,A,A,A,
    B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,A,A,A,
    B,B,B,_,_,_,U,U,_,_,_,_,U,U,_,_,_,A,A,A,
    B,_,_,_,_,_,U,U,_,_,_,_,U,U,_,_,_,_,_,A,
    B,_,_,_,_,_,_,_,_,U,U,_,_,_,_,_,_,_,_,A,
    A,A,A,_,_,_,_,_,_,U,U,_,_,_,_,_,_,B,B,B,
    A,A,A,_,_,_,U,U,_,_,_,_,U,U,_,_,_,B,B,B,
    A,A,A,U,U,U,U,U,U,U,U,U,U,U,U,U,U,B,B,B
  };

  // Add new map update
  if(newUpdate.x!=-1 && newUpdate.y!=-1) {
    mapUpdates[mapUpdateCount++] = newUpdate;
  }

  // Apply map updates
  for(int i=0;i<mapUpdateCount && i<MAP_UPDATE_MAX;i++) {
    uint16_t idx = pathfinder_XYToIdx(mapUpdates[i].x, mapUpdates[i].y);
    map[idx] = mapUpdates[i].cost;
  }

  // Search for path
  uint8_t currentMapX = pathfinder_unitToX(positionXmm);
  uint8_t currentMapY = pathfinder_unitToY(positionYmm);
  uint8_t targetMapX = pathfinder_unitToX(targetXmm);
  uint8_t targetMapY = pathfinder_unitToY(targetYmm);
  #ifdef DEBUG
    Serial.print("From(mm):");Serial.print(positionXmm);Serial.print(", ");Serial.print(positionYmm);
    Serial.print(" ");Serial.print(currentMapX);Serial.print(", ");Serial.print(currentMapX);
    Serial.print(" To(mm):");Serial.print(targetXmm);Serial.print(", ");Serial.print(targetYmm);
    Serial.print(" ");Serial.print(targetMapX);Serial.print(", ");Serial.print(targetMapY);
  #endif
  bool found = pathfinder_find(map, pathfinderPath,
    /*FROM_XY*/ currentMapX, currentMapY,
    /*TO_XY*/ targetMapX, targetMapY
  );

  // Debug print path
  #ifdef DEBUG
    pathfinder_display(map, pathfinderPath, ".123456789!");
  #endif
  // Reset path finder path index as the path is new
  pathfinderPathIndex = 0;
  
  return found;
};
