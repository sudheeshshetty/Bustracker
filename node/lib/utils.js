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

module.exports = {
  getDistance: getDistance,
  getDistanceHaversine: getDistanceHaversine,
  getStopsDistance: getStopsDistance,
  getStopsCummulativeDistance: getStopsCummulativeDistance,
  getStopsCummulativeTime: getStopsCummulativeTime
};
