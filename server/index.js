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

const bookingsExtracted = {};

function formatBookings(bookingRecord, isOldRecord) {
  var entries = bookingsExtracted[Date.parse(bookingRecord.time)] || [];

  entries.push({
    userId: bookingRecord.user_id || bookingRecord.userId,
    duration: bookingRecord.duration * 60 * 1000, //mins into ms
    existing: isOldRecord
  });

  bookingsExtracted[Date.parse(bookingRecord.time)] = entries;
}

JSON.parse(fs.readFileSync("./server/bookings.json")).map(bookingRecord => {
  formatBookings(bookingRecord, true);
});

app.get("/bookings", (req, res) => {
  res.json(bookingsExtracted);
});

app.post("/bookings", upload.single("csvFile"), (req, res, next) => {
  const results = [];

  const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
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
    .on("data", data => results.push(data))
    .on("end", () => {
      results.map(bookingRecord => {
        formatBookings(bookingRecord, false);
      });

      res.json(bookingsExtracted);
    });
});

app.listen(3001);
