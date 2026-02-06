const express = require('express');
const router = express.Router();
const controller = require('./llmHealthCheck.controller');

router.get('/best', controller.requestModel);

module.exports = router;
