#include "BrushlessMotor.h" 

#define MODE_I2C
#ifndef MODE_I2C
  #define MODE_SERIAL
  #define SERIAL_DEBUG
#endif
#include "comunication.h"

const double wheelPerimeter = 186.5;//188.495559215;//mm = pi*d = pi*60
const double wheelDistanceA = 120;//mm
const double wheelDistanceB = 125.4;//mm
const double wheelDistanceC = 123;//mm

BrushlessMotor motorA(0, wheelPerimeter, true);//9,10,11
BrushlessMotor motorB(1, wheelPerimeter, true);//5,3,2
BrushlessMotor motorC(2, wheelPerimeter, true);//8,7,6

const double motorA_angle = -60;//°
const double motorB_angle = 180;//°
const double motorC_angle = 60;//°

//--FRONT-
//-A-----C
//---\-/--
//----|---
//----B---
//--BACK--

typedef struct {
  float x=0;
  float y=0;
  float angle=0;
  PathSegment(float _x, float _y, float _angle){
    this->x = _x;
    this->y = _y;
    this->angle = _angle;
  }
} PathSegment;

PathSegment targetPath[50];
int targetPathIndex = 0;
int targetPathSize = 0;
bool runTargetPath = false;

void setup()
{
  //Serial.begin(115200);
  //Init motor
  motorA.begin();  
  motorB.begin();
  motorC.begin();

  //Init communication
  comunication_begin(7);//I2C address 7

  /*motorA.setSpeed(1);
  motorB.setSpeed(1);
  motorC.setSpeed(1);*/
}
//wheel perimeter 247mm

//In meters, degrees, m/s and °/s
double xPos = 0, yPos = 0, anglePos = 0;
double xTarget = 0, yTarget = 0, angleTarget = 0, speedTarget = 5.5, angleSpeedTarget = 50;

void updatePosition(){
  double distA = motorA.getAndResetDistanceDone();
  double distB = motorB.getAndResetDistanceDone();
  double distC = motorC.getAndResetDistanceDone();
  
  double xA = sin((motorA_angle+anglePos+90.0d)*DEG_TO_RAD)*distA;
  double xB = sin((motorB_angle+anglePos+90.0d)*DEG_TO_RAD)*distB;
  double xC = sin((motorC_angle+anglePos+90.0d)*DEG_TO_RAD)*distC;

  double yA = cos((motorA_angle+anglePos+90.0d)*DEG_TO_RAD)*distA; //motorA_angle+90 is the wheel angle
  double yB = cos((motorB_angle+anglePos+90.0d)*DEG_TO_RAD)*distB;
  double yC = cos((motorC_angle+anglePos+90.0d)*DEG_TO_RAD)*distC;

  xPos += (xA+xB+xC)*0.635;
  yPos += (yA+yB+yC)*0.635;

  double angleDoneA = (distA*360)/(2.0d*PI*(wheelDistanceA/1000.0d));
  double angleDoneB = (distB*360)/(2.0d*PI*(wheelDistanceB/1000.0d));
  double angleDoneC = (distC*360)/(2.0d*PI*(wheelDistanceC/1000.0d));

  anglePos += (angleDoneA+angleDoneB+angleDoneC)/3.0d;
  if(anglePos>180.0d) anglePos += -360.0d;
  if(anglePos<-180.0d) anglePos += 360.0d;
}


double custom_mod(double a, double n){
  return a - floor(a/n) * n;
}

double angleDiff(double a, double b){
  return custom_mod((a-b)+180, 360)-180;
}

double targetMovmentAngle = 0;
double targetSpeed_mps = 0.0;// m/s
double targetAngleSpeed_dps = 0;// °/s

double targetAngleError = 1.0; //°
double targetPosError = 0.005; //meters
bool targetReached = true;
int targetReachedCountTarget = 10;
int targetReachedCount = 0;

