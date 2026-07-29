const express = require('express');
const router = express.Router();

// Страница зала "Коллекция автографов"
router.get('/autograf-artifacts', (req, res) => {
    res.render('hall/autograf-hall', {
        layout: 'main',
        title: 'Коллекция автографов'
    });
});

module.exports = router;