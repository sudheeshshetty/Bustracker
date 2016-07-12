var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');

// Provide Basic Middlewares for API's
app.use(bodyParser.json());
app.use(cors());

// Connect to database
mongoose.connect(process.env.npm_package_config_db_url);

// Start the simulation and get the buses object
var buses = require('./lib/simulate').buses;

// Add the API's.
require("./controller")(app, express, buses);

// Start the server.
var server = app.listen(process.env.npm_package_config_server_port, function(){
  console.log("Server is listening at port : " + process.env.npm_package_config_server_port);
});
