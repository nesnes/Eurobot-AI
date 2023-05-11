//UI objects
var appParams = {
    simulate: true,
    disableColisions: false
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
var images = {
    list:[]
}
var files = {
    list: []
}
var lidarLocalisation = {
    x: 0,
    y: 0,
    angle: 0,
    features: []
}
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
communication.client.subscribe("/files");
communication.client.subscribe("/logs");
communication.client.subscribe("/map");
communication.client.subscribe("/map/grid");
communication.client.subscribe("/map/path");
communication.client.subscribe("/goals");
communication.client.subscribe("/intelligence");
communication.client.subscribe("/robot");
communication.client.subscribe("/robot/modules");
communication.client.subscribe("/lidar");
communication.client.subscribe("/images");
communication.client.subscribe("/lidar/localisation");

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
    else if(topic == "/images"){
        let obj = JSON.parse(""+payload)
        let img = images.list.find(i=>i.name==obj.name)
        if(img) img.data = obj.data
        else images.list.push(obj)
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
        var newLidar = JSON.parse(""+payload);
        //console.log(newLidar);
        Object.assign(lidar, newLidar);
    }
    else if(topic == "/files"){
        var msg = JSON.parse(""+payload)
        if(msg.type == "list"){
            for(let file of msg.files){
                file.id = file.name.replace(/\//g,"_").replace(/\\/g,"_").replace(/\./g,"_");
                let existing = files.list.find(f=>f.id == file.id)
                if(!existing) files.list.push(file);
            }
            //files.list = msg.files;
        }
        if(msg.type == "content" && msg.file && msg.content){
            let file = files.list.find((f)=>f.name == msg.file)
            if(file){
                file.content = msg.content;
                if(!file.editor) file.editor = ace.edit("file-tab-editor-"+file.id);
                file.editor.setTheme("ace/theme/cobalt");
                if(file.name.endsWith(".html")) file.editor.session.setMode("ace/mode/html");
                if(file.name.endsWith(".js")) file.editor.session.setMode("ace/mode/javascript");
                if(file.name.endsWith(".css")) file.editor.session.setMode("ace/mode/css");
                file.editor.setValue(""+file.content, -1)
            }
        }
    }
    else if(topic == "/lidar/localisation"){
        var newLidarLocalisation = JSON.parse(""+payload)
        console.log(newLidarLocalisation);
        Object.assign(lidarLocalisation, newLidarLocalisation);
    }
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
        images: images,
        files: files,
        lidarLocalisation: lidarLocalisation,
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
    },
    methods: {
        lidarStyle (measure) {
            function map_range(value, low1, high1, low2, high2) {
                return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
            };
            if(measure.c == undefined){
                return `stroke-width:2;opacity: 0.8;stroke:grey;`;
            } else {
                let value = map_range(measure.c, 230, 255,0,255);
                return `stroke-width:3;opacity: 0.8;stroke:rgb(${value},${255-value},127);`;
            }
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
    for(let p in parameters){
        if(parameters[p].type != 'text') params[p] = parseFloat(parameters[p].value);
        else                        params[p] = parameters[p].value;
    }
    console.log(funcName, JSON.stringify(params))
    var payload = {command: "runModuleFunction", moduleName: moduleName, funcName: funcName, params: params};
    communication.client.publish("/control", JSON.stringify(payload))
}
function onMapComponentClick(item){
    if('startPosition' in item){
        var payload = {command: "runModuleFunction", moduleName: "robot", funcName: "selectStartPosition", params: item.startPosition};
        communication.client.publish("/control", JSON.stringify(payload))
    }
}


function loadFiles(){
    var payload = {command: "listFiles"};
    communication.client.publish("/files", JSON.stringify(payload))
}

function editFile(file){
    console.log("editing", file)
    file.open = true;
    app.$forceUpdate();
    setTimeout(()=>{
        var payload = {command: "getFile", file:file.name};
        communication.client.publish("/files", JSON.stringify(payload));
    }, 100)
}
function saveFile(file){
    if(!file.name || !file.editor) return;
    var payload = {command: "saveFile", file:file.name, content:file.editor.getValue()};
    communication.client.publish("/files", JSON.stringify(payload));
    console.log("save", payload)
    //sendFileSaveRequest($("#mapFilePath").val(), getFileEditorContent($("#mapFilePath").val()))
    //sendFileSaveRequest($("#robotFilePath").val(), getFileEditorContent($("#robotFilePath").val()))
    //sendFileSaveRequest($("#objectiveFilePath").val(), getFileEditorContent($("#objectiveFilePath").val()))
}
function saveAllFiles(){
    for(let file of files.list){
        if(file.open) saveFile(file);
    }
}

$(document).keydown(function(e) {
    var key = undefined;
    var possible = [ e.key, e.keyIdentifier, e.keyCode, e.which ];
    while (key === undefined && possible.length > 0)
        key = possible.pop();
    if (key && (key == '115' || key == '83' ) && (e.ctrlKey || e.metaKey) && !(e.altKey)){
        e.preventDefault();
        saveAllFiles();
        return false;
    }
    return true;
});
window.onbeforeunload = function() {
    return "Leave the page? Make sure that files are saved.";
};