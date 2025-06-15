const express = require('express');
const router = express.Router();
const { getTickets, getTicketById, updateTicket, deleteTicket, createTicket } = require('../controllers/HelpDeskController');


// Apply authentication middleware to all routes


// Get all tickets
router.get('/tickets', getTickets);

// Get single ticket
router.get('/tickets/:ticketId', getTicketById);

// Create new ticket
router.post('/tickets', createTicket);

// Update ticket
router.put('/tickets/:ticketId', updateTicket);

// Delete ticket
router.delete('/tickets/:ticketId', deleteTicket);

module.exports = router; 