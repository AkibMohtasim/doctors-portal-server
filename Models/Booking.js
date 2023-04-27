const mongoose = require('mongoose');


const bookingSchema = new mongoose.Schema({
  appointmentDate: String,
  treatment: String,
  patient: String,
  slot: String,
  email: String,
  phone: String,
  price: Number
},
  {
    collection: 'bookings'
  });


const Booking = mongoose.model('Booking', bookingSchema);


module.exports = Booking;
