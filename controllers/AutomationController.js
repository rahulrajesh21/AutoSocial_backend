const sql = require('../config/database');
const { getAuth } = require('@clerk/express');

// Dynamic automation handlers for different trigger types
const automationHandlers = {
  'get-comments': async (automationId, nodeData, userId) => {
    const { username, mediaId } = nodeData.selectedPost || {};
    console.log('get-comments', username, mediaId, 'userId:', userId);
    if (username && mediaId) {
      return await sql`
        INSERT INTO comment_automation (automation_id, username, media_id)
        VALUES (${automationId}, ${username}, ${mediaId})
        RETURNING *;
      `;
    }
    return null;
  },

  'receive-message': async (automationId, nodeData, userId) => {
    // For receive-message, we might want to store trigger conditions
    console.log('receive-message node data:', nodeData, 'userId:', userId);
    return await sql`
      INSERT INTO message_automation (automation_id, trigger_type, conditions,username)
      VALUES (${automationId}, 'receive-message', ${JSON.stringify(nodeData)},${userId})
      RETURNING *;
    `;
  },

  'send-message': async (automationId, nodeData, userId) => {
    // For send-message, we might want to store the message template
    return await sql`
      INSERT INTO action_automation (automation_id, action_type, action_data)
      VALUES (${automationId}, 'send-message', ${JSON.stringify(nodeData)})
      RETURNING *;
    `;
  },

  'send-media': async (automationId, nodeData, userId) => {
    return await sql`
      INSERT INTO action_automation (automation_id, action_type, action_data)
      VALUES (${automationId}, 'send-media', ${JSON.stringify(nodeData)})
      RETURNING *;
    `;
  },
  
  'helpDesk': async (automationId, nodeData, userId) => {
    return await sql`
     INSERT INTO action_automation (automation_id, action_type, action_data)
      VALUES (${automationId}, 'helpDesk', ${JSON.stringify(nodeData)})
      RETURNING *;
    `;
  },
  
  'trigger': async (automationId, nodeData, userId) => {
    return await sql`
      INSERT INTO action_automation (automation_id, action_type, action_data)
      VALUES (${automationId}, 'trigger', ${JSON.stringify(nodeData)})
      RETURNING *;
    `;
  },
  
  'text': async (automationId, nodeData, userId) => {
    return await sql`
      INSERT INTO action_automation (automation_id, action_type, action_data)
      VALUES (${automationId}, 'text', ${JSON.stringify(nodeData)})
      RETURNING *;
    `;
  }
};

// Generic function to process automation nodes
const processAutomationNodes = async (automationId, flowData, userId) => {
  const results = [];
  console.log('Processing automation nodes with userId:', userId);
  
  // Find all trigger nodes (nodes that start the automation)
  const triggerNodes = flowData.nodes.filter(node => {
    const selectedOption = node.data?.selectedOption;
    // Check for nodes with selectedOption, type 'helpDesk' or type 'trigger'
    return (selectedOption && automationHandlers[selectedOption]) || 
           (node.type === 'helpDesk' && automationHandlers['helpDesk']) ||
           (node.type === 'trigger' && automationHandlers['trigger']);
  });

  // Process each trigger node
  for (const node of triggerNodes) {
    // Handle different types of nodes
    const handlerKey = node.data?.selectedOption || 
                       (node.type === 'helpDesk' ? 'helpDesk' : null) ||
                       (node.type === 'trigger' ? 'trigger' : null);
                       
    const handler = handlerKey ? automationHandlers[handlerKey] : null;
    
    if (handler) {
      try {
        // Pass userId as the third parameter to the handler
        const result = await handler(automationId, node.data, userId);
        if (result) {
          results.push({
            nodeId: node.id,
            type: handlerKey,
            result: result[0] || result
          });
        }
      } catch (error) {
        console.error(`Error processing ${handlerKey} node:`, error);
        results.push({
          nodeId: node.id,
          type: handlerKey,
          error: error.message
        });
      }
    }
  }

  return results;
};

