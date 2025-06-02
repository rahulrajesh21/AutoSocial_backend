const sql = require('../config/database');
const { getAuth } = require('@clerk/express');
const createAutomation = async (req, res) => {
    try{

        const {id,automation} = req.body; 
        const { userId } = getAuth(req);
        console.log('id',id);

        const result = await sql`
           UPDATE automations
           SET automation_template = ${automation}
           WHERE id = ${id} AND user_id = ${userId}
           RETURNING *;
        `;
        if(result.length === 0) {
            return res.status(404).json({ message: 'Automation not found or not owned by user' });
        }
        console.log('Automation created:', result[0]);
        return res.status(201).json({
            message: 'Automation created successfully',
            data: result[0],
        });

    }catch(err){
        console.error('Error in createAutomation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = {
    createAutomation
};