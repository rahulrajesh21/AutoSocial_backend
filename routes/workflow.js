const express = require('express');
const router = express.Router();
const { CreateWorkflowController, GetAllWorkflows, UpdateAutomationStatus } = require('../controllers/WorkflowController');
const { createAutomation } = require('../controllers/AutomationController');
const { requireAuth } = require('@clerk/express');
const { getAllInstagramPosts } = require('../utils/instagramUtils');
const { getPostComments } = require('../utils/instagramUtils');

router.post('/Createworkflow',  CreateWorkflowController);
router.get('/GetAllWorkflows',  GetAllWorkflows);
router.post('/CreateAutomation', createAutomation);
router.get('/Getints',getAllInstagramPosts);
router.get('/getComments',getPostComments);
router.post('/UpdateAutomationStatus', UpdateAutomationStatus);

module.exports = router;
