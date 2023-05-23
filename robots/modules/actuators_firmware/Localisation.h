#ifndef LIDAR_LOCALISATION_H
#define LIDAR_LOCALISATION_H

#define LIDAR_LOCALISATION_MAX_MAP_SIZE 100
#define LIDAR_LOCALISATION_MAX_POS_CANDIDATES 1500
#define LIDAR_LOCALISATION_MAX_POINT_CLOUD_SIZE 600

struct LidarLocMeasure {
  float distance = 0;
  float angle = 0;
};

LidarLocMeasure actualCloud[LIDAR_LOCALISATION_MAX_POINT_CLOUD_SIZE];

struct LidarLocPosition{
  float x=0;
  float y=0;
  float angle=0;
};

struct LidarLocPoint{
  float x=0;
  float y=0;
};

struct LidarLocLine{
  LidarLocPoint p1;
  LidarLocPoint p2;
};

struct LidarLocPositionCandidate{
  LidarLocPosition position;
  float score=0;
};

class LidarLocalisation
{
public:
  void addLineToMap(LidarLocLine line){
    lineMap[mapSize] = line;
    mapSize++;
  };

  void clearCloud(){
    actualCloudIdx = 0;  
  }

  // Add a lidar point to the cloud, with distance-to-map filtering option
  void addCloudPoint(float distance, float angle, LidarLocPosition const& filterPosition, float filterDistance=0){
    // Apply filter on input points
    bool shouldAddPoint = false;
    if(filterDistance>0){
      // Compute projected position
      float measureX = filterPosition.x + distance * cos((angle + filterPosition.angle) * PI / 180.f);
      float measureY = filterPosition.y - distance * sin((angle + filterPosition.angle) * PI / 180.f);
      // Find min dist to map
      LidarLocPoint measureTransformed{measureX, measureY};
      for(uint16_t i=0; i<mapSize; i++){
        shouldAddPoint |= distancePointToLine(measureTransformed, lineMap[i]) < filterDistance;
      }
    }
    else shouldAddPoint = true;

    if(shouldAddPoint){
      actualCloud[actualCloudIdx].distance = distance;
      actualCloud[actualCloudIdx].angle = angle;
      actualCloudIdx++;
    }
  }

  LidarLocPosition generateRandomPosition(LidarLocPosition const& origin, float const xyRange, float const angleRange){
    LidarLocPosition position;
    position.x = origin.x + xyRange/2.f * (float)(random(-10000, 10000))/10000.f;
    position.y = origin.y + xyRange/2.f * (float)(random(-10000, 10000))/10000.f;
    position.angle = origin.angle + angleRange/2.f * (float)(random(-10000, 10000))/10000.f;
    return position;
  }

  float matchPosition(LidarLocPosition const& targetPosition, uint16_t skipping=1){
    float score = 0;
    float meanDist = 0;
    float matchCount = 0;
    for(uint16_t i=0; i<actualCloudIdx; i+=skipping){
      LidarLocMeasure* measure = &actualCloud[i];
      // Compute measure xy position , applying target position
      float measureX = targetPosition.x + measure->distance * cos((measure->angle + targetPosition.angle) * PI / 180.f);
      float measureY = targetPosition.y - measure->distance * sin((measure->angle + targetPosition.angle) * PI / 180.f);
      // Find min distance to a map line
      float minDist = 999999999;
      LidarLocPoint measureTransformed{measureX, measureY};
      for(uint16_t i=0; i<mapSize; i++){
        float dist = distancePointToLine(measureTransformed, lineMap[i]);
        if(dist < minDist){
          minDist = dist;
        }
      }
      if(minDist>maxMatchDist) continue;
      meanDist += minDist;
      matchCount++;
    }
    if(matchCount==0 || matchCount<minMatchCount) return 0;
    meanDist /= matchCount;
    score = matchCount - meanDist/2;
    return score;
  };

