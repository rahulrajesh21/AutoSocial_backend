const sql = require('../config/database');
const { getAuth } = require('@clerk/express');
const { gemini } = require('../utils/geminiUtils');

/**
 * Get all help desk tickets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTickets = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = sql`
      SELECT * FROM help_desk_tickets 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    if (status) {
      query = sql`
        SELECT * FROM help_desk_tickets 
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
    
    const tickets = await query;
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching help desk tickets:', error);
    res.status(500).json({ error: 'Failed to fetch help desk tickets' });
  }
};

/**
 * Get a single help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await sql`
      SELECT * FROM help_desk_tickets 
      WHERE id = ${id}
    `;
    
    if (ticket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.status(200).json({
      success: true,
      data: ticket[0]
    });
  } catch (error) {
    console.error('Error fetching help desk ticket:', error);
    res.status(500).json({ error: 'Failed to fetch help desk ticket' });
  }
};

/**
 * Create a new help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTicket = async (req, res) => {
  try {
    const { issueType, description, priority, email } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // Process with Gemini
    let helpDeskPrompt = `Process the following help desk ticket:\n\n`;
    
    if (issueType) helpDeskPrompt += `Issue Type: ${issueType}\n`;
    if (priority) helpDeskPrompt += `Priority: ${priority}\n`;
    if (email) helpDeskPrompt += `Contact Email: ${email}\n`;
    if (description) helpDeskPrompt += `Description: ${description}\n`;
    
    helpDeskPrompt += `\nPlease analyze this help desk ticket and provide a suggested response.`;
    
    // Call Gemini to process the help desk request
    const aiResponse = await gemini(helpDeskPrompt);
    
    const ticket = await sql`
      INSERT INTO help_desk_tickets (
        issue_type, 
        description, 
        priority, 
        email, 
        ai_response, 
        status,
        created_at
      ) VALUES (
        ${issueType || 'General'}, 
        ${description}, 
        ${priority || 'Medium'}, 
        ${email || null}, 
        ${aiResponse || null},
        'new',
        NOW()
      ) RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      data: ticket[0]
    });
  } catch (error) {
    console.error('Error creating help desk ticket:', error);
    res.status(500).json({ error: 'Failed to create help desk ticket' });
  }
};

/**
 * Update a help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const ticket = await sql`
      UPDATE help_desk_tickets
      SET 
        status = ${status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (ticket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.status(200).json({
      success: true,
      data: ticket[0]
    });
  } catch (error) {
    console.error('Error updating help desk ticket:', error);
    res.status(500).json({ error: 'Failed to update help desk ticket' });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket
}; 