// src/features/llmHealthCheck.repository.js
const mockResponses = [
    { status: 'Healthy', latency: 250 },
    { status: 'Healthy', latency: 1800 }, // Simulated slow response
    { status: 'Unhealthy', latency: -1 },  // Simulated timeout
];

const modelState = [
    { id: 'openai-gpt4', name: 'GPT-4', status: 'Healthy', latency: 0 },
    { id: 'anthropic-claude', name: 'Claude 3', status: 'Healthy', latency: 0 }
];

module.exports = {
    getAllModels: () => modelState,
    
    // New: Generates a random state to simulate real-world instability
    getRandomMockStatus: () => {
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    },

    updateModel: (id, updates) => {
        const index = modelState.findIndex(m => m.id === id);
        if (index !== -1) modelState[index] = { ...modelState[index], ...updates };
    },
    getBestHealthyModel: () => {
        const models = modelState; // Your in-memory array
        
        // 1. Filter for only healthy models
        const healthyOnes = models.filter(m => m.status === 'Healthy');

        if (healthyOnes.length === 0) return null;

        // 2. Sort by lowest latency
        return healthyOnes.sort((a, b) => a.latency - b.latency)[0];
    }
};