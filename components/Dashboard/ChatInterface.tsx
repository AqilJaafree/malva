'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, BarChart3, TrendingUp, Coins, PieChart, Lightbulb } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  onMessageSent: () => void;
  onBotResponseComplete: () => void;
  onToggleAnalytics: () => void;
  isExpanded: boolean;
  showAnalyticsButton: boolean;
}

const starterPrompts = [
  {
    icon: TrendingUp,
    title: "Market Analysis",
    prompt: "What are the top performing crypto assets this week?"
  },
  {
    icon: Coins,
    title: "Staking Rewards",
    prompt: "Compare staking rates across different networks"
  },
  {
    icon: PieChart,
    title: "Portfolio Review",
    prompt: "Analyze my portfolio and suggest optimizations"
  },
  {
    icon: Lightbulb,
    title: "DCA Strategy",
    prompt: "Help me create a dollar-cost averaging plan"
  }
];

export function ChatInterface({ onMessageSent, onBotResponseComplete, onToggleAnalytics, isExpanded, showAnalyticsButton }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Trigger the layout expansion
    onMessageSent();

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I've analyzed the market data based on your request. Here's a summary of the top performing staking assets right now. Ethereum is showing strong momentum with a 13.62% reward rate.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      
      // Trigger analytics panel to show after bot finishes responding
      onBotResponseComplete();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto relative">
      {/* Mobile Analytics Button - Top Bar */}
      {showAnalyticsButton && isExpanded && (
        <div className="md:hidden sticky top-0 z-10 flex justify-between items-center p-4 bg-background/95 backdrop-blur-sm border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Chat</h2>
          <Button
            onClick={onToggleAnalytics}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <BarChart3 size={16} />
            Analytics
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${!isExpanded ? 'hidden' : ''}`}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              message.sender === 'user' ? 'bg-primary' : 'bg-muted'
            }`}>
              {message.sender === 'user' ? (
                <User size={16} className="text-primary-foreground" />
              ) : (
                <Bot size={16} className="text-muted-foreground" />
              )}
            </div> */}
            <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
              message.sender === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-card text-card-foreground rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Bot size={16} className="text-muted-foreground" />
            </div>
            <div className="bg-card rounded-2xl px-4 py-3 rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`relative ${
        isExpanded ? 'p-4 bg-background/50 backdrop-blur-sm border-t border-border' : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4'
      }`}>
        {/* Gradient Background - Only visible when not expanded */}
        {!isExpanded && (
          <div className="absolute inset-0 -z-10">
            {/* <div className="absolute -top-48 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" /> */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            {/* <div className="absolute -bottom-48 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" /> */}
          </div>
        )}

        <div className={`max-w-2xl mx-auto ${!isExpanded ? 'text-center mb-8' : 'hidden'}`}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Ready to make smarter decisions?
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Ask about macro trends, staking opportunities, on-chain data, or portfolio analysis.
          </motion.p>

          {/* Starter Prompt Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
          >
            {starterPrompts.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePromptClick(item.prompt)}
                className="group relative overflow-hidden bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 rounded-2xl p-4 text-left backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                  </div>
                </div>
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-violet-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </motion.div>
        </div>

        <motion.form 
          initial={!isExpanded ? { opacity: 0, y: 20 } : false}
          animate={!isExpanded ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5, delay: 0.7 }}
          onSubmit={handleSubmit} 
          className="relative max-w-2xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-background border-2 border-muted h-16 pl-8 pr-16 rounded-full text-lg shadow-sm focus-visible:ring-0 focus-visible:border-primary/50 hover:border-primary/30 placeholder:text-muted-foreground/50"
          />
          <Button 
            type="submit" 
            size="icon"
            className="absolute right-3 top-3 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105"
            disabled={!input.trim()}
          >
            <Send size={18} className="ml-0.5" />
          </Button>
        </motion.form>
      </div>
    </div>
  );
}

