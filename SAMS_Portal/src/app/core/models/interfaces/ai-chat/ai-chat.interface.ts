export interface AIChatRequest {
  message: string;
  sessionId?: string;
  contextType?: string;
  includeLiveData?: boolean;
}
 
export interface AIChatResponse {
  sessionId: string;
  messageId: number;
  reply: string;
  tokensUsed: number;
  timestamp: string;
  isNew: boolean;
  sessionTitle: string;
}
 
export interface AIChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError: boolean;
}
 
export interface AIChatSession {
  id: number;
  sessionId: string;
  title: string;
  isPinned: boolean;
  createdDate: string;
  modifiedDate: string;
  messageCount: number;
  lastMessage?: string;
}
 
export interface AISessionDetail {
  session: AIChatSession;
  messages: AIChatMessage[];
}
 
export interface AIUsageStats {
  todayRequests: number;
  todayTokens: number;
  totalSessions: number;
  totalMessages: number;
  remainingDailyTokens: number;
  dailyTokenLimit: number;
}