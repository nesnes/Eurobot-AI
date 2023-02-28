//UI objects
var appParams = {
    simulate: false,
    disableColisions: false
}
var map = {
    width: 0,
    height: 0,
    background: "",
    components: []
};
var path = {
    path: null
}
var logs = [];
var communication = {
    client: null
}
var robot = {
    x:0,
    y:0,
    angle:0,
    variables:{}
}
var intelligence = {
    currentTime: 0
}
var modules = {
    modules:{}
}
var initialized = false;

//MQTT.js
communication.client = mqtt.connect("ws://"+location.hostname+":"+8081)
communication.client.subscribe("/logs");
communication.client.subscribe("/map");
communication.client.subscribe("/map/path");
communication.client.subscribe("/intelligence");
communication.client.subscribe("/robot");
communication.client.subscribe("/robot/modules");

communication.client.on("connect", function (){
    if(!initialized){
        initialized = true;
        var payload = {command: "reloadAI", parameters: appParams};
        communication.client.publish("/control", JSON.stringify(payload))
    }
});

communication.client.on("message", function (topic, payload) {
    if(topic == "/logs"){
        logs.push(""+payload);
    }
    else if(topic == "/map"){
        var newMap = JSON.parse(""+payload)
        Object.assign(map, newMap);
    }
    else if(topic == "/map/path"){
        var newPath = JSON.parse(""+payload)
        Object.assign(path, newPath);    
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
})

//Vue.js
var app = new Vue({
    el: '#app',
    data: {
        logs: logs,
        map: map,
        path: path,
        intelligence: intelligence,
        robot: robot,
        modules: modules,
        communication: communication,
        appParams: appParams
    },
    updated: function(){
        //scroll down log console
        $("#logConsole").scrollTop($("#logConsole")[0].scrollHeight);
    },
    methods: {
    }
})

//Buttons
function reloadAI(){
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
function runModuleFunction(moduleName, funcName, parameters={}){
    var params = {};
    for(let p in parameters) params[p] = parameters[p].value;
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