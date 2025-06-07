const InstagramUtils = require('../utils/instagramUtils');
const sql = require('../config/database');
const { replyToComment, sendMessage, sendMedia } = require('../utils/instagramUtils');
const { gemini } = require('../utils/geminiUtils');

// Webhook automation processors
const automationProcessors = {
  'get-comments': async (changeData, automation) => {
    const mediaId = changeData.value.media.id;
    const username = changeData.value.from.username;
    const commentId = changeData.value.id;
    const commentText = changeData.value.text;
    const user_id = changeData.value.from.id;

    // Check if this matches the automation's media
    const commentAutomation = await sql`
      SELECT * FROM comment_automation 
      WHERE automation_id = ${automation.id} 
      AND media_id = ${mediaId}
    `;

    if (commentAutomation.length > 0) {
      // Don't reply to the post owner's own comments
      if (username !== commentAutomation[0].username) {
        return {
          shouldExecute: true,
          context: {
            commentId,
            commentText,
            username,
            mediaId,
            user_id,
            triggerType: 'comment'
          }
        };
      }
    }
    return { shouldExecute: false };
  },

  'receive-message': async (messagingData, automation) => {
    // Skip non-message events (read receipts, delivery confirmations, etc.)
    if (!messagingData.message || !messagingData.message.text) {
      console.log('Skipping non-text message event:', Object.keys(messagingData));
      return { shouldExecute: false };
    }

    // Handle direct message webhooksx
    const senderId = messagingData.sender.id || messagingData.value.from.id;
    const recipientId = messagingData.recipient.id;
    const messageText = messagingData.message.text || messagingData.value.text;
    const messageId = messagingData.message.mid ||  messagingData.value.id;
    const timestamp = messagingData.timestamp;

    console.log('Processing message:', { senderId, messageText, messageId });

    // Check if this automation should handle messages
    const messageAutomation = await sql`
      SELECT * FROM message_automation 
      WHERE automation_id = ${automation.id}
    `;

    if (messageAutomation.length > 0) {
      return {
        shouldExecute: true,
        context: {
          senderId,
          recipientId,
          messageText,
          messageId,
          timestamp,
          triggerType: 'message'
        }
      };
    }
    
    return { shouldExecute: false };
  }
};

// Helper function to identify message event types
const getMessageEventType = (messagingEvent) => {
  if (messagingEvent.message && messagingEvent.message.text) {
    return 'text_message';
  } else if (messagingEvent.message && messagingEvent.message.attachments) {
    return 'attachment_message';
  } else if (messagingEvent.read) {
    return 'read_receipt';
  } else if (messagingEvent.delivery) {
    return 'delivery_confirmation';
  } else if (messagingEvent.postback) {
    return 'postback';
  } else {
    return 'unknown';
  }
};

