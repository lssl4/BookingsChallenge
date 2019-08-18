import React, { Component } from "react";
import Dropzone from "react-dropzone";
import "./App.css";
import Chart from "react-google-charts";
import csv from "csv-parser";
import streamBuffers from "stream-buffers";

const apiUrl = "http://localhost:3001";

const columns = [
  { type: "string", id: "UserID" },
  { type: "string", id: "UserName" },
  { type: "string", id: "style", role: "style" },
  { type: "date", id: "Start" },
  { type: "date", id: "End" }
];

const ResetButton = props => {
  return (
    <a
      className="btn btn-primary"
      role="button"
      href="/bookings"
      style={{ marginLeft: "10px", marginRight: "10px" }}
    >
      Reset
    </a>
  );
};

class SubmitButton extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.submit = this.submit.bind(this);
  }

  submit() {
    fetch(`${apiUrl}/bookings`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.props.newRawBookings)
    });
  }

  render() {
    return (
      <a
        className="btn btn-primary"
        role="button"
        href="/bookings"
        style={{ marginLeft: "10px", marginRight: "10px" }}
        onClick={this.submit}
      >
        Submit
      </a>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { bookings: {}, rawBookings: [] };
    this.onDrop = this.onDrop.bind(this);
    this.formatBookings = this.formatBookings.bind(this);
  }

  formatBookingsForChart(formattedBookings) {
    const rows = [];
    for (const [bookingDate, bookings] of Object.entries(formattedBookings)) {
      for (const booking of bookings) {
        rows.push([
          "User " + booking.userId,
          "",
          booking.hasConflicts
            ? "#DC4C22"
            : booking.isCurrent
            ? "#157EF9"
            : "#2FD566",
          new Date(parseInt(bookingDate, 10)),
          new Date(parseInt(bookingDate, 10) + booking.duration)
        ]);
      }
    }

    return rows;
  }

  formatBookings(bookings, isCurrent) {
    var bookingRecordsCopy = this.state.bookings;
    var rawBookings = this.state.rawBookings;
    for (const booking of bookings) {
      const bookingRecordDate = Date.parse(booking.time);
      const bookingEntries = bookingRecordsCopy[bookingRecordDate] || [];

      bookingEntries.push({
        userId: booking.user_id || booking.userId,
        duration: booking.duration * 60 * 1000, // mins to ms
        isCurrent: isCurrent,
        hasConflicts: bookingEntries.length >= 1 ? true : false
      });

      if (bookingEntries.length == 1) {
        rawBookings.push(booking);
      }

      bookingRecordsCopy[bookingRecordDate] = bookingEntries;
    }

    return bookingRecordsCopy;
  }

  componentWillMount() {
    fetch(`${apiUrl}/bookings`)
      .then(response => response.json())
      .then(bookings => {
        this.setState({
          bookings: this.formatBookings(bookings, true)
        });
      });
  }

  onDrop(files) {
    var csvBookings = [];

    for (const file of files) {
      var fileReader = new FileReader();

      fileReader.setState = this.setState.bind(this);
      fileReader.formatBookings = this.formatBookings.bind(this);

      fileReader.onload = function(e) {
        var buffer = fileReader.result;

        var myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
          frequency: 10,
          chunkSize: 2048
        });

        myReadableStreamBuffer.setState = this.setState.bind(this);
        myReadableStreamBuffer.formatBookings = this.formatBookings.bind(this);

        myReadableStreamBuffer.put(Buffer.from(buffer));
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
            this.setState({
              bookings: this.formatBookings(csvBookings, false)
            });
          });
      };

      fileReader.readAsArrayBuffer(file.slice());
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <Dropzone accept=".csv" onDrop={this.onDrop}>
            Drag files here
          </Dropzone>
        </div>
        <div className="App-main">
          <p>Existing bookings:</p>
          <br />
          <div id="chart_div">
            <Chart
              width={"100%"}
              height={"200px"}
              chartType="Timeline"
              loader={<div>Loading Chart</div>}
              data={[columns].concat(
                this.formatBookingsForChart(this.state.bookings || {})
              )}
            />
          </div>
          <div>
            <ResetButton />
            <SubmitButton newRawBookings={this.state.rawBookings} />
          </div>
          <div />
        </div>
      </div>
    );
  }
}

export default App;
