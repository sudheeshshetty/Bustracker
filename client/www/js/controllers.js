// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic','ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('AppCtrl', function($scope, $cordovaGeolocation,$http,$state) {



  var mapOptions;
  var map;
  $scope.refresh = function(){

    $http.get("http://localhost:3000/search1?busstop_name="+$scope.busstop+"&destination="+$scope.destination).then(function(res){


        
              for(var i =0; i<3;i=i+1)
              {

                
                var mylatlong = new google.maps.LatLng(res.data.cords[i].lat,res.data.cords[i].long);
                
                var marker = new google.maps.Marker({
                    position: mylatlong,
                    map: map,
                    title: "Yo",
                    icon : {
                              url: 'img/bus.png',
                              scaledSize: new google.maps.Size(20, 20)
                           }
                    });
                

              }



    },function(res){});

  }
  var onError=function(err){
      $scope.calldialog();
  }

  var onSuccess=function(position){


        $scope.lat  = position.coords.latitude;
        $scope.long = position.coords.longitude;
        
        //  $scope.map=map;
        var mylatlong = new google.maps.LatLng($scope.lat,$scope.long);
        mapOptions={

          center: mylatlong,
          zoom: 16,
          mapTypeId: google.maps.MapTypeId.ROADMAP

        };
        map = new google.maps.Map(document.getElementById("map"),mapOptions);
        new google.maps.Marker({
              position: mylatlong,
              map: map,
              title: "Your Location"
              
          });

        
    }

  $scope.calldialog= function() {
      document.addEventListener("deviceready",function() {
      cordova.dialogGPS("Your GPS is Disabled, this app needs to be enable to works.",//message
                        "Use GPS, with wifi or 3G.",//description
                        function(buttonIndex){//callback
                        switch(buttonIndex) {
                            case 0: break;//cancel
                            case 1: break;//neutro option
                            case 2: var posOptions = {timeout: 5000, enableHighAccuracy: false};
                                    var pos=$cordovaGeolocation.getCurrentPosition(posOptions);
                                    pos.then(onSuccess, onError);//user go to configuration
                        }},
                        "Please Turn on GPS",//title
                        ["Cancel","Later","Go"]);//buttons
                      });
  }



   var posOptions = {timeout: 1000, enableHighAccuracy: false};
   var pos=$cordovaGeolocation.getCurrentPosition(posOptions);
   pos.then(onSuccess, onError);

   var watchOptions = {timeout : 3000, enableHighAccuracy: false};
   var watch = $cordovaGeolocation.watchPosition(watchOptions);
   watch.then(null, onError, onSuccess);
   watch.clearWatch();


   
});
