const mongoose = require('mongoose');

const historicalArtifactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  videoUrl: { type: String, required: true },
  imagePath: { type: String, required: true }, // путь к изображению карточки
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HistoricalArtifact', historicalArtifactSchema);