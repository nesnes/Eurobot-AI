

async function main(){
    //Read the map
    map = require("./maps/map_2020").map;
    //console.log(map)

    //Read the goals
    goals = require("./goals/goals_2020").goals;
    //console.log(goals)

    //Create robot
    const Robot = require('./robots/robot_2020');
    let robot = new Robot();

    //Resolve the goals
    for(const goal of goals){
        console.log("Running", goal.name)
        //Send to robot
        for(const action of goal.actions){
            let success = robot.run(action)
            console.log(success?"Done":"Failed")
        }
    }
}

main();