//Y is forward, X is right side (motor C side)
void updateAsserv(){
  //Translation
  double xDiff = xTarget - xPos;
  double yDiff = yTarget - yPos;
  double translationError = sqrt(pow(xPos - xTarget,2) + pow(yPos - yTarget,2)); // meters
  double translationAngle = 0;
  if(xDiff!=0.f)
    translationAngle = atan2(xDiff, yDiff)*RAD_TO_DEG;
  else if(yDiff<0.f)
    translationAngle = -180;

  targetMovmentAngle = angleDiff(translationAngle, anglePos);

  //Translation Speed
  double slowDownDistance = 0.2;//m
  //double speedFromError = translationError*2;//Speed from error
  if(translationError>slowDownDistance) targetSpeed_mps = speedTarget;
  else targetSpeed_mps = (speedTarget/slowDownDistance)*translationError;
  if(abs(targetSpeed_mps)>speedTarget) //reduce to max speed
    targetSpeed_mps = targetSpeed_mps>0?speedTarget:-speedTarget;
  

  //Rotation
  double slowDownAngle = 15;//deg
  double rotationError = angleDiff(angleTarget,anglePos);
  //double speedFromError = rotationError*5;
  if(rotationError>slowDownAngle) targetAngleSpeed_dps = angleSpeedTarget;
  else targetAngleSpeed_dps = (angleSpeedTarget/slowDownAngle)*rotationError;
  if(abs(targetAngleSpeed_dps)>angleSpeedTarget)
    targetAngleSpeed_dps = targetAngleSpeed_dps>0?angleSpeedTarget:-angleSpeedTarget;
   //targetAngleSpeed_dps = 0;
  //Limit speed variation rate
  //if(abs(targetAngleSpeed_dps)<0.01 && abs(speedFromError)>0) targetAngleSpeed_dps=speedFromError>0?0.01:-0.01;
  //if(targetAngleSpeed_dps*0.8<speedFromError) speedFromError = targetAngleSpeed_dps*0.0;
  //if(targetAngleSpeed_dps*1.2>speedFromError) speedFromError = targetAngleSpeed_dps*1.2;
  //targetAngleSpeed_dps = speedFromError;

  if(translationError>targetPosError || fabs(rotationError)>targetAngleError){
    targetReached = false;
    targetReachedCount=0;
  }
  else{
    if(targetReachedCount >= targetReachedCountTarget)
      targetReached = true;  
    targetReachedCount++;
    targetAngleSpeed_dps=0;
    targetSpeed_mps=0;
    runTargetPath=false;
    targetPathSize=0;
  }
}

void printCharts(){
  //Position
  Serial.print(xPos*1000);Serial.print(" ");
  Serial.print(yPos*1000);Serial.print(" ");
  Serial.print(xTarget*1000);Serial.print(" ");
  Serial.print(yTarget*1000);Serial.print(" ");

  //Angle
  Serial.print(anglePos);Serial.print(" ");
  Serial.print(angleTarget);Serial.print(" ");
  Serial.print(targetMovmentAngle);Serial.print(" ");

  //Angle Speed
  Serial.print(targetAngleSpeed_dps);Serial.print(" ");
  Serial.print(angleSpeedTarget);Serial.print(" ");

  //Position Speed
  Serial.print(targetSpeed_mps*1000);Serial.print(" ");
  Serial.print(speedTarget*1000);Serial.print(" ");

  //Motor Speed
  Serial.print(motorB.getSpeed()*1000);Serial.print(" ");
  Serial.print(0/*motorB.getPower()*1000*/);Serial.print(" ");
  //Serial.print(motorB.getSpeed()*1000);Serial.print(" ");
  //Serial.print(motorC.getSpeed()*1000);Serial.print(" ");
  Serial.print("\r\n");
}

float nextPathTranslationError = 0.05;//meters
float nextPathRotationError = 45;//degrees -> not much important
void updatePath(){
  if(!runTargetPath) return;
  //Set current target
  xTarget = targetPath[targetPathIndex].x;
  yTarget = targetPath[targetPathIndex].y;
  angleTarget = targetPath[targetPathIndex].angle;

  //Compute error to switch to next target
  double translationError = sqrt(pow(xPos - xTarget,2) + pow(yPos - yTarget,2)); // meters
  double rotationError = angleDiff(angleTarget,anglePos);
  if(targetPathIndex<targetPathSize-1
    && translationError < nextPathTranslationError
    && rotationError < nextPathRotationError){
      targetPathIndex++;
  } 
  
  //Set new target
  xTarget = targetPath[targetPathIndex].x;
  yTarget = targetPath[targetPathIndex].y;
  angleTarget = targetPath[targetPathIndex].angle;
}

