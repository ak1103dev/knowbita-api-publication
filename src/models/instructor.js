const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  name: String,
  email: String,
  image: String,
  num_videos: Number,
  num_courses: Number,
  department: String,
  faculty: String,
  link: String
});

module.exports = mongoose.model('Instructor', schema);
