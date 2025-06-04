const sql = require('../config/database');
const { getAuth } = require('@clerk/express');


const revieveComment = async (username, mediaId, automationId) => {
    try {
        const result = await sql`
            INSERT INTO comment_automation (automation_id, username, media_id)
            VALUES (${automationId}, ${username}, ${mediaId})
            RETURNING *;
        `;
        console.log('Comment automation created:', result[0]);
        return result[0];
    } catch (error) {
        console.error('Error in revieveComment:', error);
        throw error;
    }
};

const createAutomation = async (req, res) => {
    try {
        const { id, flowData } = req.body; 
        const { userId } = getAuth(req);

        console.log(id, flowData);

        // 1. Save the flowData in automations table
        const result = await sql`
            UPDATE automations
            SET automation_template = ${flowData}
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *;
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: 'Automation not found or not owned by user' });
        }

        // 2. Check if flowData contains "get-comments" and extract post data
        let username = null;
        let mediaId = null;
        
        // Find nodes with get-comments option that have selectedPost data
        const commentNodes = flowData.nodes.filter(
            node => node.data?.selectedOption === "get-comments" && node.data?.selectedPost
        );
        
        if (commentNodes.length > 0) {
            // Use the first node with get-comments that has post data
            const node = commentNodes[0];
            username = node.data.selectedPost?.username || 'default_user';
            mediaId = node.data.selectedPost?.mediaId || node.data.selectedPost?.id;
            
            console.log('Found comment node with post data:', { username, mediaId });
            
            // 3. If we have valid data, insert into comment_automation table
            if (username && mediaId) {
                const automationId = result[0].id;
                await revieveComment(username, mediaId, automationId);
            }
        }

        return res.status(201).json({
            message: 'Automation created successfully',
            data: result[0],
        });

    } catch (err) {
        console.error('Error in createAutomation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {
    createAutomation
};