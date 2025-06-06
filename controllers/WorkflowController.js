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

// Get a specific workflow by ID
const GetWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req);
    
    console.log(`Fetching workflow with ID: ${id} for user: ${userId}`);
    
    const result = await sql`
      SELECT automations.*
      FROM automations
      WHERE id = ${id} AND user_id = ${userId};
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: 'Workflow not found or not owned by user' });
    }
    
    console.log('Retrieved workflow:', result[0]);
    return res.status(200).json({
      message: 'Workflow retrieved successfully',
      data: result[0],
    });
  } catch (err) {
    console.error('Error in GetWorkflowById:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update automation status (active/inactive)
const UpdateAutomationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const { userId } = getAuth(req);
    
    // Validate inputs
    if (!id || status === undefined) {
      return res.status(400).json({ error: 'Automation ID and status are required' });
    }
    
    // Update the status in the database
    const result = await sql`
      UPDATE automations
      SET status = ${status}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, status`;
      
    if (result.length === 0) {
      return res.status(404).json({ message: 'Automation not found or not owned by user' });
    }
    
    console.log('Updated automation status:', result[0]);
    return res.status(200).json({
      message: 'Automation status updated successfully',
      data: result[0],
    });
  } catch (err) {
    console.error('Error in UpdateAutomationStatus:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { CreateWorkflowController, GetAllWorkflows, UpdateAutomationStatus, GetWorkflowById };