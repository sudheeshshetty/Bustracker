var async = require('async');

function Bus(route, stopLocations, number, routeNumber, stops, trafficDelay, startDelay, restDelay) {
  this.route = route;
  this.routeNumber = routeNumber;
  this.direction = true;
  this.stopsCount = stops.length;
  this.stops = stops;
  this.upStation = stops[0];
  this.downStation = stops[this.stopsCount-1];
  this.number = number;
  this.trafficDelay = trafficDelay;
  this.startDelay = startDelay;
  this.restDelay = restDelay;
  this.currentPosition = -1;
}

Bus.prototype.sleepTime = function(time) {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      return resolve();
    },time)
  });
}

Bus.prototype.updateParameters = function(obj) {
  return new Promise((resolve, reject) => {
      if(obj.direction==true) {
        obj.currentPosition += 1;
      }
      else {
        obj.currentPosition -= 1;
      }
      //console.log('Bus '+ obj.number + '(' + obj.routeNumber + '): ' + obj.currentPosition + 'th stop.');
      if(obj.currentPosition == obj.route.length || obj.currentPosition == -1) {
        console.log('Bus ' + obj.number + '(' + obj.routeNumber + '): Reached Destination.');
	console.log('Bus ' + obj.number + '(' + obj.routeNumber + '): Will Go ' + (obj.direction==true?obj.upStation+'-'+obj.downStation:obj.downStation+'-'+obj.upStation) + ' after ' + obj.restDelay + ' minutes.');
        obj.sleepTime(obj.restDelay * 1000 * 60).then(() => {
          console.log('After Rest Delay');
          console.log('Bus '+ obj.number + '(' + obj.routeNumber + '): Changing Direction. Going Down : ' + obj.direction + " " + (obj.direction==true?obj.upStation+'-'+obj.downStation:obj.downStation+'-'+obj.upStation));
          if(obj.direction==true) {
            obj.currentPosition -= 1;
	    obj.direction = false;
          }
          else {
            obj.currentPosition += 1;
            obj.direction = true;
          }
          obj.trafficDelay = (obj.trafficDelay+1)%4;
          return resolve();
        });
      }
      else {
        return resolve();
      }
  });
};

Bus.prototype.start = function(obj) {
  obj.sleepTime(obj.startDelay * 1000 * 60).then(() => {
    console.log('Bus '+ obj.number + '(' + obj.routeNumber + '): Started from source station ' + obj.upStation + ' at ' + new Date());
    async.whilst(
    function () { return true; },
    function (callback) {
      obj.updateParameters(obj).then(() => {
        obj.sleepTime(obj.route[obj.currentPosition].traffic[obj.trafficDelay]*1000).then(() => {
          return callback();
        });
      });
    },
    function (err, n) {
        // Never Reach, Due to infinite Simulation Loop
    });
  });
};

module.exports = {
   Bus: Bus
};
