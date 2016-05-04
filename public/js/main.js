var defaultUserSettings = {
  lat: 60.1729721445,
  lng: 24.9399946767,
  zoom: 15
}
var map = null

function initializeGoogleMaps() {
  var styles = [{"featureType": "all", "elementType": "labels.text.fill", "stylers": [{"saturation": 36 }, {"color": "#333333"}, {"lightness": 40 } ] }, {"featureType": "all", "elementType": "labels.text.stroke", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "all", "elementType": "labels.icon", "stylers": [{"visibility": "off"} ] }, {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [{"color": "#fefefe"}, {"lightness": 20 } ] }, {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{"color": "#fefefe"}, {"lightness": 17 }, {"weight": 1.2 } ] }, {"featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 20 } ] }, {"featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 21 } ] }, {"featureType": "poi.park", "elementType": "geometry", "stylers": [{"color": "#ccedc8"}, {"lightness": 21 } ] }, {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{"color": "#ffffff"}, {"lightness": 17 } ] }, {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{"color": "#ffffff"}, {"lightness": 29 }, {"weight": 0.2 } ] }, {"featureType": "road.arterial", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 18 } ] }, {"featureType": "road.local", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "transit", "elementType": "geometry", "stylers": [{"color": "#f2f2f2"}, {"lightness": 19 } ] }, {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#e9e9e9"}, {"lightness": 17 } ] }, {"featureType": "water", "elementType": "geometry.fill", "stylers": [{"color": "#e0eff8"} ] } ]
  var mapOptions = {
    center: new google.maps.LatLng(defaultUserSettings.lat, defaultUserSettings.lng),
    zoom: defaultUserSettings.zoom,
    disableDefaultUI: true,
    zoomControl: false,
    styles: styles
  }

  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions)
}


function createStation(stationObject) {
  function createLabelElement() {
    var countElement = document.createElement('div')
    countElement.className = 'line-number'
    console.log(stationObject.bikesAvailable, stationObject.spacesAvailable)
    var countContent =
      '<span class="spaces-available hidden">' + stationObject.spacesAvailable + '</span>'+
      '<span class="bikes-available">' + stationObject.bikesAvailable + '</span>'
    countElement.innerHTML = countContent

    return countElement.outerHTML
  }

  function drawStation() {
    var labelContent = document.createElement('div')
    labelContent.className = 'data-stationId-' + stationObject.id
    labelContent.innerHTML = createLabelElement()

    new MarkerWithLabel({
      position: new google.maps.LatLng(stationObject.lat, stationObject.lon),
      map: map,
      icon: {
        path: 'M-20,0a20,20 0 1,0 40,0a20,20 0 1,0 -40,0',
        fillColor: '#FF0000',
        scale: 0.5
      },
      labelClass: 'labels',
      labelContent: labelContent,
      labelAnchor: new google.maps.Point(10,10)
    })
  }
  drawStation()
}

function getJSON(url, callback) {
  var request = new XMLHttpRequest()
  request.open('GET', url, true)

  request.onreadystatechange = function() {
    if (this.readyState === 4) {
      if (this.status >= 200 && this.status < 400) {
        var data = JSON.parse(this.responseText)
        callback(data)
      }
    }
  }

  request.send()
  request = null
}

function toggleMapMode(mode) {
  // .bikes-available
  // .spaces-available
  var toBeHidden = mode === 'rent-button' ? '.spaces-available' : '.bikes-available'
  var toBeShown = mode === 'rent-button' ? '.bikes-available' : '.spaces-available'

  var toBeHiddenElements = document.querySelectorAll(toBeHidden)
  var toBeShownElements = document.querySelectorAll(toBeShown)

  for(var i = 0; i < toBeHiddenElements.length; i++){
    toBeHiddenElements[i].classList.add('hidden')
  }
  for(var i = 0; i < toBeShownElements.length; i++){
    toBeShownElements[i].classList.remove('hidden')
  }
}

function toggleMode() {
  function toggleButtonStates(element) {
    var buttons = document.querySelectorAll('.mode-button')

    for(var i = 0; i < buttons.length; i++){
      buttons[i].classList.remove('button-active')
    }

    element.classList.add('button-active')
  }


  var isActiveMode = this.classList.contains('button-active')
  if (!isActiveMode) {
    var mode = this.getAttribute('id')
    toggleButtonStates(this) // cleanup this
    toggleMapMode(mode)
  }
}

function addButtonListeners() {
  var rentButton = document.getElementById("rent-button")
  var returnButton = document.getElementById("return-button")
  rentButton.addEventListener("click", toggleMode, false)
  returnButton.addEventListener("click", toggleMode, false)
}

function initializeApp() {
  initializeGoogleMaps()
  getJSON('/api/stations', function(data) {
    _.map(data.bikeRentalStations, createStation)
  })
  addButtonListeners()
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}
ready(initializeApp)
