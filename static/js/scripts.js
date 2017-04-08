// page init
jQuery(function() {
    initWow();
});

// wow for scroll animations
function initWow() {
    new WOW().init();
}

var locationCenterMap = "";

$(document).ready(function() {
    $('#wrapper').fadeIn(1200);
    //rider side bar in demo
    $('#riderRequest').submit(function(e) {
        e.preventDefault();
        requestRide();
    });
    //getLocation();
    $('#signupForm').submit(function(e) {
        e.preventDefault();
        if (document.getElementById('passwordField').value == document.getElementById('confPasswordField').value) {
            doRegister();
        } else {
            $("#signupForm").effect("shake");
            document.getElementById('nameField').style.borderColor = "green";
            document.getElementById('emailField').style.borderColor = "green";
            document.getElementById('passwordField').style.borderColor = "red";
            document.getElementById('passwordField').value = "";
            document.getElementById('confPasswordField').style.borderColor = "red";
            document.getElementById('confPasswordField').value = "";
        }
    });
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        doLogin();
    });
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.log("there was an error with getting the location");
    }
}

function showPosition(position) {
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    map.setCenter(new google.maps.LatLng(lat, lng));
    locationCenterMap = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
}

function doRegister() {
    console.log("running");
    var formData = {
        'name': $('input[name=name]').val(),
        'email': $('input[name=email]').val(),
        'password': $('input[name=password]').val(),
        'confirmpassword': $('input[name=confpassword]').val()
    }
    $.ajax({
        url: '/api/signup',
        method: 'POST',
        data: formData,
        success: function(data, status) {
            //what to do when data is returned
            console.log(status + " : " + data);
            if (data.charAt(0) === "/") {
                window.location.href = data;
            } else {
                $("#signupForm").effect("shake");
                document.getElementById('nameField').style.borderColor = "green";
                document.getElementById('emailField').style.borderColor = "red";
                document.getElementById('emailField').value = "";
                document.getElementById('passwordField').style.borderColor = "grey";
                document.getElementById('passwordField').value = "";
                document.getElementById('confPasswordField').style.borderColor = "grey";
                document.getElementById('confPasswordField').value = "";
            }
        }
    });
}

function doLogin() {
    console.log("running");
    var formData = {
        'email': $('input[name=email]').val(),
        'password': $('input[name=password]').val()
    }
    $.ajax({
        url: '/api/login',
        type: 'POST',
        data: formData,
        success: function(data, status) {
            //what to do when data is returned
            console.log(status + " : " + data);
            if (data.charAt(0) === "/") {
                window.location.href = data;
            } else if (data === "Invalid password!") {
                $("#loginForm").effect("shake");
                document.getElementById('emailField').style.borderColor = "green";
                document.getElementById('passwordField').style.borderColor = "red";
                document.getElementById('passwordField').value = "";
            } else if (data === "No account with that email was found!") {
                $("#loginForm").effect("shake");
                document.getElementById('emailField').style.borderColor = "red";
                document.getElementById('emailField').value = "";
                document.getElementById('passwordField').style.borderColor = "grey";
                document.getElementById('passwordField').value = "";
            } else {
                alert("Unknown error!");
            }
        }
    });
}

function requestRide() {
    console.log("requesting ride");
    var originA = document.getElementById('originRider').value;
    var destinationA = document.getElementById('destinationRider').value;
    var formData = {
        //'origin': $('input[name=origin]').val(),
        //'destination': $('input[name=destination]').val()
        'origin': originA,
        'destination': destinationA
    }
    $.ajax({
            url: '/api/rider',
            type: 'POST',
            data: formData,
            success: function(data, status) {
                //what to do when data is returned
                console.log(status);

                service.getDistanceMatrix({
                  origins: [originA],
                  destinations: [destinationA],
                  travelMode: 'DRIVING',
                  drivingOptions: {
                    departureTime: currentTime,
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                  },
                  unitSystem: google.maps.UnitSystem.IMPERIAL,
                  avoidHighways: false,
                  avoidTolls: false
                }, function(response, status) {
                  if (status !== 'OK') {
                    alert('Error was: ' + status);
                  } else {
                    var originList = response.originAddresses;
                    var destinationList = response.destinationAddresses;
                    /*var outputDiv = document.getElementById('output');
                    var priceDiv = document.getElementById('price');
                    outputDiv.innerHTML = '';
                    priceDiv.innerHTML = '';*/
                    deleteMarkers(markersArray);

                    var showGeocodedAddressOnMap = function(asDestination) {
                      var icon = asDestination ? destinationIcon : originIcon;
                      return function(results, status) {
                        if (status === 'OK') {
                          map.fitBounds(bounds.extend(results[0].geometry.location));
                          markersArray.push(new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location,
                            icon: icon
                          }));
                        } else {
                          alert('Geocode was not successful due to: ' + status);
                        }
                      };
                    };

                    /*for (var i = 0; i < originList.length; i++) {
                      var results = response.rows[i].elements;
                      geocoder.geocode({'address': originList[i]},
                          showGeocodedAddressOnMap(false));
                      for (var j = 0; j < results.length; j++) {
                        geocoder.geocode({'address': destinationList[j]},
                            showGeocodedAddressOnMap(true));
                        outputDiv.innerHTML += originList[i] + ' to ' + destinationList[j] +
                            ': <b>' + results[j].distance.text + '</b> in <b>' +
                            results[j].duration.text + '</b><br>';
                        priceDiv.innerHTML += '<b>Estimated Value</b>: $' + calculateCost(results[j].distance.value, results[j].duration.value);
                      }
                    }*/

                  }
                });
                calculateAndDisplayRoute(directionsService, directionsDisplay, originA, destinationA);
                directionsDisplay.setMap(map);

                //console.log(document.getElementsByClassName('cost')[0].value);
                //$("#cost wrapper").text("1337");
                $(".overlay.destination").hide(); setTimeout(function() {
                    $("body.rider").addClass('side-bar-active');
                }, 200);
            }
    });
}

