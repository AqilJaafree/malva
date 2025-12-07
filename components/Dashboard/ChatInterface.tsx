'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, BarChart3, TrendingUp, Coins, PieChart, Lightbulb } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMCPData } from '@/hooks/useMCPData';
import { useFundWallet, useWallets } from '@privy-io/react-auth/solana';

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

  // MCP data fetching hook (with X402 payments)
  const {
    getCurrentPrices,
    getRSIAnalysis,
    getCryptoNews,
    isWalletReady,
    isCreatingWallet,
  } = useMCPData();

  // Fund wallet hook for insufficient balance
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  /**
   * Detect if user query needs real-time data from MCP
   * Returns data context to include in AI prompt
   */
  const fetchMCPDataIfNeeded = async (query: string): Promise<string | null> => {
    console.log('[ChatInterface] Checking if MCP data needed for query:', query);
    console.log('[ChatInterface] Wallet ready:', isWalletReady);
    console.log('[ChatInterface] Creating wallet:', isCreatingWallet);

    if (isCreatingWallet) {
      console.log('[ChatInterface] ⏳ Wallet is being created - please wait');
      return 'Note: Creating your wallet, please wait a moment...';
    }

    if (!isWalletReady) {
      console.warn('[ChatInterface] ⚠️ Wallet not ready - skipping MCP data fetch');
      return 'Note: Wallet not ready for real-time data. Refresh the page or try again.';
    }

    const lowerQuery = query.toLowerCase();

    try {
      // Check for price-related queries
      if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('trading at')) {
        console.log('[ChatInterface] 💰 Price query detected, fetching prices...');
        const category = lowerQuery.includes('stock') || lowerQuery.includes('tesla') || lowerQuery.includes('apple')
          ? 'rwa-stocks'
          : lowerQuery.includes('gold') || lowerQuery.includes('paxg')
          ? 'gold'
          : lowerQuery.includes('btc') || lowerQuery.includes('bitcoin')
          ? 'wrapped-btc'
          : undefined;

        const priceData = await getCurrentPrices(category);
        console.log('[ChatInterface] ✅ Price data received:', priceData);
        return `\n\n[REAL-TIME DATA - Paid via X402]\n${JSON.stringify(priceData, null, 2)}`;
      }

      // Check for RSI/trading signals queries
      if (lowerQuery.includes('rsi') || lowerQuery.includes('buy') || lowerQuery.includes('sell') || lowerQuery.includes('signal') || lowerQuery.includes('indicator')) {
        console.log('[ChatInterface] 📊 RSI/signal query detected, fetching analysis...');
        const rsiData = await getRSIAnalysis();
        console.log('[ChatInterface] ✅ RSI data received:', rsiData);
        return `\n\n[REAL-TIME RSI ANALYSIS - Paid via X402]\n${JSON.stringify(rsiData, null, 2)}`;
      }

      // Check for news queries
      if (lowerQuery.includes('news') || lowerQuery.includes('latest') || lowerQuery.includes('happening')) {
        console.log('[ChatInterface] 📰 News query detected, fetching news...');
        const newsData = await getCryptoNews({ limit: 5 });
        console.log('[ChatInterface] ✅ News data received:', newsData);
        return `\n\n[LATEST CRYPTO NEWS - Paid via X402]\n${JSON.stringify(newsData, null, 2)}`;
      }

      console.log('[ChatInterface] ℹ️ No MCP data keywords detected');
      return null;
    } catch (error) {
      console.error('[ChatInterface] ❌ MCP data fetch error:', error);

      // Check if error is due to insufficient funds
      if (error instanceof Error && error.message.includes('INSUFFICIENT_FUNDS')) {
        console.log('[ChatInterface] 💰 Insufficient funds - prompting to add funds...');

        // Prompt user to fund wallet (first wallet is always Solana)
        const solanaWallet = wallets[0];
        if (solanaWallet) {
          setTimeout(() => {
            fundWallet({ address: solanaWallet.address });
          }, 500);
        }

        return `\n\n[INSUFFICIENT FUNDS: Please add USDC to your wallet to access real-time data. A funding modal will appear shortly.]`;
      }

      return `\n\n[DATA FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
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
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Trigger the layout expansion
    onMessageSent();

    try {
      // Fetch real-time data from MCP if needed (with X402 payment)
      const mcpData = await fetchMCPDataIfNeeded(currentInput);

      // Enhance user query with real-time data
      const enhancedQuery = mcpData
        ? `${currentInput}${mcpData}\n\nUse the real-time data above to answer the user's question accurately.`
        : currentInput;

      // Call Groq API with enhanced query
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content,
            })),
            {
              role: 'user',
              content: enhancedQuery,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);

      // Trigger analytics panel to show after bot finishes responding
      onBotResponseComplete();
    } catch (error) {
      console.error('Error calling chat API:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
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
            className="absolute gap-0 right-3 top-3 h-10 w-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105"
            disabled={!input.trim()}
          >
            <Send size={18} />
          </Button>
        </motion.form>
      </div>
    </div>
  );
}

