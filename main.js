const app = {};

app.reloadAI = async function(parameters={}){
    console.log(parameters)
    if(app.intelligence) await app.intelligence.close();
    delete require.cache[require.resolve('./intelligence')]; //Delete require() cache
    let Intelligence = require('./intelligence');
    app.intelligence = new Intelligence(app);
    app.parameters = parameters;
    await app.intelligence.init();
}

async function main(){
    //Create web interface + communication
    let Server = require('./server');
    app.server = new Server(app);
    app.server.init();

    //Create logger
    let Logger = require('./logger');
    app.logger = new Logger(app);
    let params = {};
    if(process.argv.length == 3 && process.argv[2]=="start") {
        params = { simulate: false, disableColisions: false, start: true };
    }

    //Create AI
    app.reloadAI(params);
}

main();

var cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill
