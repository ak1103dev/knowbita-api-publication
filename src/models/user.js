const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  username: String,
  last_login_at: Date,
  is_instructor: Boolean
});

module.exports = mongoose.model('User', schema);
