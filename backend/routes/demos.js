const express = require('express');
const router = express.Router();
const demoService = require('../services/demoService');
const authenticateToken = require('../middlewares/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await demoService.getDemos(req.user);
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: 'Internal error' }); }
});

router.post('/', authenticateToken, async (req, res) => {
  const { lead_id, date, time } = req.body;
  try {
    const result = await demoService.createDemo(req.user.id, lead_id, date, time);
    res.json({ success: true, data: result });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message || 'Demo creation failed' }); 
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;
    try {
        const result = await demoService.updateDemo(req.user.id, id, date, time);
        if (!result) return res.status(404).json({ success: false, message: 'Demo not found' });
        res.json({ success: true, data: result });
    } catch (err) { res.status(500).json({ success: false, message: 'Internal error' }); }
});

router.put('/:id/convert', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, plan_value, duration } = req.body;
    try {
        const result = await demoService.convertDemo(req.user.id, id, status, plan_value, duration);
        res.json({ success: true, data: result });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message || 'Internal error' }); 
    }
});

router.put('/:id/feedback', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    try {
        const result = await demoService.updateFeedback(req.user.id, id, feedback);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Feedback update failed' });
    }
});

module.exports = router;
