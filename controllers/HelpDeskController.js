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
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all tickets for this user
    const tickets = await sql`
      SELECT * FROM help_desk_tickets 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching help desk tickets:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

/**
 * Get a single help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTicketById = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { ticketId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await sql`
      SELECT * FROM help_desk_tickets 
      WHERE ticket_id = ${ticketId} AND user_id = ${userId}
    `;

    if (ticket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json({ success: true, ticket: ticket[0] });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
};

/**
 * Create a new help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTicket = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { issue_type, description, priority, email } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // Generate a unique ticket ID
    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
    
    // Insert the ticket into database
    const ticket = await sql`
      INSERT INTO help_desk_tickets (
        ticket_id,
        user_id,
        issue_type, 
        description, 
        priority, 
        email, 
        status,
        created_at
      ) VALUES (
        ${ticketId},
        ${userId}, 
        ${issue_type || 'General'}, 
        ${description}, 
        ${priority || 'Medium'}, 
        ${email || null}, 
        'new',
        NOW()
      ) RETURNING *
    `;
    
    return res.status(201).json({
      success: true,
      ticket: ticket[0]
    });
  } catch (error) {
    console.error('Error creating help desk ticket:', error);
    return res.status(500).json({ error: 'Failed to create help desk ticket' });
  }
};

/**
 * Update a help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTicket = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { ticketId } = req.params;
    const { status, assignee_id, resolution_notes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if ticket exists and belongs to user
    const existingTicket = await sql`
      SELECT * FROM help_desk_tickets 
      WHERE ticket_id = ${ticketId} AND user_id = ${userId}
    `;

    if (existingTicket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update based on which fields were provided
    let updatedTicket;
    
    // Add resolved_at timestamp if status is 'resolved'
    if (status === 'resolved') {
      updatedTicket = await sql`
        UPDATE help_desk_tickets
        SET status = ${status}, 
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE ticket_id = ${ticketId} AND user_id = ${userId}
        RETURNING *
      `;
    } 
    else if (status) {
      updatedTicket = await sql`
        UPDATE help_desk_tickets
        SET status = ${status}, 
            updated_at = NOW()
        WHERE ticket_id = ${ticketId} AND user_id = ${userId}
        RETURNING *
      `;
    }
    
    if (assignee_id) {
      updatedTicket = await sql`
        UPDATE help_desk_tickets
        SET assignee_id = ${assignee_id}, 
            updated_at = NOW()
        WHERE ticket_id = ${ticketId} AND user_id = ${userId}
        RETURNING *
      `;
    }
    
    if (resolution_notes) {
      updatedTicket = await sql`
        UPDATE help_desk_tickets
        SET resolution_notes = ${resolution_notes}, 
            updated_at = NOW()
        WHERE ticket_id = ${ticketId} AND user_id = ${userId}
        RETURNING *
      `;
    }

    // If no specific fields were updated, just update the timestamp
    if (!updatedTicket) {
      updatedTicket = await sql`
        UPDATE help_desk_tickets
        SET updated_at = NOW()
        WHERE ticket_id = ${ticketId} AND user_id = ${userId}
        RETURNING *
      `;
    }

    return res.json({ 
      success: true, 
      message: 'Ticket updated successfully', 
      ticket: updatedTicket[0] 
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
};

/**
 * Delete a help desk ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTicket = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { ticketId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if ticket exists and belongs to user
    const existingTicket = await sql`
      SELECT * FROM help_desk_tickets 
      WHERE ticket_id = ${ticketId} AND user_id = ${userId}
    `;

    if (existingTicket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Delete the ticket
    await sql`
      DELETE FROM help_desk_tickets 
      WHERE ticket_id = ${ticketId} AND user_id = ${userId}
    `;

    return res.json({ 
      success: true, 
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
}; 