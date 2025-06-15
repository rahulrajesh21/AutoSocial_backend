const express = require('express');
const router = express.Router();
const { getTickets, getTicket, createTicket, updateTicket } = require('../controllers/HelpDeskController');


// Apply authentication middleware to all routes


// Get all tickets
router.get('/', getTickets);

// Get single ticket
router.get('/:id', getTicket);

// Create new ticket
router.post('/', createTicket);

// Update ticket
router.put('/:id', updateTicket);

module.exports = router; 