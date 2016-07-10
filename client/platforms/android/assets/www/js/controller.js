var app = angular.module('myApp', ['ui.router','ionic','ngCordova']);

app.run(function($ionicPlatform) {
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

app.service('Loc', function () {
    return {};
})

app.service('Map',function(){
    this.showMap =function(lat,long){
        var mylatlong = new google.maps.LatLng(lat,long);
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
        return map;
    }
});

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('main',{
        url:'/main',
        views:{
            'header':{
                templateUrl: 'map.html',
                controller: 'HeaderController'
            }
        }
    })
        .state('home',{
        url:'/',
        views:{
            'header':{
                templateUrl:'main.html',
                controller:'MainController'
            }
        }
    })
}]);

app.controller('HeaderController',['$scope','$state','$cordovaGeolocation','$http','Loc','Map',function($scope,$state,$cordovaGeolocation,$http,Loc,Map){
    var mapOptions;
    var map;
    var lat=Loc.lat;
    var long=Loc.long;
    var map=Map.showMap(lat,long);
    $scope.map=map;
    
    $scope.search=function(){
        alert("hi");
    }
}]);

app.controller('MainController',['$scope','$state','$cordovaGeolocation','$http','Loc','Map',function($scope,$state,$cordovaGeolocation,$http,Loc,Map){
    
    var onError=function(err){
        $scope.calldialog();
    }
    
    var onSuccess=function(position){
        $scope.loc = Loc;
        $scope.loc.lat  = position.coords.latitude;
        $scope.loc.long = position.coords.longitude;
        //  $scope.map=map;
        var mylatlong = new google.maps.LatLng($scope.loc.lat,$scope.loc.long);
        var mapObject=Map.showMap($scope.loc.lat,$scope.loc.long);
        $scope.map=mapObject;
        
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'latLng': mylatlong }, function (results, status) {
            var result = results[0];
            var state = '';
            var longNames = [];
            var indxlong = -1;
            
            for (var i = 0, len = result.address_components.length; i < len; i++) {
                var ac = result.address_components[i];
                if(longNames.length>0 && ac.long_name !== longNames[longNames.length-1])
                    longNames.push(ac.long_name);
                if(longNames.length == 0)
                    longNames.push(ac.long_name);
                if(ac.types.indexOf('administrative_area_level_2')>=0){
                    indxlong = longNames.length - 1;
                }
            }
            
            $scope.city=longNames[indxlong];
            $scope.location=longNames[indxlong-1];
            $scope.$apply();
        });
    }
    
    $scope.calldialog= function() {
        document.addEventListener("deviceready",function() {
            cordova.dialogGPS("Your GPS is Disabled, this app needs to be enable to works.",//message
                              "Use GPS, with wifi or 3G.",//description
                              function(buttonIndex){//callback
                switch(buttonIndex) {
                    case 0: exit;//cancel
                    case 1: exit;
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
    
    $scope.searchcity = function(){
        $http.get("http://10.131.126.13:8000/v1/cities?search="+$scope.city).then(function(res){
            $scope.cities=[];
            var citylist=[]
            $scope.locations=[];
            //$scopelocations=[]
            for(indx in res.data){
                citylist.push(res.data[indx].name);
            }
            $scope.cities=citylist;
            if(res.data.length==1) {
                $scope.locations = res.data[0].locations;
                
            }
        });
        
    }
    
    $scope.searchlocation = function(){
        if($scope.location==''){
            $scope.searchcity();
        }
        else
        {
            $http.get("http://10.131.126.13:8000/v1/locations?search="+$scope.location+"&city="+$scope.city).then(function(res){
                var locationlist=[];
                for(indx in res.data){
                    locationlist.push(res.data[indx].name);
                }
                $scope.locations=locationlist;
                if(res.data.length==1) {
                    $scope.location=res.data[0].name;
                    var activeElement = document.activeElement;
                    if (activeElement) {
                        activeElement.blur();
                    }
                    $scope.loc.lat = res.data[0].lat;
                    $scope.loc.long = res.data[0].long;
                    var mapObject=Map.showMap($scope.loc.lat,$scope.loc.long);
                    $scope.map=mapObject;
                    $http.get("http://10.131.126.13:8000/v1/stops?lat="+$scope.loc.lat+"&long="+$scope.loc.long).then(function(res){
                        console.log(res);
                        for(indx in res.data){
                            var lat=res.data[indx].lat;
                            var long=res.data[indx].long;
                            console.log(lat+"  "+long);
                            var mylatlong = new google.maps.LatLng(lat,long);
                            new google.maps.Marker({
                                position: mylatlong,
                                map: map,
                                title: "Your Location",
                                icon : {
                                  url: 'img/bus_stop.png',
                                  scaledSize: new google.maps.Size(30, 30)
                               }
                            });
                            if(res.data[indx].nearest)
                            {
                                var directionsService = new google.maps.DirectionsService();
                                var directionsRequest = {
                                    origin: new google.maps.LatLng($scope.loc.lat, $scope.loc.long),
                                    destination: new google.maps.LatLng(lat, long),
                                    travelMode: google.maps.DirectionsTravelMode.WALKING
                                };
                                directionsService.route(directionsRequest,function(response, status){
                                    if (status == google.maps.DirectionsStatus.OK){
                                        new google.maps.DirectionsRenderer({
                                            map: mapObject,
                                            directions: response,
                                            draggable: true,
                                            preserveViewport: true
                                        });
                                    }
                                    else
                                        $("#error").append("Unable to retrieve your route<br />");
                                });
                            }
                        }
                    });
                }
            });
        }
    }
    
    $scope.getBus = function(){
        var markers=[];
        var mylatlong = new google.maps.LatLng($scope.loc.lat,$scope.loc.long);
        var mapOptions={
            center: mylatlong,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"),mapOptions);
        new google.maps.Marker({
            position: mylatlong,
            map: map,
            title: "Your Location"  
        });
        window.setInterval(function(){
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
            $http.get("http://10.131.126.13:8000/v1/position").then(function(res){
                console.log(res);
                for (indx in res.data){
                    var mylatlong_local = new google.maps.LatLng(res.data[indx].lat,res.data[indx].long);
                    var marker = new google.maps.Marker({
                        position: mylatlong_local,
                        map: map,
                        title: "Yo",
                        icon : {
                            url: 'img/bus.png',
                            scaledSize: new google.maps.Size(20, 20)
                        }
                    });
                    markers.push(marker);
                }
            });
        },2000);
    }
    
    $scope.switchState = function(){
        $state.go("main");
    }
}]);