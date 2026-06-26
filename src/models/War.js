const mongoose = require('mongoose');

const warSchema = new mongoose.Schema({
    // Информация о войне/конфликте
    name: {
        type: String,
        required: true,
        enum: ['Великая Отечественная война', 'Локальные конфликты', 'СВО']
    },
    nameKey: {
        type: String,
        required: true,
        enum: ['wow', 'local', 'svo'],
        unique: true
    },
    order: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Фоновое изображение для кнопки
    buttonImagePath: {
        type: String,
        required: true
    },
    
    // Предметы, относящиеся к этой войне
    artifacts: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        // Rutube Video ID
        rutubeVideoId: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('War', warSchema);