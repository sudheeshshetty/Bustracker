var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var async = require('async');
var Bus = require('./lib/bus').Bus;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.npm_package_config_db_url);

var Schema = mongoose.Schema;

var Location = mongoose.model('Location', new Schema(
  {
    name: String,
    city: String,
    lat: String,
    long: String
  })
);

var City = mongoose.model('City', new Schema(
  {
    name: String,
    locations: [{name: String, lat: String, long: String}]
  })
);

var Busstop = mongoose.model('Busstop', new Schema(
  {
    name: String,
    city: String,
    lat: String,
    long: String,
    notation: String
  })
);

var Route = mongoose.model('Route', new Schema(
  {
    number: Number,
    route: [String],
    buses: [{
      number: Number, trafficDelay:Number, startDelay:Number, restDelay: Number
    }]
  }
));

app.get('/v1/cities', (req, res) => {
  if(req.query.search == '')
	return res.send([])
  City.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}}, (err, cities) => {
   res.send(cities);
  });
});

app.get('/v1/locations', (req, res) => {
  if(req.query.search == '')
	return res.send([])
  Location.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}, city: req.query.city}, (err, locations) => {
   res.send(locations);
  });
});

app.get('/v1/busstops', (req, res) => {
  if(req.query.search == '')
	return res.send([])
  Busstop.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}, city: req.query.city}, (err, busstops) => {
   res.send(busstops);
  });
});


function getDistance(x1, x2, y1, y2) {
  return Math.sqrt(Math.pow((x2-x1), 2) + Math.pow((y2-y1), 2));
}

var rad = function(x) {
  return x * Math.PI / 180;
};

