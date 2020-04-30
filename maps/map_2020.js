'use strict';

exports.map = {
    width: 3000,
    height: 2000,
    background: "",
    components:[


        //Borders
        {
            name: "Top Border",
            type: "boder",
            shape: {
                type: "rectangle",
                x:0,
                y:-22,
                width: 3000,
                height: 22,
                color: "grey"
            }
        },


        //Starting areas
        {
            name: "Starting Area",
            type: "startingArea",
            team: "blue",
            shape: {
                type: "rectangle",
                x:0,
                y:500,
                width: 400,
                height: 600,
                color: "blue"
            }
        }
    ]
}