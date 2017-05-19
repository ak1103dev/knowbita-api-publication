const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  instructor: { type: ObjectId, required: true, ref: 'Instructor' },
  tags: [String],
  uri: { type: String, required: true },
  hd_uri: { type: String, required: true },
  image: { type: String, required: true },
  created_at: { type: Date, required: true },
  num_views: { type: Number, required: true },
  is_course: { type: Boolean, default: false },
  course_id: { type: ObjectId, ref: 'Course' },
  index: Number,
  has_password: { type: Boolean, default: false },
  time_duration: { type: String, required: true },
  link: { type: String, required: true }
});

schema.plugin(deepPopulate);
module.exports = mongoose.model('Video', schema);