function calculateCost(distance, time) {
    var cost = 0;
    var TAX = 0;
    var BASE_PRICE = 5;
    var COST_PER_MINUTE = 0.5;
    var COST_PER_MILE = 1.05;
    var TAX_PERCENT = 0.05;

    cost = BASE_PRICE + (COST_PER_MINUTE * (time / 60)) + (COST_PER_MILE * (distance / 1000));
    tax = (TAX_PERCENT * cost);

    return (cost + tax).toFixed(2);
}

function deleteMarkers(markersArray) {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }
    markersArray = [];
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, theOrigin, theDestination) {
    directionsService.route({
        origin: theOrigin,
        destination: theDestination,
        travelMode: 'DRIVING'
    }, function(response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

var map;
var bounds;
var markersArray = [];

// DirectionsRenderer
var directionsService;
var directionsDisplay;

var currentTime = new Date();
var destinationIcon;
var originIcon;

var geocoder;
var service;

var sjsu = new google.maps.LatLng(37.336206, -121.882491);


var driverslocations = [
    ['driverOne', 37.3495, -121.8940],
    ['driverTwo', 37.3290, -121.8888],
    ['driverThree', 37.3310, -121.8604]
];


var MY_MAPTYPE_ID = 'custom_style';

function initMap() {

    //map styles
    var featureOpts = [{
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{
            "color": "#7c93a3"
        }, {
            "lightness": "-10"
        }]
    }, {
        "featureType": "administrative.country",
        "elementType": "geometry",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "administrative.country",
        "elementType": "geometry.stroke",
        "stylers": [{
            "color": "#c2d1d6"
        }]
    }, {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#dde3e3"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#c2d1d6"
        }]
    }, {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{
            "color": "#a9b4b8"
        }, {
            "lightness": "0"
        }]
    }, {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#a3c7df"
        }]
    }];

    bounds = new google.maps.LatLngBounds;

    directionsService = new google.maps.DirectionsService;

    directionsDisplay = new google.maps.DirectionsRenderer;

    destinationIcon = 'https://chart.googleapis.com/chart?' +
        'chst=d_map_pin_letter&chld=D|FF0000|000000';

    originIcon = 'https://chart.googleapis.com/chart?' +
        'chst=d_map_pin_letter&chld=O|FFFF00|000000';

    var mapOptions = {
        zoom: 14,
        center: sjsu,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
        },
        mapTypeId: MY_MAPTYPE_ID
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

    geocoder = new google.maps.Geocoder;
    service = new google.maps.DistanceMatrixService;

    var styledMapOptions = {
        name: 'Custom Style'
    };

    //To show rider location
    setTimeout(function() { //here tmp until lat lng fix
        userMarker = new RichMarker({
            position: locationCenterMap,
            map: map,
            content: '<div class="richmarker-wrapper"><span class="pulse"></span></div>',
            shadow: 0
        });
    }, 5000);


    //To show drivers near by
    for (var i = 0; i < driverslocations.length; i++) {
        curMarker = new RichMarker({
            position: new google.maps.LatLng(driverslocations[i][1], driverslocations[i][2]),
            map: map,
            content: '<div class="richmarker-wrapper"><span class="uber-car"></span></div>',
            shadow: 0
        });
    }

    var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    map.mapTypes.set(MY_MAPTYPE_ID, customMapType);
}

google.maps.event.addDomListener(window, 'load', initMap);
