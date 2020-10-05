//UI objects
var appParams = {
    simulate: true,
    disableColisions: true
}
var map = {
    width: 0,
    height: 0,
    background: "",
    components: []
};
var grid = {
    grid: null
}
var path = {
    path: null
}
var logs = [];
var communication = {
    client: null
}
var goals = {
    list: []
};
var robot = {
    x:0,
    y:0,
    angle:0,
    variables:{}
}
var lidar = {
    measures: null
}
/*var lidarLocalisation = {
    x: 0,
    y: 0,
    angle: 0
}*/
var intelligence = {
    currentTime: 0
}
var modules = {
    modules:{}
}
var initialized = false;

var joystick = null;

//MQTT.js
communication.client = mqtt.connect("ws://"+location.hostname+":"+8081)
communication.client.subscribe("/logs");
communication.client.subscribe("/map");
communication.client.subscribe("/map/grid");
communication.client.subscribe("/map/path");
communication.client.subscribe("/goals");
communication.client.subscribe("/intelligence");
communication.client.subscribe("/robot");
communication.client.subscribe("/robot/modules");
communication.client.subscribe("/lidar");
//communication.client.subscribe("/lidar/localisation");

communication.client.on("connect", function (){
    if(!initialized){
        initialized = true;
        var payload = {command: "reloadAI", parameters: appParams};
        communication.client.publish("/control", JSON.stringify(payload))
    }
});

communication.client.on("message", function (topic, payload) {
    if(topic == "/map"){
        var newMap = JSON.parse(""+payload)
        Object.assign(map, newMap);
    }
    else if(topic == "/map/grid"){
        var newGrid = JSON.parse(""+payload)
        Object.assign(grid, newGrid);
    }
    else if(topic == "/map/path"){
        var newPath = JSON.parse(""+payload)
        Object.assign(path, newPath);    
    }
    else if(topic == "/goals"){
        var newGoals = JSON.parse(""+payload)
        goals.list = newGoals.list;
    }
    else if(topic == "/logs"){
        logs.push(""+payload);
    }
    else if(topic == "/intelligence"){
        var newIntelligence = JSON.parse(""+payload)
        Object.assign(intelligence, newIntelligence);
    }
    else if(topic == "/robot"){
        var newRobot = JSON.parse(""+payload)
        Object.assign(robot, newRobot);
    }
    else if(topic == "/robot/modules"){
        var newModule = JSON.parse(""+payload).modules
        console.log("modules", newModule)
        modules.modules = newModule;
    }
    else if(topic == "/lidar"){
        var newLidar = JSON.parse(""+payload)
        Object.assign(lidar, newLidar);
    }
    /*else if(topic == "/lidar/localisation"){
        var newLidarLocalisation = JSON.parse(""+payload)
        Object.assign(lidarLocalisation, newLidarLocalisation);
    }*/
})

//Vue.js
var app = new Vue({
    el: '#app',
    data: {
        logs: logs,
        map: map,
        grid: grid,
        path: path,
        goals: goals,
        intelligence: intelligence,
        robot: robot,
        lidar: lidar,
        //lidarLocalisation: lidarLocalisation,
        modules: modules,
        communication: communication,
        appParams: appParams
    },
    updated: function(){
        //scroll down log console
        $("#logConsole").scrollTop($("#logConsole")[0].scrollHeight);
        if(!joystick){
            joystick = new JoyStick('joyDiv');
            setInterval(updateJoystick, 300);
        }
    }
})

//Joystick
let joystickMoving = false;
function updateJoystick(){
    let x = joystick.GetX();
    let y = joystick.GetY();
    if(x==0 && y==0){
        if(joystickMoving) {
            let payload = {command: "runModuleFunction", moduleName: "base", funcName: "disableManual", params: {}};
            communication.client.publish("/control", JSON.stringify(payload));
            joystickMoving = false;
            console.log("sent break", payload);
        }
    }
    else{
        if(!joystickMoving){
            let payload = {command: "runModuleFunction", moduleName: "base", funcName: "enableManual", params: {}};
            communication.client.publish("/control", JSON.stringify(payload));
        } else {
            let payload = {command: "runModuleFunction", moduleName: "base", funcName: "moveManual", params: {
                "moveAngle": Math.atan2(y, x)*(180/Math.PI)-90,
                "moveSpeed": Math.sqrt(x*x+y*y)/200,
                "angleSpeed":0
            }};
            communication.client.publish("/control", JSON.stringify(payload))
            console.log("sent manual", payload.params);
        }
        joystickMoving = true;
    }
}

//Buttons
function reloadAI(){
    grid.grid = null;
    path.path = null;
    path.smoothPath = null;
    lidar.measures = null;
    logs.length = 0;
    var payload = {command: "reloadAI", parameters: appParams};
    communication.client.publish("/control", JSON.stringify(payload))
}
function stopMatch(){
    var payload = {command: "stopMatch"};
    communication.client.publish("/control", JSON.stringify(payload))
}
function runMatch(){
    var payload = {command: "runMatch"};
    communication.client.publish("/control", JSON.stringify(payload))
}
function runGoal(goal){
    var payload = {command: "runGoal", goal: goal};
    communication.client.publish("/control", JSON.stringify(payload))
}
function runAction(action){
    var payload = {command: "runAction", action: action};
    communication.client.publish("/control", JSON.stringify(payload))
}
function runModuleFunction(moduleName, funcName, parameters={}){
    var params = {};
    for(let p in parameters) params[p] = parameters[p].value;
    console.log(funcName, JSON.stringify(params))
    var payload = {command: "runModuleFunction", moduleName: moduleName, funcName: funcName, params: params};
    communication.client.publish("/control", JSON.stringify(payload))
}