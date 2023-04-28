const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({
  price: Number,
  transactionId: String,
  email: String,
  bookingId: String
},
  {
    collection: 'payments'
  });


const Payment = mongoose.model('Payment', paymentSchema);


module.exports = Payment;
