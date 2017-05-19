const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  token: String,
  username: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AccessToken', schema);
