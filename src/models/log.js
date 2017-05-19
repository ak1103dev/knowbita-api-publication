const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const { Schema } = mongoose;
const { Mixed } = Schema.Types;

const schema = new Schema({
  username: String,
  user_type: String,
  namespace: String,
  title: { type: String },
  data: Mixed,
  created_at: { type: Date, default: Date.now },
  useragent: Mixed,
  ip: String
});

schema.plugin(deepPopulate);
module.exports = mongoose.model('Log', schema);
