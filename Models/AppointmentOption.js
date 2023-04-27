const mongoose = require('mongoose');


const appointmentOptionSchema = new mongoose.Schema({
  name: String,
  price: Number,
  slots: [String]
},
  {
    collection: 'appointmentOptions'
  });


const AppointmentOption = mongoose.model('AppointmentOption', appointmentOptionSchema);


module.exports = AppointmentOption;
