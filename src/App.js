import React, { Component } from "react";
import Dropzone from "react-dropzone";
import "./App.css";
import Chart from "react-google-charts";

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
    <a
      className="btn btn-primary"
      role="button"
      href="/submit"
      style={{ marginLeft: "10px", marginRight: "10px" }}
    >
      Submit
    </a>
  );
};

const columns = [
  { type: "string", id: "UserID" },
  { type: "date", id: "Start" },
  { type: "date", id: "End" }
];

class App extends Component {
  state = {};

  formatData(dateBookings) {
    const rows = [];
    for (const [bookingDate, bookings] of Object.entries(dateBookings)) {
      for (const booking of bookings) {
        rows.push([
          "User " + booking.userId,
          new Date(parseInt(bookingDate)),
          new Date(parseInt(bookingDate) + parseInt(booking.duration))
        ]);
      }
    }

    return rows;
  }

  componentWillMount() {
    fetch(`${apiUrl}/bookings`)
      .then(response => response.json())
      .then(bookings => {
        this.setState({ bookings: this.formatData(bookings) });
      });
  }

  onDrop(files) {
    console.log(files);
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
          {(this.state.bookings || []).map((booking, i) => {
            const startDate = booking[2];
            const duration = booking[3] - booking[2];
            return (
              <p key={i} className="App-booking">
                <span className="App-booking-time">{startDate.toString()}</span>
                <span className="App-booking-duration">
                  {duration.toFixed(1)}
                </span>
                <span className="App-booking-user">{booking[0]}</span>
              </p>
            );
          })}
          <br />
          <div id="chart_div">
            <Chart
              width={"100%"}
              height={"200px"}
              chartType="Timeline"
              loader={<div>Loading Chart</div>}
              data={[columns].concat(this.state.bookings || [])}
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
