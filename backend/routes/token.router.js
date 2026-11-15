import express from 'express';
import { authenticateJwtOnly } from '../middleware/authenticate.js';
import {
    createApiToken,
    listApiTokens,
    deleteApiToken,
} from '../controllers/token.controller.js';

const TokenRouter = express.Router();

// Create a new personal access token (returned once)
TokenRouter.post('/tokens', authenticateJwtOnly, createApiToken);

// List token names and dates (never the token itself)
TokenRouter.get('/tokens', authenticateJwtOnly, listApiTokens);

// Revoke a token
TokenRouter.delete('/tokens/:id', authenticateJwtOnly, deleteApiToken);

export default TokenRouter;