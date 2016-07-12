var models = require('../model');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var Bus = require('../lib/bus').Bus;
var utils = require('./utils');

var busesRunning = [];

function loadDataAndStartSimulation(simulate) {
  // Load Static Data
  var rData = {
    ALVW: parse(fs.readFileSync(process.env.PWD+'/static/AL-VW'), {columns:true}),
    TN1TN2: parse(fs.readFileSync(process.env.PWD+'/static/TN1-TN2'), {columns:true}),
    TN1YW: parse(fs.readFileSync(process.env.PWD+'/static/TN1-YW'), {columns:true}),
    VWTN2: parse(fs.readFileSync(process.env.PWD+'/static/VW-TN2'), {columns:true}),
    VWYW1: parse(fs.readFileSync(process.env.PWD+'/static/VW-YW1'), {columns:true}),
    YW1YW: parse(fs.readFileSync(process.env.PWD+'/static/YW1-YW'), {columns:true}),
    YWST: parse(fs.readFileSync(process.env.PWD+'/static/YW-ST'), {columns:true})
  }

  // Calculate cummulative distances and time between busstops
  for(var a in rData) {
   for(var b in rData[a]) {
    rData[a][b].traffic = rData[a][b].traffic.split(':');
    for(var c in rData[a][b].traffic) {
     rData[a][b].traffic[c] = parseInt(rData[a][b].traffic[c]);
    }
   }
   rData[a]['stopsCummulativeDistance'] = utils.getStopsCummulativeDistance(rData[a]);
   rData[a]['stopsCummulativeTime'] = utils.getStopsCummulativeTime(rData[a]);
  }

  models.Route.find({}, function(err, routes) {
    for(var indx in routes) {
      var stops = routes[indx].route;
      var buses = routes[indx].buses;
      var route = [];
      var stopLocations = [];

      // Create Complete Route from route stops
      for(var indx2=0;indx2<stops.length-1;indx2++) {
       if(rData[stops[indx2]+stops[indx2+1]]) {
        route = route.concat(rData[stops[indx2]+stops[indx2+1]]);
       }
       else if(rData[stops[indx2+1]+stops[indx2]])
        route = route.concat(rData[stops[indx2+1]+stops[indx2]]);
       stopLocations.push(route.length);
      }

      // Create Buses
      for(var busindx in buses) {
        var bus = new Bus(route, stopLocations, buses[busindx].number, routes[indx].number, stops, buses[busindx].trafficDelay, buses[busindx].startDelay, buses[busindx].restDelay);
        // Start the bus simulation
        bus.start(bus);
        busesRunning.push(bus);
      }
    }
  });
}

loadDataAndStartSimulation();

module.exports.buses = busesRunning;
