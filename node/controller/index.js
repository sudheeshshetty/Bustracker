var models = require('../model');
var utils = require('../lib/utils');

module.exports = function (app, express, buses) {
    var v1 = express.Router();

    /*
    Description - Search cities
    URL - /v1/cities?search={search_string}
    */
    v1.get('/cities', (req, res) => {
      if(req.query.search == '')
	return res.send([])
      models.City.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}}, (err, cities) => {
        res.send(cities);
      });
    });

    /*
    Description - Search locations in city
    URL - /v1/locations?search={search_string}&city={city_name}
    */
    v1.get('/locations', (req, res) => {
      if(req.query.search == '')
	return res.send([])
      models.Location.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}, city: req.query.city}, (err, locations) => {
        res.send(locations);
      });
    });

    /*
    Description - Search busstops in a city
    URL - /v1/busstops?search={search_string}&city={city_name}
    */
    v1.get('/busstops', (req, res) => {
      if(req.query.search == '')
	return res.send([])
      models.Busstop.find({name: {$regex: new RegExp('^'+req.query.search), $options : "-i"}, city: req.query.city}, (err, busstops) => {
        res.send(busstops);
      });
    });

    /*
    Description - Search busstops near a location
    URL - /v1/stops?lat={latitude}&long={longitude}
    */
    v1.get('/stops', (req, res) => {
      if(!req.query.lat || !req.query.long) {
        return res.status(400).send({"message": "Geo Location Required"});
      }
      var x1 = req.query.lat;
      var y1 = req.query.long;
      var minDist = 100000000;
      var nearestStop = [];
      models.Busstop.find({}, (err, stops) => {
        stops = JSON.parse(JSON.stringify(stops));
        for(var indx in stops) {
          var x2 = stops[indx].lat;
          var y2 = stops[indx].long;
          stops[indx]['dist'] = utils.getDistanceHaversine(x1, x2, y1, y2);
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

    /*
    Description - Get the complete locations of buses running at any instant,
    Optional - Allow providing the busNumber and track it's location
    URL - /v1/position?busNumber={bus_number}
    */
    v1.get('/position', function(req, res) {
      var pos = [];
      for(var i in buses) {
        if(req.query.busNumber && buses[i].number != req.query.busNumber)
          continue;
        if(buses[i].currentPosition >-1 && buses[i].currentPosition<buses[i].route.length)
        {
          pos.push({routeNumber: buses[i].routeNumber, number: buses[i].number, lat: buses[i].route[buses[i].currentPosition].lat, long: buses[i].route[buses[i].currentPosition].long});
        }
      }
      res.send(pos);
    });

    /*
    Description - Find available bus between source and destination station
    URL - /v1/find?source={source_station}&destination={destination_station}
    */
    v1.get('/find', function(req,res){
      var source = req.query.source;
      var destination = req.query.destination;
      var ret = [];
      for(var i in buses) {
        var sourceIndex = buses[i].stops.indexOf(source);
        var destinationIndex = buses[i].stops.indexOf(destination);
        if(buses[i].currentPosition >-1 && buses[i].currentPosition<buses[i].route.length &&
          sourceIndex>-1 && destinationIndex>-1 && ((buses[i].direction==true && sourceIndex<destinationIndex) || (buses[i].direction==false && sourceIndex>destinationIndex))) {
          var timeLeft = 0;

          ret.push({routeNumber: buses[i].routeNumber, number: buses[i].number, lat: buses[i].route[buses[i].currentPosition].lat, long: buses[i].route[buses[i].currentPosition].long});
        }
      }
      res.send(ret);
    });

    app.use('/v1', v1);
};
