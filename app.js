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
const client = new Lokka({
  transport: new Transport(HSL_GRAPHQL_URL)
})

app.disable('x-powered-by')
app.use(compress())
app.use(express.static('./public', {maxAge: 30 * 60 * 1000}))

app.get('/api/stations', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10')
  res.send(stationCache)
})

function refreshStationCache() {
  client.query(`
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
    setTimeout(refreshStationCache, 10 * 1000)
  })
}

function saveStations() {
  if (stationCache) {
    const stationsWithTimestamp = _.extend({},
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

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Tsygät.fi listening on *:${port}`)
  refreshStationCache()
  startStationSaving()
})

