const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createAdmin() {
    try {
        await mongoose.connect('mongodb://localhost:27017/virtual_museum');
        
        const admin = new Admin({
            username: 'admin',
            password: 'admin123'
        });
        
        await admin.save();
        console.log('✅ Администратор создан!');
        console.log('Username: admin');
        console.log('Password: admin123');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

createAdmin();