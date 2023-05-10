#ifndef LD06_H
#define LD06_H

#include <Arduino.h>
#define LD06_POINT_MAX_SIZE         300     // freq mes = 4500 Hz, freq lidar : 10 Hz 

static const uint8_t LD06_CRC_TABLE[256] =
{
0x00, 0x4d, 0x9a, 0xd7, 0x79, 0x34, 0xe3,
0xae, 0xf2, 0xbf, 0x68, 0x25, 0x8b, 0xc6, 0x11, 0x5c, 0xa9, 0xe4, 0x33,
0x7e, 0xd0, 0x9d, 0x4a, 0x07, 0x5b, 0x16, 0xc1, 0x8c, 0x22, 0x6f, 0xb8,
0xf5, 0x1f, 0x52, 0x85, 0xc8, 0x66, 0x2b, 0xfc, 0xb1, 0xed, 0xa0, 0x77,
0x3a, 0x94, 0xd9, 0x0e, 0x43, 0xb6, 0xfb, 0x2c, 0x61, 0xcf, 0x82, 0x55,
0x18, 0x44, 0x09, 0xde, 0x93, 0x3d, 0x70, 0xa7, 0xea, 0x3e, 0x73, 0xa4,
0xe9, 0x47, 0x0a, 0xdd, 0x90, 0xcc, 0x81, 0x56, 0x1b, 0xb5, 0xf8, 0x2f,
0x62, 0x97, 0xda, 0x0d, 0x40, 0xee, 0xa3, 0x74, 0x39, 0x65, 0x28, 0xff,
0xb2, 0x1c, 0x51, 0x86, 0xcb, 0x21, 0x6c, 0xbb, 0xf6, 0x58, 0x15, 0xc2,
0x8f, 0xd3, 0x9e, 0x49, 0x04, 0xaa, 0xe7, 0x30, 0x7d, 0x88, 0xc5, 0x12,
0x5f, 0xf1, 0xbc, 0x6b, 0x26, 0x7a, 0x37, 0xe0, 0xad, 0x03, 0x4e, 0x99,
0xd4, 0x7c, 0x31, 0xe6, 0xab, 0x05, 0x48, 0x9f, 0xd2, 0x8e, 0xc3, 0x14,
0x59, 0xf7, 0xba, 0x6d, 0x20, 0xd5, 0x98, 0x4f, 0x02, 0xac, 0xe1, 0x36,
0x7b, 0x27, 0x6a, 0xbd, 0xf0, 0x5e, 0x13, 0xc4, 0x89, 0x63, 0x2e, 0xf9,
0xb4, 0x1a, 0x57, 0x80, 0xcd, 0x91, 0xdc, 0x0b, 0x46, 0xe8, 0xa5, 0x72,
0x3f, 0xca, 0x87, 0x50, 0x1d, 0xb3, 0xfe, 0x29, 0x64, 0x38, 0x75, 0xa2,
0xef, 0x41, 0x0c, 0xdb, 0x96, 0x42, 0x0f, 0xd8, 0x95, 0x3b, 0x76, 0xa1,
0xec, 0xb0, 0xfd, 0x2a, 0x67, 0xc9, 0x84, 0x53, 0x1e, 0xeb, 0xa6, 0x71,
0x3c, 0x92, 0xdf, 0x08, 0x45, 0x19, 0x54, 0x83, 0xce, 0x60, 0x2d, 0xfa,
0xb7, 0x5d, 0x10, 0xc7, 0x8a, 0x24, 0x69, 0xbe, 0xf3, 0xaf, 0xe2, 0x35,
0x78, 0xd6, 0x9b, 0x4c, 0x01, 0xf4, 0xb9, 0x6e, 0x23, 0x8d, 0xc0, 0x17,
0x5a, 0x06, 0x4b, 0x9c, 0xd1, 0x7f, 0x32, 0xe5, 0xa8
};

struct LD06Point {
  uint16_t distance = 0;  // mm
  float angle = 0;        // degrees
  uint8_t intensity = 0;  // 0-255
};

struct LD06Measure  {
  uint16_t distance;  // Unit is mm
  uint8_t intensity;  // Unsigned value 0-255}
} __attribute__((packed));

struct LD06Packet {
  uint8_t header;            // LD06_HEADER
  uint8_t version_size;      // LD06_VER_SIZE
  uint16_t lidarSpeed;       // Degrees ° / second
  uint16_t startAngle;       // Unit is 0.01 Degree°
  LD06Measure measures[12];  // 12 distances data distance + intensity
  uint16_t endAngle;         // Unit is 0.01 Degree°
  uint16_t timeStamp;        // Unit id ms (max value is 30000)
  uint8_t crc;               // Checksum
} __attribute__((packed));

class LD06
{
public:
  LD06(HardwareSerial* _serial=nullptr){
    serial = _serial;
    actualScan = scanA;
    previousScan = scanB;
  };

