const mongoose = require('mongoose');

const historicalArtifactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },    // путь к изображению карточки
  videoUrl: { type: String, required: true }, // ссылка на видео (Rutube)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HistoricalArtifact', historicalArtifactSchema);