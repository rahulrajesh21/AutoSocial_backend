const express = require('express');
const router = express.Router();
const HelpDeskController = require('../controllers/HelpDeskController');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Help Desk routes
router.get('/help-desk/tickets', ClerkExpressRequireAuth(), HelpDeskController.getTickets);
router.get('/help-desk/tickets/:ticketId', ClerkExpressRequireAuth(), HelpDeskController.getTicketById);
router.put('/help-desk/tickets/:ticketId', ClerkExpressRequireAuth(), HelpDeskController.updateTicket);
router.delete('/help-desk/tickets/:ticketId', ClerkExpressRequireAuth(), HelpDeskController.deleteTicket);

module.exports = router; 