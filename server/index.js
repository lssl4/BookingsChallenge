const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors()); // so that app can access
app.use(express.json());

var currentBookings = JSON.parse(fs.readFileSync("./server/bookings.json")).map(
  bookingRecord => ({
    time: bookingRecord.time,
    duration: bookingRecord.duration,
    userId: bookingRecord.user_id
  })
);

app.get("/bookings", (req, res) => {
  res.json(currentBookings);
});

app.post("/bookings", (req, res) => {
  currentBookings = req.body;
  res.redirect("/bookings");
});

app.listen(3001);
