const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Chat with the AI chatbot
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Call your Python chatbot API
    const chatbotResponse = await axios.post(`${process.env.CHATBOT_API_URL}/chat`, {
      message: message,
      user_id: req.user.userId,
      session_id: sessionId || req.user.userId
    });

    res.json({
      response: chatbotResponse.data.response,
      sessionId: chatbotResponse.data.session_id || sessionId,
      confidence: chatbotResponse.data.confidence,
      suggestedActions: chatbotResponse.data.suggested_actions
    });

  } catch (error) {
    console.error('Chatbot API error:', error.message);
    
    // Fallback response if chatbot is unavailable
    res.json({
      response: "I'm sorry, I'm currently unavailable. Please try again later or contact a health worker for immediate assistance.",
      sessionId: req.body.sessionId || req.user.userId,
      confidence: 0,
      suggestedActions: ["Contact local health worker", "Visit nearest clinic"]
    });
  }
});

// Get disease information
router.get('/diseases/:diseaseName', auth, async (req, res) => {
  try {
    const { diseaseName } = req.params;
    
    const response = await axios.get(`${process.env.CHATBOT_API_URL}/disease/${diseaseName}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Disease info error:', error.message);
    res.status(404).json({ message: 'Disease information not found' });
  }
});

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.CHATBOT_API_URL}/history/${req.user.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Chat history error:', error.message);
    res.status(500).json({ message: 'Unable to retrieve chat history' });
  }
});

module.exports = router;
