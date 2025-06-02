const { fetchData, insertData } = require('../utils/supabaseUtils');
const supabase = require('../config/database');
const sql = require('../config/database');
const { getAuth } = require('@clerk/express');
CreateWorkflowController = async (req, res) => {
  try {
    const { name, description } = req.body;

     const { userId } = getAuth(req)
     console.log('User ID:', userId);

    const userExists = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if(userExists.length === 0) {
      await sql`
        insert into users (id) values (${userId})`
    }
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    const result = await sql`
      INSERT INTO automations (name, description, user_id)
      VALUES (${name}, ${description}, ${userId})
      RETURNING *`;
    console.log('Workflow created:', result[0]);
    return res.status(201).json({
      message: 'Workflow created successfully',
      data: result[0],
    });
  } catch (err) {
    console.error('Error in CreateWorkflowController:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


const GetAllWorkflows = async (req, res) => {
  try {
    
    const { userId } = getAuth(req);
    console.log(userId)
    console.log("called")
    const result = await sql`
      SELECT automations.*
      FROM automations
      JOIN users ON automations.user_id = users.id
      WHERE users.id = ${userId};
      `;

    if (result.length === 0) {
      return res.status(404).json({ message: 'No workflows found for this user' });
    }
    console.log('Retrieved workflows:', result);
    return res.status(200).json({
      message: 'Workflows retrieved successfully',
      data: result,
    });
  } catch (err) {
    console.error('Error in getAllWorkflows:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { CreateWorkflowController, GetAllWorkflows };