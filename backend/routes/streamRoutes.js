const express = require('express');
const { createStream, getStreams } = require('../controllers/streamController');

const router = express.Router();

router.post('/', createStream);
router.get('/', getStreams);

module.exports = router;