// Node execution handlers
const nodeExecutors = {
  'gemini': async (node, context) => {
    const prompt = node.data?.prompt || '';
    let processedPrompt = prompt;

    // Replace placeholders with actual data
    if (context.commentText) {
      processedPrompt = processedPrompt.replace(/\{\{comment\}\}/g, context.commentText);
    }
    if (context.messageText) {
      processedPrompt = processedPrompt.replace(/\{\{message\}\}/g, context.messageText);
    }
    if (context.username) {
      processedPrompt = processedPrompt.replace(/\{\{username\}\}/g, context.username);
    }
    if (context.senderId) {
      processedPrompt = processedPrompt.replace(/\{\{sender_id\}\}/g, context.senderId);
    }

    // Build a more comprehensive prompt with context
    let fullPrompt = processedPrompt;
    
    // Add user message as context if available
    if (context.triggerType === 'message' && context.messageText) {
      // If the prompt doesn't already contain the message, add it as context
      if (!prompt.includes('{{message}}')) {
        fullPrompt = `User message: "${context.messageText}"\n\nYour instructions: ${processedPrompt}`;
      }
    } else if (context.triggerType === 'comment' && context.commentText) {
      // If the prompt doesn't already contain the comment, add it as context
      if (!prompt.includes('{{comment}}')) {
        fullPrompt = `Instagram comment from ${context.username || 'user'}: "${context.commentText}"\n\nYour instructions: ${processedPrompt}`;
      }
    }

    console.log('Processing with Gemini:', fullPrompt);
    
    // Call the Gemini AI service
    const geminiResponse = await gemini(fullPrompt);
    
    return {
      success: !!geminiResponse,
      output: geminiResponse || 'Failed to get AI response',
      data: { aiResponse: geminiResponse }
    };
  },

  'instgram': async (node, context, previousOutput) => {
    const { selectedOption } = node.data;

    switch (selectedOption) {
      case 'send-message':
        if (context.senderId || context.username) {
          console.log("=======================",context)
          const targetId = context.senderId || context.user_id || context.username;
          const message = previousOutput?.data?.aiResponse || node.data?.message || 'Hello!';
          await sendMessage(targetId, message);
          return { success: true, output: `Message sent to ${targetId}` };
        }
        break;

      case 'send-media':
        if ((context.senderId || context.username) && node.data?.mediaUrl) {
          const targetId = context.senderId || context.username;
          await sendMedia(targetId, node.data.mediaUrl);
          return { success: true, output: `Media sent to ${targetId}` };
        }
        break;

      case 'reply-comment':
        if (context.commentId) {
          const replyText = previousOutput?.data?.aiResponse || node.data?.replyText || 'Thanks for your comment!';
          await replyToComment(context.commentId, replyText);
          return { success: true, output: `Reply sent to comment ${context.commentId}` };
        }
        break;

      default:
        return { success: false, output: `Unknown Instagram action: ${selectedOption}` };
    }

    return { success: false, output: 'Missing required context for Instagram action' };
  }
};

// Execute automation flow
const executeAutomationFlow = async (automation, context) => {
  const { automation_template } = automation;
  const { nodes, edges } = automation_template;

  console.log(`Executing automation flow for ID: ${automation.id}`);

  // Find the starting node (trigger node)
  const triggerNodes = nodes.filter(node => {
    const selectedOption = node.data?.selectedOption;
    return selectedOption && (
      selectedOption.includes('get-') || 
      selectedOption.includes('receive-')
    );
  });

  if (triggerNodes.length === 0) {
    console.log('No trigger node found in automation');
    return { success: false, message: 'No trigger node found' };
  }

  // Build execution path using edges
  const executionPath = buildExecutionPath(nodes, edges, triggerNodes[0].id);
  console.log('Execution path:', executionPath.map(n => `${n.id}(${n.type})`));

  let previousOutput = null;
  const executionResults = [];

  // Execute nodes in order
  for (const node of executionPath) {
    if (node.type === 'instgram' && node.data?.selectedOption?.includes('get-')) {
      // Skip trigger nodes in execution
      continue;
    }

    try {
      const executor = nodeExecutors[node.type];
      if (executor) {
        console.log(`Executing node ${node.id} of type ${node.type}`);
        const result = await executor(node, context, previousOutput);
        
        executionResults.push({
          nodeId: node.id,
          nodeType: node.type,
          result
        });

        previousOutput = result;
        console.log(`Node ${node.id} executed:`, result);
      } else {
        console.log(`No executor found for node type: ${node.type}`);
      }
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      executionResults.push({
        nodeId: node.id,
        nodeType: node.type,
        result: { success: false, error: error.message }
      });
    }
  }

  // Log execution to database
  await sql`
    INSERT INTO automation_executions (automation_id, context, results, executed_at)
    VALUES (${automation.id}, ${JSON.stringify(context)}, ${JSON.stringify(executionResults)}, NOW())
  `;

  return {
    success: true,
    message: 'Automation executed successfully',
    results: executionResults
  };
};

// Build execution path from flow graph
const buildExecutionPath = (nodes, edges, startNodeId) => {
  const visited = new Set();
  const path = [];
  
  const traverse = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      path.push(node);
      
      // Find connected nodes
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      outgoingEdges.forEach(edge => traverse(edge.target));
    }
  };
  
  traverse(startNodeId);
  return path;
};

