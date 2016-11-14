//var express = require("express");

import _ from 'lodash'
import express from 'express'
import compress from 'compression'
import Lokka from 'lokka'
import Transport from 'lokka-transport-http'
import {MongoClient} from 'mongodb'

var stationCache = null
var database = null

const HSL_GRAPHQL_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql'
const app = express()
const graphQLClient = new Lokka({
  transport: new Transport(HSL_GRAPHQL_URL)
})
var request = require("request")

var index = 1

app.disable('x-powered-by')
app.use(compress())
app.use(express.static('./public', {maxAge: 30 * 60 * 1000}))

app.get('/api/stations', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10')
  res.send(stationCache)
})

function refreshStationCache() {
  graphQLClient.query(`
    {
      bikeRentalStations {
        id,
        name,
        lat,
        lon,
        bikesAvailable,
        spacesAvailable
      }
    }
  `).then(result => {
    stationCache = result
    console.log(stationCache)
  })
}

function saveStations() {
  if (stationCache) {
    const stationsWithTimestamp = _.extend(
      {},
      stationCache,
      {
        timestamp: new Date().getTime()
      }
    )
    database.collection('stations').insertOne(stationsWithTimestamp, (err, result) => {})
  }
}

function startStationSaving() {
  if (process.env.MONGODB_URI) {
    MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
      if (!err) {
        database = db
        console.log("Connected to MongoDB")
        setInterval(saveStations, 60 * 1000)
      } else {
        console.error(err)
      }
    })
  }
}

/**
*
* params: date YYYYMMDD, time HHMMSS
*/
function getOldStationInfo() {
  var datetime = new Date("2016-07-04T08:15:01")
  var dateString = datetime.getUTCFullYear() +'0'+(datetime.getUTCMonth()+1)+'0'+datetime.getUTCDate()
  datetime.setUTCMinutes(datetime.getUTCMinutes() + index*10)
  var timeString = '0'+datetime.getUTCHours()+''+datetime.getUTCMinutes()+'01'
  index = index + 1
  var urlDate = dateString + 'T' + timeString + 'Z'
  //var url = "http://dev.hsl.fi/tmp/citybikes/stations_"+urlDate
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
          stationCache = result;
      }
  })
}

function testObjectStuff() {
  var a = "60.155411,24.950391";
  var lat = a.split(",")[0];
  console.log('lat:'+lat)

}

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Kaupunkifillarit.fi listening on *:${port}`)
  //setInterval(refreshStationCache, 10 * 1000)
  //refreshStationCache()
  //startStationSaving()
  getOldStationInfo()

  //setInterval(getOldStationInfo, 2000)
  //testObjectStuff()
})
