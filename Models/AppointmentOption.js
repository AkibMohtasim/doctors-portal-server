const mongoose = require('mongoose');


const appointmentOptionSchema = new mongoose.Schema({
  name: String,
  slots: [String]
},
  {
    collection: 'appointmentOptions'
  });


const AppointmentOption = mongoose.model('AppointmentOption', appointmentOptionSchema);


module.exports = AppointmentOption;
