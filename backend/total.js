const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const totalSchema = new Schema({
  total: {type: Number},
  url: {type: String}
});

module.exports = mongoose.model("totalSchema",totalSchema); 