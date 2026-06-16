import { Router } from 'express';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AIController } from '../modules/ai/controllers/AIController';
import { aiRateLimit } from '../modules/ai/middleware/AIRateLimiter';

const router = Router();

// Status & model discovery (no rate limit)
router.get('/status',            ErrorMiddleware.asyncHandler(AIController.status));

// AI Chat Assistant
router.post('/chat',             aiRateLimit('chat'),      ErrorMiddleware.asyncHandler(AIController.chat));

// Smart Report Generator
router.post('/report',           aiRateLimit('report'),    ErrorMiddleware.asyncHandler(AIController.generateReport));

// Meeting Summarizer
router.post('/summarize',        aiRateLimit('summarize'), ErrorMiddleware.asyncHandler(AIController.summarizeMeeting));

// Email Drafter
router.post('/email-draft',      aiRateLimit('email'),     ErrorMiddleware.asyncHandler(AIController.draftEmail));

// Task Suggestions
router.post('/task-suggestions', aiRateLimit('tasks'),     ErrorMiddleware.asyncHandler(AIController.taskSuggestions));

// Smart Reminders
router.post('/reminder',         aiRateLimit('reminder'),  ErrorMiddleware.asyncHandler(AIController.generateReminder));

// History endpoints
router.get('/conversations',                  ErrorMiddleware.asyncHandler(AIController.listConversations));
router.get('/conversations/:uuid',            ErrorMiddleware.asyncHandler(AIController.getConversation));
router.get('/meeting-summaries',              ErrorMiddleware.asyncHandler(AIController.listMeetingSummaries));
router.get('/reminders',                      ErrorMiddleware.asyncHandler(AIController.listReminders));

export default router;
