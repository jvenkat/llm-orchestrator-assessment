require('dotenv').config();

const express = require('express');
const modelRoutes = require('./src/features/models/llmHealthCheck.routes');
const { runHealthCheck } = require('./src/features/models/llmHealthCheck.service');

const app = express();
app.use(express.json());

// Register Feature Routes
app.use('/api/models', modelRoutes);

// Initial health check on boot
runHealthCheck();

app.listen(3000, () => console.log('🚀 Orchestrator on :3000'));
