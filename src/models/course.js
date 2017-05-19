const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  image: { type: String, required: true },
  instructor: { type: ObjectId, required: true, ref: 'Instructor' },
  tags: [String],
  num_videos: { type: Number, required: true },
  videos: [{type: ObjectId, ref: 'Video'}],
  has_password: { type: Boolean, default: false },
  link: { type: String, required: true }
});

schema.plugin(deepPopulate);
module.exports = mongoose.model('Course', schema);
