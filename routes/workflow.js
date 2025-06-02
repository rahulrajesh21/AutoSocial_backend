const express = require('express');
const router = express.Router();
const { CreateWorkflowController, GetAllWorkflows } = require('../controllers/WorkflowController');
const { createAutomation } = require('../controllers/AutomationController');
const { requireAuth } = require('@clerk/express');



router.post('/Createworkflow',  CreateWorkflowController);
router.get('/GetAllWorkflows',  GetAllWorkflows);
router.post('/CreateAutomation', createAutomation);

module.exports = router;
