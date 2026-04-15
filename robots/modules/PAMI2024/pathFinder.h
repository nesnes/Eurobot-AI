#ifndef PATHFINDER_H
#define PATHFINDER_H

//#define PATHFINDER_ENABLE_SAMPLE
#define PATHFINDER_MAP_W 20
#define PATHFINDER_MAP_H 13
#define PATHFINDER_MAP_SIZE PATHFINDER_MAP_H*PATHFINDER_MAP_W
#define PATHFINDER_PATH_SIZE PATHFINDER_MAP_H*2 + PATHFINDER_MAP_W*2 // maximum size of a path reduced to save memory
#define PATHFINDER_MAP_REOLUTION 150 //use to represent the size of 1 map cell in the unit you want (can be meters, cm, mm, anything)

int16_t pathfinder_XYToIdx(int16_t x, int16_t y) {
  return y * PATHFINDER_MAP_W + x;
}

void pathfinder_IdxToXY(int16_t idx, int16_t &x, int16_t &y) {
  y = idx/PATHFINDER_MAP_W;
  x = idx%PATHFINDER_MAP_W;
}

bool pathfinder_find(uint8_t* graph, int16_t* foundPath, int16_t xFrom, int16_t yFrom, int16_t xTo, int16_t yTo){
  int16_t start = pathfinder_XYToIdx(xFrom, yFrom);
  int16_t end = pathfinder_XYToIdx(xTo, yTo);
  // To lower memory footprint, uses single working array, cost uses 7bit and most significative bit is used for UNEXPLORED flag
  uint8_t UNEXPLORED = 0b01111111;
  uint8_t EXPLORED =   0b10000000;
  static uint8_t costAndUnexplored[PATHFINDER_MAP_SIZE];
  auto getCost = [&](uint16_t i)->uint8_t { return costAndUnexplored[i]&UNEXPLORED; };
  auto setCost = [&](uint16_t i, uint8_t cost) { costAndUnexplored[i] = cost&UNEXPLORED; };
  auto isExplored = [&](uint16_t i)->uint8_t { return costAndUnexplored[i]&EXPLORED; };
  auto setExplored = [&](uint16_t i) { costAndUnexplored[i] |= EXPLORED; };
  // Reset
  memset(costAndUnexplored, 255&UNEXPLORED, PATHFINDER_MAP_SIZE);
  setCost(start, 0);
  
  //while the unexploredSet is not empty
  int16_t currentId = start;
  while(true) {
    int16_t smallestDist = 256;
    int16_t smallestId = start;
    bool empty = true;
    // Find smallest distance
    for(int i=0;i<PATHFINDER_MAP_SIZE;i++) {
      if(not isExplored(i)){
        empty=false;
        if(getCost(i)<smallestDist) {
          smallestDist = getCost(i);
          smallestId = i;
          if(smallestDist == getCost(currentId)) break; // cannot find smaller dist, optimize and break
        }
      }
    };
    if(empty){return false;}; // Every node explored, path not found
    currentId = smallestId;        // Get the current node (smallest distance)
    int16_t currY = currentId/PATHFINDER_MAP_W;
    int16_t currX  = currentId%PATHFINDER_MAP_W;
    setExplored(currentId); //remove the currentNode from the unexploredSet
    if(currentId==end){ break; }   // Path found!
    //Serial.println();
    //Serial.print(currentId);Serial.print("[");Serial.print(currX);Serial.print(",");Serial.print(currY);Serial.print("]");
    // Compute distance of all neighbors (still in the unexploredSet)
    for(int16_t y=-1;y<=1;y++) {
      for(int16_t x=-1;x<=1;x++) {
        bool isDiagonal = x!=0 and y!=0;
        //if(isDiagonal) continue; //No diagonals
        int16_t neighborX = currX + x;
        int16_t neighborY = currY + y;
        int16_t neighborId = pathfinder_XYToIdx(neighborX, neighborY);
        if(neighborX < 0 or neighborX >= PATHFINDER_MAP_W) continue;
        if(neighborY < 0 or neighborY >= PATHFINDER_MAP_H) continue;
        if(neighborId < 0 or neighborId >= PATHFINDER_MAP_SIZE) continue;
        if(isExplored(neighborId)) continue;
        if(neighborId == currentId) continue;
        float costFactor = isDiagonal?1.5f:1.f;
        int16_t cost = getCost(currentId) + (graph[neighborId]*costFactor);
        if(cost < getCost(neighborId)) {
            setCost(neighborId, min(255, cost));
        }
      }
    }
  }

  // Backtrace found path from end to start
  memset(foundPath, -1, PATHFINDER_PATH_SIZE);
  int16_t pathIdx=0;
  uint8_t smallestDist = 255;
  int16_t smallestId = end;
  while(true){
    //from current node, find cheapest neighbor
    currentId = smallestId;
    if(pathIdx >= PATHFINDER_PATH_SIZE) break; // Path too long, stopping here
    foundPath[pathIdx++]=currentId;  // add current node to path
    int16_t currY = currentId/ PATHFINDER_MAP_W;
    int16_t currX  = currentId%PATHFINDER_MAP_W;
    if(currentId==start) break;  // Backtrace finished
    for(int16_t y=1;y>=-1;y--) {
      for(int16_t x=1;x>=-1;x--) {
        bool isDiagonal = x!=0 and y!=0;
        //if(x!=0 and y!=0) continue; //No diagonals
        int16_t neighborX = currX + x;
        int16_t neighborY = currY + y;
        int16_t neighborId = pathfinder_XYToIdx(neighborX, neighborY);
        if(neighborX < 0 or neighborX > PATHFINDER_MAP_W-1) continue;
        if(neighborY < 0 or neighborY > PATHFINDER_MAP_H-1) continue;
        if(neighborId < 0 or neighborId > PATHFINDER_MAP_SIZE-1) continue;
        if(neighborId == currentId) continue;
        if(getCost(neighborId)<smallestDist) {
          smallestDist = getCost(neighborId);
          smallestId=neighborId;
        }
      }
    }
  }

  // Reverse path from start to end
  uint16_t pathSize = pathIdx-1;
  for(int i=0;i<pathIdx/2;i++){
    uint16_t tmp = foundPath[i];
    foundPath[i] = foundPath[pathSize-i];
    foundPath[pathSize-i] = tmp;
  }

  //Simplify path, group straight lines
  if(pathSize>1) {
    int16_t currX=0, currY=0;
    int16_t prevX=0, prevY=0;
    int16_t previous=0;
    int16_t matchCount = 0;
    for(int i=0;i<pathSize;i++){
      //get xy diff between i and i-1
      pathfinder_IdxToXY(foundPath[i-1], prevX, prevY);
      pathfinder_IdxToXY(foundPath[i], currX, currY);
      int16_t current = 1000*(currX-prevX) + (currY-prevY);
      if(i==0){previous = current; continue;}
      if(previous==current && i != pathSize-1){ matchCount++; }
      else if(matchCount>0) {
        for(int j=i-1-matchCount;j<pathSize;j++){
          foundPath[j] = foundPath[j+matchCount];
        }
        //memmove(&foundPath[i-matchCount],&foundPath[i-1], (pathSize-i)*sizeof(foundPath[0]));
        pathSize -= matchCount-1;
        //for(int j=0;j<matchCount;j++) { foundPath[pathSize-1+j] = -1; }
        i-=matchCount;
        matchCount=0;
      }
      previous = current;
    }
  }
  
  return true;
}

