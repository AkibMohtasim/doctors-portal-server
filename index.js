const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const AppointmentOption = require('./Models/AppointmentOption');
const Booking = require('./Models/Booking');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();




//middleware

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kfezusn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(() => {
    console.log('connected to database')
  })
  .catch(err => console.error(err.message));


app.get('/', async (req, res) => {
  res.send('doctors portal server is running');
})


// Appointment Options

app.get('/api/appointmentOptions', async (req, res) => {
  const date = req.query.date;

  const options = await AppointmentOption.find();
  const alreadyBooked = await Booking.find({ appointmentDate: date });


  //combining the two

  options.forEach(option => {
    const bookedTreatments = alreadyBooked.filter(book => book.treatment === option.name);
    const bookedSlots = bookedTreatments.map(book => book.slot);
    const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
    option.slots = remainingSlots;
  })

  res.send(options);
}) // incomplete


// Bookings

app.get('/api/bookings', async (req, res) => {
  const bookings = await Booking.find();

  res.send(bookings);
})

app.post('/api/bookings', async (req, res) => {
  const bookingData = req.body;
  console.log(bookingData);

  const query = {
    appointmentDate: bookingData.appointmentDate,
    email: bookingData.email,
    treatment: bookingData.treatment
  }

  const alreadyBooked = await Booking.find(query);

  if (alreadyBooked.length) {
    const message = `You already have a booking on ${bookingData.appointmentDate}`;
    return res.send({ acknoledged: false, message })
  }

  const newBooking = new Booking(bookingData);
  const result = await newBooking.save();
  res.send(result);
})


app.listen(port, () => {
  console.log('server running at port', port);
})