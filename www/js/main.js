//UI objects
var map = {
    width: 0,
    height: 0,
    background: "",
    components: []
};
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
var initialized = false;

//MQTT.js
communication.client = mqtt.connect("ws://"+location.hostname+":"+8081)
communication.client.subscribe("/logs");
communication.client.subscribe("/map");
communication.client.subscribe("/goals");
communication.client.subscribe("/robot");

communication.client.on("connect", function (){
    if(!initialized){
        initialized = true;
        var payload = {command: "init"};
        communication.client.publish("/control", JSON.stringify(payload))
    }
});

communication.client.on("message", function (topic, payload) {
    if(topic == "/map"){
        var newMap = JSON.parse(""+payload)
        Object.assign(map, newMap);
    }
    else if(topic == "/goals"){
        var newGoals = JSON.parse(""+payload)
        goals.list = newGoals.list;        
        console.log(goals)
    }
    else if(topic == "/logs"){
        logs.push(""+payload);
    }
    else if(topic == "/robot"){
        var newRobot = JSON.parse(""+payload)
        Object.assign(robot, newRobot);
    }
})

//Vue.js
var app = new Vue({
    el: '#app',
    data: {
        logs: logs,
        map: map,
        goals: goals,
        robot: robot,
        communication: communication
    },
    updated: function(){
        //scroll down log console
        $("#logConsole").scrollTop($("#logConsole")[0].scrollHeight);
        console.log("scrolling")
    }
})

//Buttons
function runInit(){
    var payload = {command: "init"};
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