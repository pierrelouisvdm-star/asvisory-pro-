import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, User, Sparkles, Crown, MessageSquare,
  Lightbulb, X, Minimize2, Maximize2, Trash2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Auto-detect API URL
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.origin 
  : process.env.REACT_APP_BACKEND_URL;

const getHeaders = () => {
  const token = localStorage.getItem('advisorypro_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const AIAdvisorChat = ({ 
  isOpen, 
  onClose, 
  clientContext = null,
  embedded = false 
}) => {
  const { isAuthenticated } = useAuth();
  const { isPremium, isTrialing } = useSubscription();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickTip, setQuickTip] = useState(null);
  const messagesEndRef = useRef(null);

  const canUseAI = isPremium() || isTrialing();

  useEffect(() => {
    if (isOpen && !canUseAI) {
      fetchQuickTip();
    }
  }, [isOpen, canUseAI]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchQuickTip = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-advisor/quick-tip`);
      const data = await response.json();
      setQuickTip(data.tip);
    } catch (error) {
      console.error('Failed to fetch tip');
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai-advisor/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          client_context: clientContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const suggestedQuestions = [
    "What's the best way to start investing?",
    "How much should I save for retirement?",
    "Explain compound interest simply",
    "How do I reduce my tax liability?",
    "What insurance do I really need?",
  ];

  if (!isOpen) return null;

  // Upgrade prompt for non-premium users
  if (!canUseAI) {
    return (
      <div className={cn(
        "fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border overflow-hidden",
        embedded 
          ? "relative w-full h-full" 
          : "bottom-4 right-4 w-96"
      )}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
            <Crown className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Premium Feature</h3>
          <p className="text-slate-500 text-sm mb-4">
            Get personalized financial advice from our AI-powered advisor. 
            Available exclusively for Premium members.
          </p>
          
          {quickTip && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4 text-left">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
                <Lightbulb className="h-3 w-3" />
                Quick Tip
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">{quickTip}</p>
            </div>
          )}
          
          <Button className="w-full btn-premium" onClick={() => window.location.href = '/pricing'}>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border overflow-hidden flex flex-col",
      embedded 
        ? "relative w-full h-full" 
        : isMinimized 
          ? "bottom-4 right-4 w-72 h-14" 
          : "bottom-4 right-4 w-[420px] h-[600px]"
    )} data-testid="ai-advisor-chat">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white">
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold">AI Assistant</span>
          <Badge className="bg-white/20 text-white text-xs">GPT-5.2</Badge>
        </div>
        <div className="flex items-center gap-1">
          {!embedded && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
                  <MessageSquare className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2">How can I help you today?</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Ask me anything about personal finance, investments, or planning.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setInput(q);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%]",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-br-md" 
                        : "bg-slate-100 dark:bg-slate-800 rounded-bl-md"
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t bg-slate-50 dark:bg-slate-800/50 shrink-0">
            {messages.length > 0 && (
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={startNewChat}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Chat
                </Button>
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1"
                data-testid="ai-chat-input"
              />
              <Button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="ai-chat-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

// Floating chat button component
export const AIAdvisorButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          data-testid="ai-advisor-button"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
      <AIAdvisorChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
