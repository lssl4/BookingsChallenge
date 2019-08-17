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
  { type: "string", id: "UserName" },
  { type: "string", id: "style", role: "style" },
  { type: "date", id: "Start" },
  { type: "date", id: "End" }
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onDrop = this.onDrop.bind(this);
  }

  formatData(dateBookings) {
    const rows = [];
    for (const [bookingDate, bookings] of Object.entries(dateBookings)) {
      for (const booking of bookings) {
        rows.push([
          "User " + booking.userId,
          booking.userId,
          booking.existing ? "#157EF9" : "#DC4C22",
          new Date(parseInt(bookingDate, 10)),
          new Date(parseInt(bookingDate, 10) + parseInt(booking.duration, 10))
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
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/csv");

    var formData = new FormData();
    formData.append("csvFile", files[0]);

    fetch(`${apiUrl}/bookings`, {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(bookings => {
        this.setState({ bookings: this.formatData(bookings) });
      });
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
            const startDate = booking[3];
            const duration = booking[4] - booking[3];
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
