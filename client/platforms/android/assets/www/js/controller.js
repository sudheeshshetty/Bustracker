var app = angular.module('myApp', ['ui.router','ionic','ngCordova']);

app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
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
    this.showMap =function(lat,long,zoomvalue){
        var mylatlong = new google.maps.LatLng(lat,long);
        mapOptions={
            center: mylatlong,
            zoom: zoomvalue,
            mapTypeControl:true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.BOTTOM_CENTER
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: true,
            fullscreenControlOptions:{
                position: google.maps.ControlPosition.BOTTOM_RIGHT
            },
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
        url:'/main?source',
        views:{
            'header':{
                templateUrl: 'views/secondpage.html',
                controller: 'HeaderController'
            }
        }
    })
        .state('home',{
        url:'/',
        views:{
            'header':{
                templateUrl:'views/firstpage.html',
                controller:'MainController'
            }
        }
    })
}]);

app.controller('HeaderController',['$scope','$state','$cordovaGeolocation','$http','Loc','Map','$stateParams',function($scope,$state,$cordovaGeolocation,$http,Loc,Map,$stateParams){
    var mapOptions;
    var map;
    $scope.loc=Loc;
    var lat=$scope.loc.lat;
    var long=$scope.loc.long;
    var mapObject=Map.showMap($scope.loc.lat,$scope.loc.long,12);
    $scope.map=mapObject;
    $scope.tab=false;
    $scope.maps=true;
    $scope.bus_Stops=false;
    $scope.bus=false;
    $scope.map=map;
    $scope.loc.bus_number;
    var notation=$stateParams.source;
    $scope.searchdest=function(){
        $http.get("http://localhost:8000/v1/busstops?search="+$scope.loc.dest+"&city="+$scope.loc.city).then(function(res){
            console.log(res);
            $scope.dests=[]
            var destSet=[];
            $scope.busstopset=[];
            for(indx in res.data){
                destSet.push(res.data[indx].name);
                $scope.busstopset.push(res.data[indx].notation);
            }
            $scope.dests=destSet;
            console.log($scope.dests);
        });
    }
    $scope.destid=function(){
        var busstopnotation=res.data[0].notation;
        var activeElement = document.activeElement;
        if (activeElement) {
            activeElement.blur();
        }
        console.log(busstopnotation);
    }
    $scope.searchBus=function(){
        console.log($scope.dests.indexOf($scope.loc.dest));
        var destnotation=$scope.busstopset[$scope.dests.indexOf($scope.loc.dest)];
        console.log(destnotation);
        $http.get("http://localhost:8000/v1/find?source="+notation+"&destination="+destnotation).then(function(res){
            console.log(res);
            var buses=[];
            $scope.bus_sets=[];
            for(indx in res.data){
                buses.push(res.data[indx].number);
            }
            $scope.bus_sets=buses;
            console.log($scope.bus_sets);
        });
    }
    
    $scope.getBus = function(){
        var markers=[];
        console.log($scope.loc.bus_number);
        window.setInterval(function(){
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
            $http.get("http://localhost:8000/v1/position?busNumber="+$scope.loc.bus_number).then(function(res){
                console.log(res);
                for (indx in res.data){
                    var mylatlong_local = new google.maps.LatLng(res.data[indx].lat,res.data[indx].long);
                    var marker = new google.maps.Marker({
                        position: mylatlong_local,
                        map: mapObject,
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
        var mapObject=Map.showMap($scope.loc.lat,$scope.loc.long,16);
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
            
            $scope.loc.city=longNames[indxlong];
            $scope.loc.location=longNames[indxlong-1];
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
        $http.get("http://localhost:8000/v1/cities?search="+$scope.loc.city).then(function(res){
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
        if($scope.loc.location==''){
            $scope.searchcity();
        }
        else
        {
            $http.get("http://localhost:8000/v1/locations?search="+$scope.loc.location+"&city="+$scope.loc.city).then(function(res){
                var locationlist=[];
                for(indx in res.data){
                    locationlist.push(res.data[indx].name);
                }
                $scope.locations=locationlist;
                if(res.data.length==1) {
                    $scope.loc.location=res.data[0].name;
                    var activeElement = document.activeElement;
                    if (activeElement) {
                        activeElement.blur();
                    }
                    $scope.loc.lat = res.data[0].lat;
                    $scope.loc.long = res.data[0].long;
                    var mapObject=Map.showMap($scope.loc.lat,$scope.loc.long,16);
                    $scope.map=mapObject;
                    $http.get("http://localhost:8000/v1/stops?lat="+$scope.loc.lat+"&long="+$scope.loc.long).then(function(res){
                        console.log(res);
                        $scope.recentLocation = res.data;
                        for(indx in res.data){
                            var lat=res.data[indx].lat;
                            var long=res.data[indx].long;
                            console.log(lat+"  "+long);
                            var mylatlong = new google.maps.LatLng(lat,long);
                            var marker=new google.maps.Marker({
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
                                            suppressMarkers: true,
                                            draggable: true,
                                            preserveViewport: true
                                        });
                                    }
                                    else
                                        $("#error").append("Unable to retrieve your route<br />");
                                });
                            }
                            google.maps.event.addListener(marker,'click',function() {
                                var latitude = this.position.lat();
                                var longitude = this.position.lng();
                                var max = 10000000;
                                for(var indx in $scope.recentLocation) {
                                    var dist = $scope.getDistanceHaversine($scope.recentLocation[indx].lat,latitude,$scope.recentLocation[indx].long,longitude)
                                    if(dist<max) {
                                        max = dist;
                                        notation = $scope.recentLocation[indx].notation;
                                    }
                                }
                                $state.go('main', {source:notation});
                            });
                        }
                    });        
                }
            });
        }
    }
    $scope.rad = function(x) {
        return x * Math.PI / 180;
    };
    
    // http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
    $scope.getDistanceHaversine = function(x1, x2, y1, y2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = $scope.rad(x2 - x1);
        var dLong = $scope.rad(y2 - y1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos($scope.rad(x1)) * Math.cos($scope.rad(x2)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };
    
    
    $scope.switchState = function(){
        $state.go("main");
    }
}]);

