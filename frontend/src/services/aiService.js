import api from './api';

export const aiAssistantService = {
  sendMessage: (query, sessionContext = {}) => 
    api.post('/api/ai-assistant/', { query, session_context: sessionContext }),
};
