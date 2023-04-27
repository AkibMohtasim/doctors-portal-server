const mongoose = require('mongoose');


const doctorSchema = new mongoose.Schema({
  name: String,
  email: String,
  speciality: String,
  image: String
},
  {
    collection: 'doctors'
  });


const Doctor = mongoose.model('Doctor', doctorSchema);


module.exports = Doctor;
