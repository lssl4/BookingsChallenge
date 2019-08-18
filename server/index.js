const express = require("express");
const cors = require("cors");
const multer = require("multer");
const upload = multer();
const fs = require("fs");
const csv = require("csv-parser");
const streamBuffers = require("stream-buffers");

const app = express();
app.use(cors()); // so that app can access
app.use(express.json());

const currentBookings = JSON.parse(
  fs.readFileSync("./server/bookings.json")
).map(bookingRecord => ({
  time: bookingRecord.time,
  duration: bookingRecord.duration,
  userId: bookingRecord.user_id
}));

var combinedBookings = {};

app.get("/bookings", (req, res) => {
  res.json(currentBookings);
});

app.post("/bookings", (req, res) => {
  res.json(currentBookings);
});

app.post("/upload", upload.single("csvFile"), (req, res, next) => {
  var csvBookings = [];

  var myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
    frequency: 10,
    chunkSize: 2048
  });

  myReadableStreamBuffer.put(req.file.buffer);
  myReadableStreamBuffer.stop();

  myReadableStreamBuffer
    .pipe(
      csv({
        mapHeaders: ({ header, index }) => header.trim(),
        mapValues: ({ header, index, value }) => value.trim()
      })
    )
    .on("data", data => csvBookings.push(data))
    .on("end", () => {
      combinedBookings = formatBookings(currentBookings, csvBookings, false);

      res.json(combinedBookings);
    });
});

app.listen(3001);
