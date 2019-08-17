const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors()); // so that app can access

const bookingsExtracted = {};

JSON.parse(fs.readFileSync("./server/bookings.json")).map(bookingRecord => {
  var entries = bookingsExtracted[Date.parse(bookingRecord.time)] || [];

  entries.push({
    userId: bookingRecord.user_id,
    duration: bookingRecord.duration * 60 * 1000, //mins into ms
    existing: true
  });

  bookingsExtracted[Date.parse(bookingRecord.time)] = entries;
});

app.get("/bookings", (_, res) => {
  res.json(bookingsExtracted);
});

app.listen(3001);
