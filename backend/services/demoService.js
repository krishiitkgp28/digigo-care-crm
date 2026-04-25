const demoRepo = require('../repositories/demoRepo');
const leadRepo = require('../repositories/leadRepo');
const activityRepo = require('../repositories/activityRepo');
const { runTransaction } = require('../config/db');

module.exports = {
  getDemos: async (user) => {
    if (user.role === 'admin') {
      return await demoRepo.findAll();
    } else {
      return await demoRepo.findByIntern(user.id);
    }
  },
  
  createDemo: async (intern_id, lead_id, date, time) => {
    // FIX 10: Mandatory Debugging
    console.log("Creating demo:", {
      lead_id,
      intern_id,
      date,
      time
    });

    const leadCheck = await leadRepo.findById(lead_id);
    if (!leadCheck) {
      throw new Error('Lead not found');
    }

    // FIX 7: Backend Validation
    const existing = await demoRepo.findByLeadAndIntern(lead_id, intern_id);
    if (existing) {
      throw new Error("Demo already scheduled for this lead");
    }
    
    return await runTransaction(async (client) => {
      const demo = await demoRepo.create({ lead_id, intern_id, date, time }, client);
      await client.query('UPDATE leads SET status = $1 WHERE id = $2', ['Demo Scheduled', lead_id]);
      await activityRepo.log(intern_id, 'Demo Scheduled', `Scheduled demo for lead ${lead_id}`, client);
      return demo;
    });
  },
  
  updateDemo: async (userId, id, date, time) => {
    const result = await demoRepo.update(id, { date, time });
    if (result) {
      await activityRepo.log(userId, 'Demo Updated', `Updated demo ${id} to ${date} ${time}`);
    }
    return result;
  },
  
  convertDemo: async (userId, id, status, plan_value, duration) => {
    const demo = await demoRepo.findById(id);
    if (!demo) throw new Error('Demo not found');
    
    const lead_id = demo.lead_id;
    if (!lead_id) throw new Error('Lead not found for this demo');

    return await runTransaction(async (client) => {
      const leadRes = await client.query(
          'UPDATE leads SET status = $1, plan_value = $2, duration = $3 WHERE id = $4 RETURNING *',
          [status, plan_value, duration, lead_id]
      );
      
      if (leadRes.rows.length === 0) throw new Error('Lead update failed');
      
      const demoRes = await client.query('UPDATE demos SET status = $1 WHERE id = $2 RETURNING *', ['Completed', id]);
      await activityRepo.log(userId, 'Demo Converted', `Converted demo ${id} to ${status}`, client);
      
      return { lead: leadRes.rows[0], demo: demoRes.rows[0] };
    });
  },
  
  updateFeedback: async (userId, id, feedback) => {
    const result = await demoRepo.updateFeedback(id, feedback);
    if (result) {
      await activityRepo.log(userId, 'Demo Feedback', `Added feedback for demo ${id}`);
    }
    return result;
  }
};
