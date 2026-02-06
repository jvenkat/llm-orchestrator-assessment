const service = require('./llmHealthCheck.service');

exports.requestModel = (req, res) => {
    const best = service.getBestModel();
    if (!best) return res.status(503).json({ error: 'No healthy models available' });
    res.json(best);
};

exports.reportFailure = (req, res) => {
    const { id } = req.params;
    // This calls the logic we built in the repository earlier
    service.reportModelFailure(id); 
    console.log(`⚠️ Manual failure reported for: ${id}`);
    res.status(204).send(); // No content, just confirmation
};