// Main webhook handler
const getWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

    // Validate webhook structure
    if (!webhookData.entry || !Array.isArray(webhookData.entry)) {
      return res.status(400).json({ message: 'Invalid webhook format' });
    }

    const entry = webhookData.entry[0];
    
    // Check if it's a message webhook (has messaging array)
    const isMessageWebhook = entry.messaging && Array.isArray(entry.messaging);
    
    // Check if it's a comment webhook (has changes array)
    const isCommentWebhook = entry.changes && Array.isArray(entry.changes);

    if (!isMessageWebhook && !isCommentWebhook) {
      return res.status(400).json({ message: 'No valid webhook data found' });
    }

    // Get all active automations
    const automations = await sql`
      SELECT 
        a.id,
        a.automation_template,
        a.user_id,
        ca.media_id,
        ca.username,
        ma.trigger_type,
        ma.conditions
      FROM automations a
      LEFT JOIN comment_automation ca ON a.id = ca.automation_id
      LEFT JOIN message_automation ma ON a.id = ma.automation_id
      WHERE a.status = TRUE
    `;

    if (automations.length === 0) {
      return res.status(200).json({ 
        message: 'No active automations found - webhook processed' 
      });
    }

    let executedCount = 0;
    const executionResults = [];
    const skippedEvents = [];

    // Process message webhooks
    if (isMessageWebhook) {
      console.log('Processing message webhook');
      
      for (const messagingEvent of entry.messaging) {
        const eventType = getMessageEventType(messagingEvent);
        console.log(`Processing messaging event of type: ${eventType}`, messagingEvent);

        // Only process actual text messages
        if (eventType !== 'text_message') {
          console.log(`Skipping ${eventType} event`);
          skippedEvents.push({ type: eventType, reason: 'Not a text message' });
          continue;
        }

        // Check each automation for message triggers
        for (const automation of automations) {
          try {
            const processor = automationProcessors['receive-message'];
            if (processor) {
              const result = await processor(messagingEvent, automation);
              
              if (result.shouldExecute) {
                console.log(`Triggering message automation ${automation.id}`);
                const executionResult = await executeAutomationFlow(automation, result.context);
                executionResults.push({
                  automationId: automation.id,
                  result: executionResult
                });
                executedCount++;
              }
            }
          } catch (error) {
            console.error(`Error processing message automation ${automation.id}:`, error);
            executionResults.push({
              automationId: automation.id,
              result: { success: false, error: error.message }
            });
          }
        }
      }
    }

    // Process comment webhooks
    if (isCommentWebhook) {
      console.log('Processing comment webhook');
      
      for (const change of entry.changes) {
        console.log(`Processing change: ${change.field}`);

        if (change.field === 'comments') {
          // Check each automation for comment triggers
          for (const automation of automations) {
            try {
              const processor = automationProcessors['get-comments'];
              if (processor) {
                const result = await processor(change, automation);
                
                if (result.shouldExecute) {
                  console.log(`Triggering comment automation ${automation.id}`);
                  const executionResult = await executeAutomationFlow(automation, result.context);
                  executionResults.push({
                    automationId: automation.id,
                    result: executionResult
                  });
                  executedCount++;
                }
              }
            } catch (error) {
              console.error(`Error processing comment automation ${automation.id}:`, error);
              executionResults.push({
                automationId: automation.id,
                result: { success: false, error: error.message }
              });
            }
          }
        }
      }
    }

    return res.status(200).json({
      message: `Webhook processed successfully. ${executedCount} automations executed.`,
      executedCount,
      skippedEventsCount: skippedEvents.length,
      results: executionResults,
      skippedEvents: skippedEvents,
      webhookType: isMessageWebhook ? 'message' : 'comment'
    });

  } catch (error) {
    console.error('Error in webhook handler:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Verification endpoint for webhook setup
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify token (replace with your actual verify token)
  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'your_verify_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
};

module.exports = { 
  getWebhook,
  verifyWebhook,
  executeAutomationFlow,
  buildExecutionPath,
  getMessageEventType // Export for testing purposes
};