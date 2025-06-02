const express = require('express');
const router = express.Router();
const { getAllItems, createItem } = require('../controllers/exampleController');
const { requireAuth } = require('../middlewares/clerkAuth');
const addUserDetails = require('../middlewares/Auth');

// Get all items from a table - Public route (no auth required)
router.get('/:table', getAllItems);

// Create a new item in a table - Protected route (auth required)
router.post('/:table', requireAuth, addUserDetails, createItem);

module.exports = router; 