  float evaluateCandidate(LidarLocPosition const& targetPosition, uint16_t skipping=1){
    if(candidateIdx>=LIDAR_LOCALISATION_MAX_POS_CANDIDATES) return -1.f;
    candidates[candidateIdx].position.x = targetPosition.x;
    candidates[candidateIdx].position.y = targetPosition.y;
    candidates[candidateIdx].position.angle = targetPosition.angle;
    float score = matchPosition(targetPosition, skipping);
    candidates[candidateIdx].score = score;
    candidateIdx++;
    return score;    
  };

  LidarLocPositionCandidate getBestCandidate(bool (*validate)(LidarLocPositionCandidate const&)){
    float maxScore = 0;
    uint16_t bestIdx = 0;
    for(uint16_t i=0;i<candidateIdx;i++){
      if (candidates[i].score > maxScore
       &&(validate && validate(candidates[i]))
      ){
        maxScore = candidates[i].score;
        bestIdx = i;
      }
    }
    if(bestIdx<candidateIdx) return candidates[bestIdx];
    return LidarLocPositionCandidate();
  };

  uint16_t getCandidateCount(){ return candidateIdx; };

  void clearCandidates(){
    candidateIdx = 0;
  };

  void teleplot(Stream &serialport = Serial, LidarLocPosition targetPosition=LidarLocPosition(), uint16_t skipping=1){
    // Plot map
    Serial.print(F(">localisation.map,wloc:"));
    for(uint16_t i=0; i<mapSize; i++){
      for(int j=0;j<10;j++){
        float dx = (lineMap[i].p2.x - lineMap[i].p1.x)*( (float)(j)/10.f );
        float dy = (lineMap[i].p2.y - lineMap[i].p1.y)*( (float)(j)/10.f );
        Serial.print(String()+(lineMap[i].p1.x+dx)+":"+(lineMap[i].p1.y+dy)+";");
      }
    }
    Serial.println(F("|xy"));

    // Plot cloud
    Serial.print(F(">localisation.cloud,wloc:"));
    for(uint16_t i=0; i<actualCloudIdx; i+=skipping){
      LidarLocMeasure* measure = &actualCloud[i];
      // Compute measure xy position , applying target position
      float measureX = targetPosition.x + measure->distance * cos((measure->angle + targetPosition.angle) * PI / 180.f);
      float measureY = targetPosition.y - measure->distance * sin((measure->angle + targetPosition.angle) * PI / 180.f);
      Serial.print(String()+measureX+":"+measureY+";");
    }
    Serial.println(F("|xy"));

    // Plot candidates
    Serial.print(F(">localisation.candidates,wloc:"));
    for(uint16_t i=0;i<candidateIdx;i++){
      Serial.print(String()+candidates[i].position.x+":"+candidates[i].position.y+";");
    }
    Serial.println(F("|xy"));

    // Plot position
    Serial.println(String()+">localisation.position,wloc:"+targetPosition.x+":"+targetPosition.y+"|xy");
  };

private:
  LidarLocLine lineMap[LIDAR_LOCALISATION_MAX_MAP_SIZE];
  LidarLocMeasure actualCloud[LIDAR_LOCALISATION_MAX_POINT_CLOUD_SIZE];
  uint16_t actualCloudIdx = 0;
  uint16_t mapSize=0;
  float maxMatchDist = 100;
  float minMatchCount = 40;
  LidarLocPositionCandidate candidates[LIDAR_LOCALISATION_MAX_POS_CANDIDATES];
  uint16_t candidateIdx = 0;

  float distancePointToLine(LidarLocPoint& point, LidarLocLine& line){
    float A = point.x - line.p1.x;
    float B = point.y - line.p1.y;
    float C = line.p2.x - line.p1.x;
    float D = line.p2.y - line.p1.y;
  
    float dot = A * C + B * D;
    float len_sq = C * C + D * D;
    float param = -1;
    if (len_sq != 0) param = dot / len_sq; //in case of 0 length line
    
    float xx, yy;
    if (param < 0) {
      xx = line.p1.x;
      yy = line.p1.y;
    }
    else if (param > 1) {
      xx = line.p2.x;
      yy = line.p2.y;
    }
    else {
      xx = line.p1.x + param * C;
      yy = line.p1.y + param * D;
    }
  
    float dx = point.x - xx;
    float dy = point.y - yy;
    return sqrt(dx * dx + dy * dy);
  };

};

#endif