bool movementEnabled = false;
bool emergencyStop = false;
bool manualMode = false;
void control(){
  //Update position
  //updatePosition();
  //Serial.print("Position\t");Serial.print(xPos);Serial.print("\t");Serial.print(yPos);Serial.print("\t");Serial.print(anglePos);Serial.print("\n");

  //double daTargetDistance = sqrt(pow(xpos - xTarget,2) + pow(ypos - yTarget,2)); // meters
  //double daTargetAngle = angleDiff(angleTarget,angle);

  //Update target from path
  if(runTargetPath) updatePath();
  
  /* Compute speeds with asserv:
   *  targetMovmentAngle
   *  targetSpeed_mps
   *  targetAngleSpeed_dps
   */
  if(!manualMode) updateAsserv();
  #ifdef SERIAL_DEBUG
    printCharts();
  #endif
  
  
  //Compute translation
  double speedA = targetSpeed_mps * sin((targetMovmentAngle-motorA_angle)*DEG_TO_RAD);
  double speedB = targetSpeed_mps * sin((targetMovmentAngle-motorB_angle)*DEG_TO_RAD);
  double speedC = targetSpeed_mps * sin((targetMovmentAngle-motorC_angle)*DEG_TO_RAD);

  //Compute Rotation
  double arcLengthA = 2.0d*PI*(wheelDistanceA/1000.d)*(targetAngleSpeed_dps/360.0d); // arcLength in meters.
  double arcLengthB = 2.0d*PI*(wheelDistanceB/1000.d)*(targetAngleSpeed_dps/360.0d); // arcLength in meters.
  double arcLengthC = 2.0d*PI*(wheelDistanceC/1000.d)*(targetAngleSpeed_dps/360.0d); // arcLength in meters.
  double speedAngleA = arcLengthA; 
  double speedAngleB = arcLengthB;
  double speedAngleC = arcLengthC;
  
  //Serial.print(speedA*1000.0d);Serial.print("\t");Serial.print(arcLength*1000.0d);Serial.print("\n");
  
  speedA += speedAngleA;
  speedB += speedAngleB;
  speedC += speedAngleC;


  //Serial.print(speedA*1000000.f);Serial.print("\t");Serial.print(speedB*1000000.f);Serial.print("\t");Serial.print(speedC*1000000.f);Serial.print("\n");
  //Serial.print(motorA.m_currSleep);Serial.print("\t");Serial.print(motorB.m_currSleep==0);Serial.print("\t");Serial.print(motorC.m_currSleep);Serial.print("\n");

  //Compute Sync Factor -> so motors slows their Acceleration based on the max-accelerating one
  double syncFactorA=1, syncFactorB=1, syncFactorC=1;
  double speedDiffA = abs(speedA - motorA.getSpeed());
  double speedDiffB = abs(speedB - motorB.getSpeed());
  double speedDiffC = abs(speedC - motorC.getSpeed());
  double speedDiffMax = max(speedDiffA,max(speedDiffB,speedDiffC));
  syncFactorA = 1;//speedDiffA/speedDiffMax;
  syncFactorB = 1;//speedDiffB/speedDiffMax;
  syncFactorC = 1;//speedDiffC/speedDiffMax;
  
  //Drive motors
  if(!emergencyStop && movementEnabled){
    motorA.setSpeed(speedA, syncFactorA);
    motorB.setSpeed(speedB, syncFactorB);
    motorC.setSpeed(speedC, syncFactorC);
  }
  else{
    motorA.setSpeed(0);
    motorB.setSpeed(0);
    motorC.setSpeed(0);
  }
}

int positionFrequency = 200; //Hz
int controlFrequency = 60; //Hz

