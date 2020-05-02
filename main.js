const app = {};

async function main(){
    //Create web interface + communication
    let Server = require('./server');
    app.server = new Server(app);
    app.server.init();

    //Create logger
    let Logger = require('./logger');
    app.logger = new Logger(app);

    //Create AI
    let Intelligence = require('./intelligence');
    app.intelligence = new Intelligence(app);
}

main();