pathfinder_display(uint8_t* graph, int16_t* foundPath=0, char* legend="") {
  uint16_t legendSize = strlen(legend);
  // Display map and path
  Serial.println();
  for(int y=0;y<PATHFINDER_MAP_H;y++){
    for(int x=0;x<PATHFINDER_MAP_W;x++){
      int id = pathfinder_XYToIdx(x, y);
      // Check if this section of the map is in the found path
      bool isPath = false;
      for(int i=0;foundPath && i < PATHFINDER_PATH_SIZE && foundPath[i]!=-1;i++) {
        if(id == foundPath[i]) {
          isPath=true;
          break;
        }
      }
      // Display wether it's the map or the path
      uint8_t value = graph[id];
      if(isPath) Serial.print("#");
      else if(value < legendSize) Serial.print(legend[value]);
      else Serial.print(".");
      Serial.print(" ");
    }   
    Serial.println();
  }
}
#ifdef PATHFINDER_ENABLE_SAMPLE
pathfinder_sample() {
  // This is a sample function you can call to have a demo of the pathfinder

  // Create a map
  const uint8_t W = 255; // cost of a wall
  const uint8_t T = 4  ; // cost of a team zone
  const uint8_t O = 10; // cost of an opponent zone
  const uint8_t U = 2  ; // cost of uncertain zone
  const uint8_t _ = 1  ; // cost of empty space
  // 2026
  uint8_t graph[PATHFINDER_MAP_SIZE] = { // width and height needs to match PATHFINDER_MAP_W and PATHFINDER_MAP_H
    T,T,T,T,W,W,W,W,W,W,W,W,W,W,W,W,O,O,O,O,
    T,T,T,T,W,W,W,W,W,W,W,W,W,W,W,W,O,O,O,O,
    T,T,T,T,W,W,W,W,W,W,W,W,W,W,W,W,O,O,O,O,
    U,_,_,_,_,_,T,T,T,_,_,T,T,T,_,_,_,_,_,U,
    U,U,U,_,_,_,T,T,T,_,_,T,T,T,_,_,_,U,U,U,
    U,U,U,_,_,_,_,_,_,_,_,_,_,_,_,_,_,U,U,U,
    U,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,U,
    T,T,_,_,T,T,T,U,U,T,T,U,U,T,T,T,_,_,T,T,
    T,T,_,_,T,T,T,U,U,T,T,U,U,T,T,T,_,_,T,T,
    U,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,U,
    U,U,_,_,_,_,U,U,U,_,_,U,U,U,_,_,_,_,U,U,
    U,U,_,T,T,T,U,U,U,T,T,U,U,U,T,T,T,_,U,U,
    U,U,U,T,T,T,U,U,U,T,T,U,U,U,T,T,T,U,U,U
  };
  /*
  // 2024
  uint8_t graph[PATHFINDER_MAP_SIZE] = { // width and height needs to match PATHFINDER_MAP_W and PATHFINDER_MAP_H
    T,T,T,T,T,T,T,T,T,T,O,O,O,O,O,O,O,O,O,O,
    T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,O,O,O,
    T,T,T,_,_,_,_,_,_,U,U,_,_,_,_,_,_,O,O,O,
    T,_,_,_,_,_,_,_,_,U,U,_,_,_,_,_,_,_,_,O,
    T,_,_,_,_,_,U,U,_,_,_,_,U,U,_,_,_,_,_,O,
    O,O,O,_,_,_,U,U,_,_,_,_,U,U,_,_,_,T,T,T,
    O,O,O,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,
    O,O,O,_,_,_,U,U,_,_,_,_,U,U,_,_,_,T,T,T,
    O,_,_,_,_,_,U,U,_,_,_,_,U,U,_,_,_,_,_,T,
    O,_,_,_,_,_,_,_,_,U,U,_,_,_,_,_,_,_,_,T,
    T,T,T,_,_,_,_,_,_,U,U,_,_,_,_,_,_,O,O,O,
    T,T,T,_,_,_,U,U,_,_,_,_,U,U,_,_,_,O,O,O,
    T,T,T,U,U,U,U,U,U,U,U,U,U,U,U,U,U,O,O,O
  };*/

  // Find path
  int16_t foundPath[PATHFINDER_PATH_SIZE];
  uint32_t startTime = millis(); // Measure execution time
  bool found = pathfinder_find(graph, foundPath, /*FROM_XY*/ 9,0, /*TO_XY*/ 0,11);
  uint32_t endTime = millis(); // Measure execution time
  if(found) Serial.print("Path found in ");
  else Serial.print("Path NOT found in ");
  Serial.print(endTime-startTime);
  Serial.println("ms");

  // Display map and found path
  pathfinder_display(graph, foundPath, "-_U-T-----O----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------W");
}
#endif

// Helper functions not used by the pathfinder itself
uint8_t pathfinder_unitToX(int16_t value) {
    uint8_t x = value/PATHFINDER_MAP_REOLUTION;
    if(x>=PATHFINDER_MAP_W) x = PATHFINDER_MAP_W-1;
    if(x<0) x = 0;
    return x;
};
uint8_t pathfinder_unitToY(int16_t value) {
    uint8_t y = value/PATHFINDER_MAP_REOLUTION;
    if(y>=PATHFINDER_MAP_H) y = PATHFINDER_MAP_H-1;
    if(y<0) y = 0;
    return y;
};
int16_t pathfinder_xToUnit(uint8_t value, bool getCenterCoord=false) {
    int16_t x = int16_t(value) * PATHFINDER_MAP_REOLUTION;
    if(getCenterCoord) x += PATHFINDER_MAP_REOLUTION/2;
    return x;
};
int16_t pathfinder_yToUnit(uint8_t value, bool getCenterCoord=false) {
    int16_t y = int16_t(value) * PATHFINDER_MAP_REOLUTION;
    if(getCenterCoord) y += PATHFINDER_MAP_REOLUTION/2;
    return y;
};

#endif
