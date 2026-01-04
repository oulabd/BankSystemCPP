const mongoose = require('mongoose');
// إضافة حقول منمَّطة لتحسين البحث
const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  aliases: { type: [String], index: true },
  carbsPer100g: { type: Number, required: true },
  name_normalized: { type: String, index: true },
  aliases_normalized: { type: [String], index: true }
});
module.exports = mongoose.model('Food', FoodSchema);
