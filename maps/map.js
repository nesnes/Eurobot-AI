'use strict';
var PF = require('pathfinding');
const Astar = require('./astar.js');

module.exports = class Map {
        constructor(app) {
        this.app = app;
        
        this.width = 0
        this.height = 0
        this.background = ""
        this.components = []
        this.teams = []

        this.pathResolution = 40;//mm
    }

    init(){
        this.send();
    }

    send(){
        let payload = {
            width: this.width,
            height: this.height,
            background: this.background,
            components: this.components,
        }
        this.app.mqttServer.publish({
            topic: '/map',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    getComponent(type, team){
        let component = null;
        for(const item of this.app.map.components){
            if(item.type == type && item.team == team){
                component = item;
                break;
            }
        }
        return component;
    }

    getComponentList(type, team){
        let componentList = [];
        for(const item of this.app.map.components){
            if(item.type == type && item.team == team){
                componentList.push(item);
            }
        }
        return componentList;
    }
    
    getComponentByName(name, type="", team=""){
        let component = null;
        for(const item of this.app.map.components){
            if(item.name == name
            && (!type || item.type == type)
            && (!team || item.team == team)
            ){
                component = item;
                break;
            }
        }
        return component;
    }

    addComponent(cmp){
        cmp.insertTime = new Date().getTime();
        this.app.map.components.push(cmp);
        this.send();
    }

    removeComponent(cmp){
        if(!cmp) return;
        let index = this.components.findIndex(component => component == cmp);
        if(index>=0) this.components.splice(index, 1);
        this.send();
    }

    _updateMap(){
        let now = new Date().getTime();
        let changed = false;
        for(let i=0;i<this.app.map.components.length;i++){
            const cmp = this.app.map.components[i];
            if("insertTime" in cmp && "timeout" in cmp && now-cmp.insertTime > cmp.timeout){
                this.app.map.components.splice(i,1);
                i--;
                changed=true;
            }
        }
        if(changed) this.send();
    }

    sendGrid(graph){
        var gridArray = []
        for(let col of graph.grid){
            for(let node of col){
                gridArray.push([node.x, node.y, node.weight]);
            }
        }
        let payload = {
            grid: gridArray,
            resolution: this.pathResolution
        }
        this.app.mqttServer.publish({
            topic: '/map/grid',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    sendPath(path,smoothPath){
        let payload = {
            path: path,
            smoothPath: smoothPath,
            resolution: this.pathResolution
        }
        this.app.mqttServer.publish({
            topic: '/map/path',
            payload: JSON.stringify(payload),
            qos: 0, retain: false
        });
    }

    isContainedIn(x, y, component, useRobotRadius=true){
        let robotRadius = useRobotRadius?this.app.robot.radius:0;
        let avoidOffset = component.avoidOffset || 0;
        if(component.shape.type == "rectangle"){
            let fromX = component.shape.x-robotRadius + avoidOffset;
            let toX = component.shape.x+component.shape.width+robotRadius+Math.abs(avoidOffset)*2;
            let fromY = component.shape.y-robotRadius - avoidOffset;
            let toY = component.shape.y+component.shape.height+robotRadius+Math.abs(avoidOffset)*2;
            //Rectangle corners as circle
            let centerX = component.shape.x+component.shape.width/2;
            let centerY = component.shape.y+component.shape.height/2;
            let dhx = component.shape.x-(component.shape.x+component.shape.width);
            let dhy = component.shape.y-(component.shape.y+component.shape.height);
            let hypotenuse = Math.sqrt(dhx*dhx + dhy*dhy);
            let radius = hypotenuse/2+robotRadius+avoidOffset;
            let dx = centerX-x;
            let dy = centerY-y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if(fromX<=x&&x<=toX && fromY<=y&&y<=toY && distance<radius) return true;
        }
        else if(component.shape.type == "circle"){
            let dx = component.shape.x-x;
            let dy = component.shape.y-y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if(distance<component.shape.radius+robotRadius+avoidOffset) return true;
        }
        return false;
    }

    createGrid(xFrom, yFrom, xTo, yTo){
        this._updateMap();
        //let grid = new PF.Grid(Math.ceil(this.width/this.pathResolution), Math.ceil(this.height/this.pathResolution));
        let gridWidth = Math.ceil(this.width/this.pathResolution);
        let gridHeight = Math.ceil(this.height/this.pathResolution);
        let grid = [];
        for(let i=0;i<gridWidth;i++){
            grid.push([]);
            for(let j=0;j<gridHeight;j++){
                grid[i].push(1);
            }
        }
        let graph = new Astar.Graph(grid, {diagonal: true});
        for(const item of this.app.map.components){
            let offsetWeight = 0;
            if(this.isContainedIn(xFrom, yFrom, item) || this.isContainedIn(xTo, yTo, item)){
                //if(item.isSolid) return false;
                offsetWeight = 2;
                //continue;
            }
            let avoidOffset = item.avoidOffset || 0;
            if(item.shape.type == "rectangle"){
                //Compute rectangle extended by the robot radius
                let fromX = (item.shape.x-this.app.robot.radius - avoidOffset);
                let fromY = (item.shape.y-this.app.robot.radius - avoidOffset);
                let width = (item.shape.width+this.app.robot.radius*2 + avoidOffset*2);
                let height = (item.shape.height+this.app.robot.radius*2 + avoidOffset*2);
                let mapWidth = this.width;
                let mapHeight = this.height;
                
                let toX = Math.max(0,Math.min(mapWidth,fromX+width))
                let toY = Math.max(0,Math.min(mapHeight,fromY+height))
                fromX = Math.max(0,Math.min(mapWidth,fromX))
                fromY = Math.max(0,Math.min(mapHeight,fromY))

                //Apply path resolution
                fromX = Math.floor(fromX/this.pathResolution);
                fromY = Math.floor(fromY/this.pathResolution);
                toX = Math.ceil(toX/this.pathResolution)-1;
                toY = Math.ceil(toY/this.pathResolution)-1;
                
                //Update grid
                //console.log(xFrom, yFrom, xTo, yTo,gridWidth, gridHeight )
                for(let y=fromY; y<=toY;y++){
                    for(let x=fromX; x<=toX;x++){
                        if( y<0 || y>=gridHeight ||  x<0 || x>=gridWidth) continue;
                        if(!this.isContainedIn(x*this.pathResolution+this.pathResolution/2,y*this.pathResolution+this.pathResolution/2, item)) continue;
                        //console.log(x, y, fromX, width )
                        //grid.setWalkableAt(x, y, false);
                        graph.grid[x][y].weight = 0 + offsetWeight;
                        graph.grid[x][y].component = item.name;
                        //grid.nodes[y][x].walkable = false;
                        //grid.nodes[y][x].component = item.name;
                    }
                }
            }
            if(item.shape.type == "circle"){
                //Compute rectangle ectended by the robot radius
                let fromX = (item.shape.x-item.shape.radius-this.app.robot.radius - avoidOffset);
                let fromY = (item.shape.y-item.shape.radius-this.app.robot.radius - avoidOffset);
                let width = (item.shape.radius*2+this.app.robot.radius*2 + avoidOffset*2);
                let height = (item.shape.radius*2+this.app.robot.radius*2 + avoidOffset*2);
                let mapWidth = this.width;
                let mapHeight = this.height;
                fromX = Math.max(0,Math.min(mapWidth,fromX))
                fromY = Math.max(0,Math.min(mapHeight,fromY))
                if(fromX+width>mapWidth) width = mapWidth-fromX;
                if(fromY+height>mapHeight) height = mapHeight-fromY;
                //Apply path resolution
                fromX = Math.floor(fromX/this.pathResolution);
                fromY = Math.floor(fromY/this.pathResolution);
                width = Math.ceil(width/this.pathResolution)-1;
                height = Math.ceil(height/this.pathResolution)-1;
                //Update grid
                for(let y=fromY; y<=fromY+height;y++){
                    for(let x=fromX; x<=fromX+width;x++){
                        if( y<0 || y>=gridHeight ||  x<0 || x>=gridWidth) continue;
                        if(!this.isContainedIn(x*this.pathResolution+this.pathResolution/2,y*this.pathResolution+this.pathResolution/2, item)) continue;
                        //console.log(x, y, fromX, width )
                        //grid.setWalkableAt(x, y, false);
                        //grid.nodes[y][x].walkable = false;
                        //grid.nodes[y][x].component = item.name;
                        graph.grid[x][y].weight = 0 + offsetWeight;
                        graph.grid[x][y].component = item.name;
                    }
                }
            }
        }
        //Apply blur on map weights
        for(let i=0;i<gridWidth;i++){
            for(let j=0;j<gridHeight;j++){
                let node = graph.grid[i][j];
                if(node.weight == 0) continue;
                let neighbors  = graph.neighbors(node);
                for(let n of neighbors){
                    let malus = n.weight * 0.05;
                    if(n.weight == 0) malus = 0.5;
                    node.weight += malus;
                    //targetWeights.push({x:i, y:j, weight:node.weight+malus});
                }
            }
        }

        //Free start and end cells      
        //console.log(graph.grid[30][30])  
        graph.grid[Math.floor(xFrom/this.pathResolution)][Math.floor(yFrom/this.pathResolution)].weight = 1;
        graph.grid[Math.floor(xTo/this.pathResolution)][Math.floor(yTo/this.pathResolution)].weight = 1;
        return graph;
    }

    findPath(xFrom, yFrom, xTo, yTo){
        //console.log("find path from", xFrom, yFrom, "to", xTo, yTo)
        let startTime = new Date().getTime();
        let graph = this.createGrid(xFrom, yFrom, xTo, yTo);
        if(!graph) return []
        this.sendGrid(graph);
        /*let pathFinder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: false
        });
        
        let path = pathFinder.findPath(
            Math.floor(xFrom/this.pathResolution),
            Math.floor(yFrom/this.pathResolution),
            Math.floor(xTo/this.pathResolution),
            Math.floor(yTo/this.pathResolution),
            grid
        );*/
        //console.log(Math.floor(xFrom/this.pathResolution), Math.floor(yFrom/this.pathResolution))
        let start = graph.grid[Math.floor(xFrom/this.pathResolution)][Math.floor(yFrom/this.pathResolution)]
        let end = graph.grid[Math.floor(xTo/this.pathResolution)][Math.floor(yTo/this.pathResolution)]
        let path = Astar.astar.search(graph, start, end, {heuristic: Astar.astar.heuristics.diagonal});
        
        //console.log("pathfinding time ms:", new Date().getTime()-startTime);
        //console.log(path)
        if(path.length==0) return [];
        var outPath = []
        var rawPath = []
        for(let i=0;i<path.length;i+=4){
            /*outPath.push({
                x: path[i].x * this.pathResolution,
                y: path[i].y * this.pathResolution,
                weight: path[i].weight
            })*/

            rawPath.push([  path[i].x, path[i].y  ]);
            outPath.push([ path[i].x * this.pathResolution, path[i].y * this.pathResolution ]);
        }
        if(outPath.length == 1){
            outPath.push([xTo, yTo]);
        }
        
        if(outPath.length>1){
            outPath[0][0] = xFrom;
            outPath[0][1] = yFrom;
            outPath[outPath.length-1][0] = xTo;
            outPath[outPath.length-1][1] = yTo;
        }

        //console.log(outPath)
        this.sendPath(rawPath, outPath);
        return outPath;


        var smoothPath = PF.Util.smoothenPath(grid, path);
        this.sendPath(path, smoothPath);
        for(let node of smoothPath){
            node[0] *= this.pathResolution;
            node[1] *= this.pathResolution;
        }
        if(smoothPath.length>1){
            smoothPath[0][0] = xFrom;
            smoothPath[0][1] = yFrom;
            smoothPath[smoothPath.length-1][0] = xTo;
            smoothPath[smoothPath.length-1][1] = yTo;
        }

        //this.app.logger.log(JSON.stringify(path));
        //let newPath = PF.Util.smoothenPath(grid, path);
        //this.app.logger.log(JSON.stringify(newPath));
        return smoothPath;
    }
    
    getPathLength(path){
        let pathLength = 0;
        for(let i=1;i<path.length;i++){
            let dx = path[i-1][0]-path[i][0];
            let dy = path[i-1][1]-path[i][1];
            pathLength += Math.sqrt(dx*dx + dy*dy);
        }
        return pathLength;
    }

}