  void init(){
    if(!serial) return;
    serial->begin(230400);
  };

  bool run(){
    if(!serial) return false;
    bool hasSwaped = false;
    while(serial->available() > 0) { hasSwaped |= readSerial(); }
    return hasSwaped;
  };
        
  LD06Point* getPoints(){return previousScan;};
  uint16_t getPointCount(){return previousScanIdx;};
  LD06Point* getPoint(uint16_t i){
    if(i<getPointCount()){
      return &previousScan[i];
    }
    return nullptr;
  };
  
  void setMinConfidence(uint8_t value) { minConfidence = value; };
  void setMaxConfidence(uint8_t value) { maxConfidence = value; };
  void setMinDistance(uint16_t value) { minDistance = value; };
  void setMaxDistance(uint16_t value) { maxDistance = value; };
  void setUpsideDown(bool value) { isUpsideDown = value; };

  void teleplot(Stream &serialport = Serial) {
    serialport.print(F(">lidar.cloud:"));
    for(int i=0;i<getPointCount();i++){
      //float x = getPoint(i)->angle;
      //float y = getPoint(i)->distance;
      float x = getPoint(i)->distance * cos(getPoint(i)->angle * PI / 180.f);
      float y = -getPoint(i)->distance * sin(getPoint(i)->angle * PI / 180.f);
      serialport.print(String()+x+":"+y+";");
    }
    serialport.println(F("|xy"));
  };

private:
  LD06Point scanA[LD06_POINT_MAX_SIZE];
  LD06Point scanB[LD06_POINT_MAX_SIZE];
  LD06Point* actualScan;
  LD06Point* previousScan;
  uint16_t actualScanIdx=0;
  uint16_t previousScanIdx=0;
  HardwareSerial* serial;

  uint8_t minConfidence=0;
  uint8_t maxConfidence=0;
  uint16_t minDistance=0;
  uint16_t maxDistance=0;
  bool isUpsideDown=false;
  
  LD06Packet packet;
  uint16_t packetIdx=0;
  bool readSerial(){
    if(!serial) return false;
    uint8_t d = serial->read();
    uint8_t* raw = (uint8_t*)&packet;

    // Check for packet start
    if(packetIdx==0 && d==0x54){
      raw[packetIdx]=d;
      packetIdx++;
      return false;
    }

    // Validate packet start
    if(packetIdx==1){
      if(d==0x2C){
        raw[packetIdx]=d;
        packetIdx++;
      }
      else{
        packetIdx=0;
      }
      return false;
    }
    
    // Store packet
    if(packetIdx>1 && packetIdx<sizeof(LD06Packet)){
      raw[packetIdx++]=d;
    }
    // Validate and parse packet
    if(packetIdx == sizeof(LD06Packet)){
      packetIdx = 0;
      uint8_t crc = 0;
      for (uint16_t i=0; i<sizeof(LD06Packet)-1; i++){
        crc = LD06_CRC_TABLE[(crc ^ raw[i]) & 0xFF];
      }
      if(packet.crc == crc){
        return parsePacket();
      }
    }
    return false;
  };

  bool parsePacket(){
    // Compute angle step
    float startAngle = (float)(packet.startAngle)/100.f;
    float endAngle = (float)(packet.endAngle)/100.f;
    float angleStep = 0;
    if(endAngle < startAngle) { angleStep = (endAngle+(360.f-startAngle))/12.f;  }
    else { angleStep = (endAngle-startAngle)/12.f; }

    // Add new points from packet
    bool hasSwaped = false;
    for(uint16_t i=0; i<12; i++)
    {
      // Compute angle
      float angle = startAngle+(float)(i)*angleStep;
      if(angle > 360.f) angle -= 360.f;

      // Filter 
      if(packet.measures[i].intensity < minConfidence) continue;
      if(maxConfidence>0 && packet.measures[i].intensity > maxConfidence) continue;
      if(packet.measures[i].distance < minDistance) continue;
      if(maxDistance>0 && packet.measures[i].distance > maxDistance) continue;

      // Fill scan
      actualScan[actualScanIdx].distance = packet.measures[i].distance;
      actualScan[actualScanIdx].intensity = packet.measures[i].intensity;
      actualScan[actualScanIdx].angle = isUpsideDown ? 360.f-angle : angle;
      actualScanIdx++;
      // Swap scans if reached scan limit
      if(actualScanIdx>=LD06_POINT_MAX_SIZE){
        swapScans();
        hasSwaped = true;
      }
    }
    return hasSwaped;
  };

  void swapScans(){
    LD06Point* tmpScan = actualScan;
    actualScan = previousScan;
    previousScan = tmpScan;
    previousScanIdx = actualScanIdx;
    actualScanIdx = 0;
  };
};

#endif
