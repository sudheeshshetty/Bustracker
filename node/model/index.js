var mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports.Location = mongoose.model('Location', new Schema(
  {
    name: String,
    city: String,
    lat: String,
    long: String
  })
);

module.exports.City = mongoose.model('City', new Schema(
  {
    name: String,
    locations: [{name: String, lat: String, long: String}]
  })
);

module.exports.Busstop = mongoose.model('Busstop', new Schema(
  {
    name: String,
    city: String,
    lat: String,
    long: String,
    notation: String
  })
);

module.exports.Route = mongoose.model('Route', new Schema(
  {
    number: Number,
    route: [String],
    buses: [{
      number: Number, trafficDelay:Number, startDelay:Number, restDelay: Number
    }]
  }
));