void executeOrder(){
  comunication_read();
  if(comunication_msgAvailable()){
    if(comunication_InBuffer[0] == '#' && comunication_InBuffer[1] != '\0'){
      //ignore
    }
    else if(strstr(comunication_InBuffer, "id")){
      sprintf(comunication_OutBuffer, "MovingBaseAlexandreV4");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "move enable")){
      movementEnabled = true;
      emergencyStop = false;
      sprintf(comunication_OutBuffer, "move OK");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "move disable")){
      movementEnabled = false;
      sprintf(comunication_OutBuffer, "move OK");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "pos set ")){
      sprintf(comunication_OutBuffer, "pos OK");//max 29 Bytes
      comunication_write();//async
      int x_pos=0, y_pos=0, angle_pos=0;
      int res = sscanf(comunication_InBuffer, "pos set %i %i %i", &y_pos, &x_pos, &angle_pos);
      xPos = (float)(x_pos)/1000.0f;
      yPos = (float)(y_pos)/1000.0f;
      anglePos = angle_pos;
      xTarget = xPos;
      yTarget = yPos;
      angleTarget = anglePos;
    }
    else if(strstr(comunication_InBuffer, "pos getXY")){
      sprintf(comunication_OutBuffer,"pos %i %i %i %i",(int)(yPos*1000.0f), (int)(xPos*1000.0f), (int)(anglePos), (int)(targetSpeed_mps*10));
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "pos getDA")){
      sprintf(comunication_OutBuffer, "ERROR");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "move XY ")){
      sprintf(comunication_OutBuffer,"move OK");
      comunication_write();//async
      int i_x_pos=0, i_y_pos=0, i_angle=0, i_speed_pos=1;
      sscanf(comunication_InBuffer, "move XY %i %i %i %i", &i_y_pos, &i_x_pos, &i_angle, &i_speed_pos);
      xTarget = (float)(i_x_pos)/1000.0f;
      yTarget = (float)(i_y_pos)/1000.0f;
      angleTarget = (float)(i_angle);
      speedTarget = (float)(i_speed_pos)/10.0f;
      angleSpeedTarget = speedTarget * 90.f;
      targetReached = false;
      emergencyStop = false;
      targetReached = false;
      runTargetPath = false;
    }
    else if(strstr(comunication_InBuffer, "path set ")){
      sprintf(comunication_OutBuffer,"path OK");
      comunication_write();//async
      int action=-1, i_x_pos=0, i_y_pos=0, i_angle=0, i_speed_pos=1;
      sscanf(comunication_InBuffer, "path set %i %i %i %i %i", &action, &i_y_pos, &i_x_pos, &i_angle, &i_speed_pos);
      if(action==-1){}//nothing
      if(action==0){//reset
        targetReached = false;
        targetPathIndex = 0;
        targetPathSize = 0;
        runTargetPath = false;
      }
      if(action==0 || action==1 || action==2){//add
        int idx = targetPathSize;
        targetPath[idx].x = (float)(i_x_pos)/1000.0f;
        targetPath[idx].y = (float)(i_y_pos)/1000.0f;
        targetPath[idx].angle = (float)(i_angle);
        speedTarget = (float)(i_speed_pos)/10.0f;
        angleSpeedTarget = speedTarget * 90.f;
        targetPathSize++;
      }
      if(action==2 && targetPathSize){//run
        targetReached = false;
        runTargetPath = true;
        emergencyStop = false;
        targetReached = false;
      }
    }
    else if(strstr(comunication_InBuffer, "move DA")){
      sprintf(comunication_OutBuffer, "ERROR");//max 29 Bytes
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "status get")){
      sprintf(comunication_OutBuffer,"%s %i %i %i %i %i", (targetReached?"end":"run"), (int)(yPos*1000.0f), (int)(xPos*1000.0f), (int)(anglePos), (int)(targetSpeed_mps*10), targetPathIndex);
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "speed get")){
      sprintf(comunication_OutBuffer,"speed %.1f",targetSpeed_mps);
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "move break")){
      emergencyStop = true;
      sprintf(comunication_OutBuffer,"move OK");
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "move RM")){
      int i_distance=0, i_vitesse=4;
      sscanf(comunication_InBuffer, "move RM %i %i", &i_distance, &i_vitesse);
      sprintf(comunication_OutBuffer,"ERROR");
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "support XY")){
      sprintf(comunication_OutBuffer,"support 1");
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "support Path")){
      sprintf(comunication_OutBuffer,"support 1");
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "manual enable")){
      manualMode=true;
      sprintf(comunication_OutBuffer,"manual OK");
      comunication_write();//async
    }
    else if(strstr(comunication_InBuffer, "manual disable")){
      sprintf(comunication_OutBuffer,"manual OK");
      comunication_write();//async
      manualMode=false;
      targetMovmentAngle = 0;
      targetSpeed_mps = 0;
      targetAngleSpeed_dps = 0;
      xTarget = xPos;
      yTarget = yPos;
      angleTarget = anglePos;
    }
    else if(strstr(comunication_InBuffer, "manual set ")){
      sprintf(comunication_OutBuffer,"manual OK");
      comunication_write();//async
      int i_move_angle=0, i_move_speed=0, i_angle_speed=0;
      sscanf(comunication_InBuffer, "manual set %i %i %i", &i_move_angle, &i_move_speed, &i_angle_speed);
      targetMovmentAngle = i_move_angle;
      targetSpeed_mps = (float)(i_move_speed)/10.0f;
      targetAngleSpeed_dps = i_angle_speed;
      emergencyStop = false;
      runTargetPath = false;
    }
    else{
      sprintf(comunication_OutBuffer,"ERROR");
      comunication_write();//async
    }
    comunication_cleanInputs();
  }
}

unsigned long lastControlMillis = 0;
unsigned long lastPositionMillis = 0;
float sinCounter = 0;
void loop()
{
  //Read commands
  executeOrder();

  unsigned long currMillis = millis();
  
  //Run position loop
  int positionMillis = 1000/positionFrequency;
  if(currMillis - lastPositionMillis >= positionMillis){
    lastPositionMillis = currMillis;
    updatePosition();
  }
  
  //Run control loop
  int controlMillis = 1000/controlFrequency;
  if(currMillis - lastControlMillis >= controlMillis){
    lastControlMillis = currMillis;
    control();
  }

  //Spin motors
  motorA.spin();
  motorB.spin();
  motorC.spin();
}
