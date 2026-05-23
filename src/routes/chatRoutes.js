const express = require('express');
const Joi = require('joi');
const chatController = require('../controllers/chatController');

const router = express.Router();

const chatSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000).messages({
    'string.empty': 'Message cannot be empty',
    'string.max': 'Message is too long (max 2000 characters)',
    'any.required': 'Message is required',
  }),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required().max(4000),
      })
    )
    .max(20)
    .default([]),
});

router.post('/', (req, res, next) => {
  const { error, value } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  req.body = value;
  next();
}, chatController.chat);

module.exports = router;
