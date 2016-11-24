import _ from 'lodash'
import express from 'express'
import compress from 'compression'

var stationDataByMoment = null
const app = express()
const request = require("request")
const strftime = require('strftime')
const port = process.env.PORT || 3001

app.disable('x-powered-by')
app.use(compress())
app.use(express.static('./public', {maxAge: 30 * 60 * 1000}))

app.get('/api/stations', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10')
  res.send(stationDataByMoment)
})

/** Get data of stations by datetime
*
* params: datetime "2016-07-04T08:15:01"
*/
function getStationDataFromServer(date) {
  var urlDate = strftime('%Y%m%dT%H%M01Z', date);
  var url = "http://juhapekm.users.cs.helsinki.fi/citybikes/stations_"+urlDate
  console.log(url)
  request({
      url: url,
      json: true
  }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
          var stationIndexArray = (Object.keys(body['result'])); // Print the json response
          var stationObjectArray = [];
          stationIndexArray.forEach(function(value) {
            //console.log(body['result'][value])
            stationObjectArray.push(body['result'][value]);
          });
          var stationObjectQueryTypeArray = [];
          stationObjectArray.forEach(function(stationObject) {
            var stationObjectQueryType =(
              {id: stationObject['name'],
              name: stationObject['name'].substring(4),
              lat: parseFloat(stationObject['coordinates'].split(",")[0]),
              lon: parseFloat(stationObject['coordinates'].split(",")[1]),
              bikesAvailable: stationObject['avl_bikes'],
              spacesAvailable: stationObject['free_slots']}
            );
            stationObjectQueryTypeArray.push(stationObjectQueryType)
          });
          var result = {bikeRentalStations: stationObjectQueryTypeArray}
          stationDataByMoment = result;
      }
  })
}

/* Gets data of stations repeatedly
* Increments datetime by 10 minutes between function calls
*/
var i = 1;
function repeatedStationInfoGetter() {
  var initDate = new Date("2016-07-04T08:15:01")
  var deltaMillisec = 10*60*1000;
  getStationDataFromServer(new Date(initDate.getTime() + deltaMillisec*i));
  i = i+1;
}

app.listen(port, () => {
  console.log(`Kaupunkifillarit.fi listening on *:${port}`)
  setInterval(repeatedStationInfoGetter, 2 * 1000);
  console.log('App running! Check http://localhost:3001/');
})
