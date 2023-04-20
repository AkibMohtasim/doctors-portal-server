const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const AppointmentOption = require('./Models/AppointmentOption');
const Booking = require('./Models/Booking');
const User = require('./Models/User');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();




//middleware

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  console.log('token inside: ', req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized Access');
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kfezusn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(() => {
    console.log('connected to database')
  })
  .catch(err => console.error(err.message));


app.get('/', async (req, res) => {
  res.send('doctors portal server is running');
})


// -------------- Appointment Options --------------------

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
})


// ------------------ Bookings ----------------------

app.get('/api/bookings', verifyJWT, async (req, res) => {
  const email = req.query.email;
  const decodedEmail = req.decoded.email;

  if (email !== decodedEmail) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  const query = { email }
  const bookings = await Booking.find(query);
  res.send(bookings);
})

app.post('/api/bookings', async (req, res) => {
  const bookingData = req.body;

  const query = {
    appointmentDate: bookingData.appointmentDate,
    email: bookingData.email,
    treatment: bookingData.treatment
  }

  const alreadyBooked = await Booking.find(query);

  if (alreadyBooked.length) {
    const message = `You already have a booking on ${bookingData.treatment} in ${bookingData.appointmentDate}`;
    return res.send({ acknoledged: false, message })
  }

  const newBooking = new Booking(bookingData);
  const result = await newBooking.save();
  res.send(result);
})



// ------------------ User -------------------------

app.get('/api/jwt', async (req, res) => {
  const email = req.query.email;
  const user = await User.find({ email: email });

  if (user) {
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1hr' })
    return res.send({ accessToken: token })
  }
  // console.log(user);
  res.status(403).send({ accessToken: '' })
})


app.post('/api/users', async (req, res) => {
  const user = req.body;
  const newUser = new User(user);
  const result = await newUser.save();
  res.send(result);

})



app.listen(port, () => {
  console.log('server running at port', port);
})