// http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
var getDistanceHaversine = function(x1, x2, y1, y2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(x2 - x1);
  var dLong = rad(y2 - y1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(x1)) * Math.cos(rad(x2)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

app.get('/v1/stops', (req, res) => {
  if(!req.query.lat || !req.query.long) {
    return res.status(400).send({"message": "Geo Location Required"});
  }
  var x1 = req.query.lat;
  var y1 = req.query.long;
  var minDist = 100000000;
  var nearestStop = [];
  Busstop.find({}, (err, stops) => {
    stops = JSON.parse(JSON.stringify(stops));
    for(var indx in stops) {
      var x2 = stops[indx].lat;
      var y2 = stops[indx].long;
      stops[indx]['dist'] = getDistanceHaversine(x1, x2, y1, y2);
      if(minDist > stops[indx]['dist']) {
      	minDist = stops[indx]['dist'];
      }
    }
    var considereddistance = 1.5*minDist;
    if(minDist==0)
      considereddistance = 1.5*619.9903943671677;
    for(var indx in stops) {
      if(stops[indx]['dist'] == minDist)
        stops[indx]['nearest'] = true;
      else
        stops[indx]['nearest'] = false;
      if(stops[indx].dist<considereddistance)
        nearestStop.push(stops[indx]);
    }
    res.send(nearestStop);
  });
});

var getStopsDistance = function(route) {
  var dist = 0;
  for(var indx=0;indx<route.length-1;indx++){
	dist += getDistanceHaversine(route[indx].lat, route[indx+1].lat, route[indx].long, route[indx+1].long);
  }
  return dist;
}

var getStopsCummulativeDistance = function(route) {
  var totalDist = 0;
  var upCummulative = [];
  var downCummulative = [0];
  for(var indx=0;indx<route.length-1;indx++){
    var dist = getDistanceHaversine(route[indx].lat, route[indx+1].lat, route[indx].long, route[indx+1].long);
    totalDist += dist;
    downCummulative.push(totalDist);
  }
  for(var indx in downCummulative) {
    upCummulative.push(totalDist-downCummulative[indx]);
  }
  return {
     dist: totalDist,
     downCummulative: downCummulative,
     upCummulative: upCummulative
  };
}

var getStopsCummulativeTime = function(route) {
  var cummulativeTotalTime = [];
  var cummulativeTraffic = [];
  var cummulativeTotalTimeTemp = [];
  for(var indx=0;indx<route[0].traffic.length;indx++) {
   cummulativeTotalTime.push(0);
   cummulativeTotalTimeTemp.push(0);
  }
  for(var indx=0;indx<route.length;indx++){
    cummulativeTraffic.push([]);
    var traffic = route[indx].traffic;
    for(var indx2=0;indx2<traffic.length;indx2++) {
      cummulativeTotalTime[indx2] += traffic[indx2];
      cummulativeTraffic[indx][indx2] = 0;
    }
  }
  for(var indx=0;indx<route.length;indx++){
    var traffic = route[indx].traffic;
    for(var indx2=0;indx2<traffic.length;indx2++) {
      if(indx2%2==1) cummulativeTraffic[indx][indx2] = cummulativeTotalTimeTemp[indx2];
      cummulativeTotalTimeTemp[indx2] += traffic[indx2];
      if(indx2%2==0) cummulativeTraffic[indx][indx2] = cummulativeTotalTime[indx2] - cummulativeTotalTimeTemp[indx2];
    }
  }
  return {
    totalTime: cummulativeTotalTime,
    cummulativeTraffic: cummulativeTraffic
  };
}

var busesRunning = [];
var busChart = [];

var busesStartTime = 60*6*60; // Time in seconds

function loadDataAndStartSimulation(simulate) {
  var rData = {
    ALVW: parse(fs.readFileSync(__dirname+'/static/AL-VW'), {columns:true}),
    TN1TN2: parse(fs.readFileSync(__dirname+'/static/TN1-TN2'), {columns:true}),
    TN1YW: parse(fs.readFileSync(__dirname+'/static/TN1-YW'), {columns:true}),
    VWTN2: parse(fs.readFileSync(__dirname+'/static/VW-TN2'), {columns:true}),
    VWYW1: parse(fs.readFileSync(__dirname+'/static/VW-YW1'), {columns:true}),
    YW1YW: parse(fs.readFileSync(__dirname+'/static/YW1-YW'), {columns:true}),
    YWST: parse(fs.readFileSync(__dirname+'/static/YW-ST'), {columns:true})
  }

  for(var a in rData) {
   for(var b in rData[a]) {
    rData[a][b].traffic = rData[a][b].traffic.split(':');
    for(var c in rData[a][b].traffic) {
     rData[a][b].traffic[c] = parseInt(rData[a][b].traffic[c]);
    }
   }
   rData[a]['stopsCummulativeDistance'] = getStopsCummulativeDistance(rData[a]);
   rData[a]['stopsCummulativeTime'] = getStopsCummulativeTime(rData[a]);
  }

  Route.find({}, function(err, routes) {
    for(var indx in routes) {
      var stops = routes[indx].route;
      var buses = routes[indx].buses;
      var route = [];
      var stopLocations = [];
      for(var indx2=0;indx2<stops.length-1;indx2++) {
       if(rData[stops[indx2]+stops[indx2+1]]) {
        route = route.concat(rData[stops[indx2]+stops[indx2+1]]);
       }
       else if(rData[stops[indx2+1]+stops[indx2]])
        route = route.concat(rData[stops[indx2+1]+stops[indx2]]);
       stopLocations.push(route.length);
      }
      for(var busindx in buses) {
        var bus = new Bus(route, stopLocations, buses[busindx].number, routes[indx].number, stops, buses[busindx].trafficDelay, buses[busindx].startDelay, buses[busindx].restDelay);
        bus.start(bus, busesStartTime);
        busesRunning.push(bus);
      }
    }
  });
}

loadDataAndStartSimulation();

app.get('/v1/position', function(req, res) {
  var pos = [];
  for(var i in busesRunning) {
   if(req.query.busNumber && busesRunning[i].number != req.query.busNumber)
     continue;
   if(busesRunning[i].currentPosition >-1 && busesRunning[i].currentPosition<busesRunning[i].route.length)
   {
     pos.push({routeNumber: busesRunning[i].routeNumber, number: busesRunning[i].number, lat: busesRunning[i].route[busesRunning[i].currentPosition].lat, long: busesRunning[i].route[busesRunning[i].currentPosition].long});
   }
  }
  res.send(pos);
});

app.get('/v1/find', function(req,res){
  var source = req.query.source;
  var destination = req.query.destination;
  var buses = [];
  for(var i in busesRunning) {
    var sourceIndex = busesRunning[i].stops.indexOf(source);
    var destinationIndex = busesRunning[i].stops.indexOf(destination);
    if(busesRunning[i].currentPosition >-1 && busesRunning[i].currentPosition<busesRunning[i].route.length &&
       sourceIndex>-1 && destinationIndex>-1 && ((busesRunning[i].direction==true && sourceIndex<destinationIndex) || (busesRunning[i].direction==false && sourceIndex>destinationIndex))) {
     var timeLeft = 0;
     
     buses.push({routeNumber: busesRunning[i].routeNumber, number: busesRunning[i].number, lat: busesRunning[i].route[busesRunning[i].currentPosition].lat, long: busesRunning[i].route[busesRunning[i].currentPosition].long});
    }
  }
  res.send(buses);
});

app.get('/v1/calendar', function(req, res){
  res.send([{
    number: 263,
    routeNumber: 9,
    stops: {
      "Yerwada Bus Stop": [new Date(), new Date(new Date().getTime()-43764)],
      "Vishrantwadi Bus Stop": [new Date(new Date().getTime()-2423), new Date(new Date().getTime()-27833)]
    }
  },{
    number: 465,
    routeNumber: 3,
    stops: {
      "Alandi Nagar Bus Stop": [new Date(), new Date(new Date().getTime()-43764)]
    }
  }]);
});

var server = app.listen(process.env.npm_package_config_server_port, function(){
  console.log("Server is listening at port : " + process.env.npm_package_config_server_port);
});
