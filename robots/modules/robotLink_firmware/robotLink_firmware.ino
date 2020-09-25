#include <Wire.h>

void setup(){
  Wire.begin(); // join i2c bus (address optional for master)
  Serial.begin(115200);
}

#define COMUNICATION_START_BYTE '^'
#define COMUNICATION_END_BYTE '\n'
#define COMUNICATION_BUFFER_IN_SIZE 40
#define COMUNICATION_BUFFER_OUT_SIZE 30
volatile char comunication_InBuffer[COMUNICATION_BUFFER_IN_SIZE];
volatile char comunication_OutBuffer[COMUNICATION_BUFFER_OUT_SIZE];

void sendI2CMsg(int address){
  //Apply protocol
  //prepend start byte
  int lastIndex = COMUNICATION_BUFFER_OUT_SIZE-2;
  for(int i=COMUNICATION_BUFFER_OUT_SIZE-2;i>0;i--){
    comunication_OutBuffer[i] = comunication_OutBuffer[i-1];
    if(comunication_OutBuffer[i] == '\0') lastIndex = i;
  }
  comunication_OutBuffer[0] = COMUNICATION_START_BYTE;
  //append end byte
  comunication_OutBuffer[lastIndex+1] = COMUNICATION_END_BYTE;
  //compute checksum
  unsigned char checksum = 0;
  for(int i=1;i<lastIndex;i++){
    checksum ^= comunication_OutBuffer[i];
  }
  comunication_OutBuffer[lastIndex] = checksum;

  Wire.beginTransmission(address);
  Wire.write(' ');
  Wire.write((char*)comunication_OutBuffer);
  Wire.endTransmission();
  memset(comunication_OutBuffer, '\0', COMUNICATION_BUFFER_OUT_SIZE);
}

bool readI2CMsg(int address, bool sendError=false){
  int quantity=32;
  bool valid = true;
  Wire.requestFrom(address, quantity);
  int idx=0;
  memset(comunication_InBuffer, '\0', COMUNICATION_BUFFER_IN_SIZE);
  while(Wire.available()){
    char c = Wire.read();    // receive a byte as character
    //if(idx++==-1)continue; // ignore first byte
    comunication_InBuffer[idx++] = c;
    if(!Wire.available()) delay(1);
  }
  
  //verify message
  if(idx>0){
    if(comunication_InBuffer[0] != COMUNICATION_START_BYTE)
      valid = false;
    //remove start byte
    int endIndex = 0;
    for(int i=1;i<COMUNICATION_BUFFER_IN_SIZE;i++){
      comunication_InBuffer[i-1] = comunication_InBuffer[i];
      if(comunication_InBuffer[i-1] == COMUNICATION_END_BYTE)
        endIndex = i-1;
    }
    if(endIndex == 0)
      valid = false;
    //compute checksum
    unsigned char checksum = 0;
    for(int i=0;i<endIndex-1;i++){
      checksum ^= comunication_InBuffer[i];
    }
    if(valid && checksum != comunication_InBuffer[endIndex-1])
      valid = false;
    if(valid){//Message ready
      comunication_InBuffer[endIndex-1] = '\0';
    }
    else if(sendError){//Report Error
      sprintf(comunication_InBuffer, "ERROR");
    }
    //Send over serial
    if(valid || sendError){
      Serial.print("r ");
      Serial.print(address);
      Serial.print(" ");
      Serial.println((char*)comunication_InBuffer);
    }
    memset(comunication_InBuffer, '\0', COMUNICATION_BUFFER_IN_SIZE);
  }
  return valid;
}

#define I2C_STR_SIZE 40
char i2cSendBuffer[I2C_STR_SIZE];
char i2cReceiveBuffer[I2C_STR_SIZE];

#define INPUT_STR_SIZE 40
char inputString[INPUT_STR_SIZE];
boolean stringReady = false;

void readSerial() {
  int i=0;
  while (Serial.available()) {
    //delay(3);
    char inChar = (char)Serial.read();
    if (inChar == '\r' || inChar == '\n' || i>INPUT_STR_SIZE-2) {
      break;
    }
    inputString[i++] = inChar;
    if(!Serial.available()) delay(2);
  }
  inputString[i+1] = '\0';
  stringReady = i > 0;
}

void loop() {
  readSerial();
  if(stringReady){
    if(inputString[0] == '#' && inputString[1] != '\0'){} //message starting with #, ignored
    else if(strstr(inputString, "s ")){
      int address = 0;
      sscanf(inputString, "s %i", &address);
      int i=-1, j=0;
      int spaceCount = 0;
      while(inputString[++i]!='\0' && i<COMUNICATION_BUFFER_OUT_SIZE ){
        if(spaceCount<2 && inputString[i]==' '){spaceCount++;continue;}
        else if(spaceCount==2){ comunication_OutBuffer[j++] = inputString[i];}
      }
      sendI2CMsg(address);
      int timeout = 20;
      while(timeout-- >= 0){
        delay(1);
        if(readI2CMsg(address, timeout<=0)) break;
      }
    }
    memset(inputString, '\0', INPUT_STR_SIZE);
    stringReady = false;
  }
}