// Enhanced function to analyze flow structure
const analyzeFlowStructure = (flowData) => {
  const analysis = {
    triggers: [],
    actions: [],
    processors: [],
    connections: []
  };

  // Categorize nodes
  flowData.nodes.forEach(node => {
    const { type, data } = node;
    const selectedOption = data?.selectedOption;

    if (type === 'instgram') {
      if (selectedOption?.includes('receive') || selectedOption?.includes('get')) {
        analysis.triggers.push({
          id: node.id,
          type: selectedOption,
          data: data
        });
      } else if (selectedOption?.includes('send')) {
        analysis.actions.push({
          id: node.id,
          type: selectedOption,
          data: data
        });
      }
    } else if (type === 'gemini') {
      analysis.processors.push({
        id: node.id,
        type: 'gemini',
        data: data
      });
    } else if (type === 'helpDesk') {
      analysis.processors.push({
        id: node.id,
        type: "helpDesk",
        data: data
      });
    } else if (type === 'trigger') {
      analysis.triggers.push({
        id: node.id,
        type: 'trigger',
        data: data
      });
    } else if (type === 'text') {
      analysis.processors.push({
        id: node.id,
        type: 'text',
        data: data
      });
    }
  });

  // Analyze connections
  flowData.edges.forEach(edge => {
    analysis.connections.push({
      from: edge.source,
      to: edge.target,
      animated: edge.animated
    });
  });

  return analysis;
};

const createAutomation = async (req, res) => {
  try {
    const { id, flowData } = req.body;
    const { userId } = getAuth(req);
    
    console.log('Processing automation:', { id, userId });

    // 1. Save the flowData in automations table
    const result = await sql`
      UPDATE automations
      SET automation_template = ${flowData}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.length === 0) {
      return res.status(404).json({ 
        message: 'Automation not found or not owned by user' 
      });
    }

    const automationId = result[0].id;

    // 2. Analyze flow structure
    const flowAnalysis = analyzeFlowStructure(flowData);
    console.log('Flow analysis:', flowAnalysis);

    // 3. Process automation nodes dynamically
    const processingResults = await processAutomationNodes(automationId, flowData, userId);
    console.log('Processing results:', processingResults);
    // 4. Save metadata about the automation
    await sql`
      INSERT INTO automation_metadata (automation_id, flow_analysis, processing_results)
      VALUES (${automationId}, ${JSON.stringify(flowAnalysis)}, ${JSON.stringify(processingResults)})
      ON CONFLICT (automation_id) 
      DO UPDATE SET 
        flow_analysis = ${JSON.stringify(flowAnalysis)},
        processing_results = ${JSON.stringify(processingResults)},
        updated_at = NOW();
    `;

    return res.status(201).json({
      message: 'Automation created successfully',
      data: result[0],
      flowAnalysis,
      processingResults
    });

  } catch (err) {
    console.error('Error in createAutomation:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Webhook handler for processing incoming events
const handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Find matching automations based on the webhook type
    const automations = await sql`
      SELECT a.*, am.flow_analysis 
      FROM automations a
      JOIN automation_metadata am ON a.id = am.automation_id
      WHERE a.status = 'active';
    `;

    for (const automation of automations) {
      const flowAnalysis = automation.flow_analysis;
      
      // Check if this automation should be triggered by this webhook
      const shouldTrigger = checkTriggerConditions(webhookData, flowAnalysis);
      
      if (shouldTrigger) {
        await executeAutomation(automation, webhookData);
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to check if automation should be triggered
const checkTriggerConditions = (webhookData, flowAnalysis) => {
  // Implement logic to match webhook data with automation triggers
  // This is a simplified example
  if (webhookData.object === 'instagram' && webhookData.entry) {
    const changes = webhookData.entry[0]?.changes || [];
    const commentChange = changes.find(change => change.field === 'comments');
    
    if (commentChange && flowAnalysis.triggers.some(t => t.type === 'get-comments')) {
      return true;
    }
  }
  
  return false;
};

// Helper function to execute automation
const executeAutomation = async (automation, webhookData) => {
  console.log(`Executing automation ${automation.id} for webhook:`, webhookData);
  // Implement automation execution logic based on the flow
  // This would involve processing the nodes in the correct order
  // based on the edges and executing the appropriate actions
};

module.exports = {
  createAutomation,
  handleWebhook,
  processAutomationNodes,
  analyzeFlowStructure
};