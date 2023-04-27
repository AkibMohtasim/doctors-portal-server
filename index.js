const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const AppointmentOption = require('./Models/AppointmentOption');
const Booking = require('./Models/Booking');
const User = require('./Models/User');
const Doctor = require('./Models/Doctor');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();


//middleware

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  // console.log('token inside: ', req.headers.authorization);
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


// NOTE: Make sure to use verifyAdmin after verifyJWT

async function verifyAdmin(req, res, next) {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await User.find(query);

  if (user?.role !== 'Admin') {
    return res.status(403).send({ message: 'forbidden access' })
  }
  next();
}



mongoose.set('strictQuery', true);

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

app.get('/api/appointmentSpeciality', async (req, res) => {
  const result = await AppointmentOption.find().select({ name: 1 });
  res.send(result);
})

// Temprorary to update price field on appointment options

// app.get('/api/addPrice', async (req, res) => {

//   try {
//     const updatedDoc = await AppointmentOption.updateMany({},
//       {
//         $set: {
//           price: 99
//         }
//       },
//       { upsert: true, new: true }
//     );

//     // const result = await updatedDoc.save();
//     res.send(updatedDoc);

//   } catch (error) {
//     console.error(error);
//     res.status(500).send(error.message);
//   }
// })



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


app.get('/api/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const booking = await Booking.findById(id);
  res.send(booking);
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


app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.send(users);
})


app.get('/api/users/admin/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email };
  const user = await User.findOne(query);
  // console.log({ isAdmin: user?.role === 'Admin' });
  res.send({ isAdmin: user?.role === 'Admin' });
})


app.post('/api/users', async (req, res) => {
  const user = req.body;
  const newUser = new User(user);
  const result = await newUser.save();
  res.send(result);

})

app.put('/api/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {

  const id = req.params.id;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          role: 'Admin'
        }
      },
      { upsert: true, new: true }
    );

    const result = await updatedUser.save();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }

})


// ---------- Doctor -----------------

app.get('/api/doctors', verifyJWT, verifyAdmin, async (req, res) => {
  const doctors = await Doctor.find();
  res.send(doctors);
})

app.post('/api/doctors', verifyJWT, verifyAdmin, async (req, res) => {
  const doctor = req.body;
  const newDoctor = new Doctor(doctor);
  const result = await newDoctor.save();
  res.send(result);
})


app.delete('/api/doctors/:id', verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const deletedDoctor = await Doctor.deleteOne({ _id: id })
  res.send(deletedDoctor);
})





app.listen(port, () => {
  console.log('server running at port', port);
})