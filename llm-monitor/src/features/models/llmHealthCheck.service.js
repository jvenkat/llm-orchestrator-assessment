const axios = require('axios');
const repository = require('./llmHealthCheck.repository');

const runHealthCheck = async () => {
    const models = repository.getAllModels();

    for (const model of models) {
        // 1. Skip check if currently quarantined
        if (model.status === 'Quarantined' && Date.now() < model.quarantinedUntil) {
            console.log(`ℹ️ Skipping ${model.id} - Currently Quarantined`);
            continue;
        }

        const start = Date.now();
        try {
            let response;
            
            // OpenAI check
            if (model.id.includes('openai')) {
                response = await axios.get('https://api.openai.com/v1/models', {
                    timeout: 5000,
                    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
                });
            } 
            // Anthropic check
            // else if (model.id.includes('anthropic')) {
            //     response = await axios.post('https://api.anthropic.com/v1/messages', {
            //         model: "claude-3-haiku-20240307",
            //         max_tokens: 1,
            //         messages: [{ role: "user", content: "ping" }]
            //     }, {
            //         timeout: 5000,
            //         headers: { 
            //             'x-api-key': process.env.ANTHROPIC_API_KEY,
            //             'anthropic-version': '2023-06-01'
            //         }
            //     });
            // }

            // 2. Success Path: reset failure count and update latency
            console.log(`✅ ${model.id} check passed`);
            repository.updateModel(model.id, {
                status: 'Healthy',
                latency: Date.now() - start,
                lastChecked: new Date()
            });

        } catch (error) {
            // 3. Failure Path: handled by repository's internal failure counter
            const isRateLimited = error.response && error.response.status === 429;
            
            repository.updateModel(model.id, {
                status: isRateLimited ? 'Degraded' : 'Unhealthy',
                latency: -1,
                lastChecked: new Date()
            });
            console.error(`🚨 ${model.id} check failed: ${error.message}`);
        }
    }
};

// Periodic interval: Check every 2 minutes
setInterval(runHealthCheck, 120000);

module.exports = { 
    runHealthCheck, 
    getBestModel: repository.getBestHealthyModel 
};