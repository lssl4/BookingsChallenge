import React, { Component } from "react";
import Dropzone from "react-dropzone";
import "./App.css";
import Chart from "react-google-charts";
import csv from "csv-parser";
import streamBuffers from "stream-buffers";

const apiUrl = "http://localhost:3001";

const ResetButton = props => {
  return (
    <a
      className="btn btn-primary"
      role="button"
      href="/reset"
      style={{ marginLeft: "10px", marginRight: "10px" }}
    >
      Reset
    </a>
  );
};

const SubmitButton = props => {
  return (
    /*<form method="post" action="/bookings">
      <input type="hidden" name="bookings" value="extra_submit_value">
      <button type="submit" name="submit_param" value="submit_value" class="link-button">
        This is a link that sends a POST request
      </button>
    </form>*/

    <a
      className="btn btn-primary"
      role="button"
      href="/bookings"
      style={{ marginLeft: "10px", marginRight: "10px" }}
    >
      Submit
    </a>
  );
};

const columns = [
  { type: "string", id: "UserID" },
  { type: "string", id: "UserName" },
  { type: "string", id: "style", role: "style" },
  { type: "date", id: "Start" },
  { type: "date", id: "End" }
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { bookings: {} };
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
    for (const booking of bookings) {
      const bookingRecordDate = Date.parse(booking.time);
      const bookingEntries = bookingRecordsCopy[bookingRecordDate] || [];

      bookingEntries.push({
        userId: booking.user_id || booking.userId,
        duration: booking.duration * 60 * 1000, // mins to ms
        isCurrent: isCurrent,
        hasConflicts: false
      });

      if (bookingEntries.length > 1) {
        bookingEntries.forEach((item, index) => {
          item.hasConflicts = true;
        });
      }

      bookingRecordsCopy[bookingRecordDate] = bookingEntries;
    }

    return bookingRecordsCopy;
  }

  componentWillMount() {
    fetch(`${apiUrl}/bookings`)
      .then(response => response.json())
      .then(bookings => {
        this.setState({ bookings: this.formatBookings(bookings, true) });
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
          {/*(this.state.bookings || {}).map((booking, i) => {
            const startDate = booking.time;
            const duration = booking.duration;
            return (
              <p key={i} className="App-booking">
                <span className="App-booking-time">{startDate.toString()}</span>
                <span className="App-booking-duration">
                  {duration.toFixed(1)}
                </span>
                <span className="App-booking-user">{booking.userID}</span>
              </p>
            );
          })*/}
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
            <SubmitButton />
          </div>
          <div />
        </div>
      </div>
    );
  }
}

export default App;
