const express = require('express');
const router = express.Router();
const { CreateWorkflowController, GetAllWorkflows, UpdateAutomationStatus, GetWorkflowById } = require('../controllers/WorkflowController');
const { createAutomation } = require('../controllers/AutomationController');
const { requireAuth } = require('@clerk/express');
const { getAllInstagramPosts } = require('../utils/instagramUtils');
const { getPostComments } = require('../utils/instagramUtils');
const {CreateScheduleAutomation} = require('../controllers/ScheduleAutomation');

router.post('/Createworkflow',  CreateWorkflowController);
router.get('/GetAllWorkflows',  GetAllWorkflows);
router.get('/GetWorkflowById/:id', GetWorkflowById);
router.post('/CreateAutomation', createAutomation);
router.get('/Getints',getAllInstagramPosts);
router.get('/getComments',getPostComments);
router.post('/UpdateAutomationStatus', UpdateAutomationStatus);
router.post('/CreateScheduleAutomation', CreateScheduleAutomation);

module.exports = router;
