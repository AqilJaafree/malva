'use client';

import { useState } from 'react';
import { Search, Star, TrendingUp, Zap, Brain, Target, Shield, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Navbar from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

// Mock data for agent skills
const agentSkills = [
  {
    id: 1,
    name: 'DCA Strategy Optimizer',
    description: 'Advanced dollar-cost averaging algorithm with market sentiment analysis',
    category: 'Trading',
    price: 49.99,
    rating: 4.8,
    reviews: 124,
    sales: 1234,
    author: 'CryptoMaster',
    icon: TrendingUp,
    color: 'blue',
    featured: true,
  },
  {
    id: 2,
    name: 'Portfolio Rebalancer',
    description: 'Automatically rebalances your portfolio based on market conditions',
    category: 'Portfolio Management',
    price: 39.99,
    rating: 4.9,
    reviews: 89,
    sales: 892,
    author: 'InvestPro',
    icon: Target,
    color: 'purple',
    featured: true,
  },
  {
    id: 3,
    name: 'Risk Assessment AI',
    description: 'Real-time risk analysis for your crypto holdings with alerts',
    category: 'Risk Management',
    price: 59.99,
    rating: 4.7,
    reviews: 156,
    sales: 2103,
    author: 'SafeTrade',
    icon: Shield,
    color: 'red',
    featured: false,
  },
  {
    id: 4,
    name: 'Market Sentiment Analyzer',
    description: 'AI-powered sentiment analysis from social media and news sources',
    category: 'Analytics',
    price: 44.99,
    rating: 4.6,
    reviews: 203,
    sales: 1567,
    author: 'DataWhiz',
    icon: Brain,
    color: 'green',
    featured: false,
  },
  {
    id: 5,
    name: 'Smart Buy Signal',
    description: 'Get notified of optimal buying opportunities based on technical indicators',
    category: 'Trading',
    price: 34.99,
    rating: 4.5,
    reviews: 178,
    sales: 998,
    author: 'TradingBot',
    icon: Zap,
    color: 'yellow',
    featured: false,
  },
  {
    id: 6,
    name: 'Whale Activity Tracker',
    description: 'Monitor large wallet movements and get early alerts',
    category: 'Analytics',
    price: 69.99,
    rating: 4.9,
    reviews: 91,
    sales: 654,
    author: 'WhaleWatch',
    icon: Sparkles,
    color: 'indigo',
    featured: true,
  },
];

const categories = ['All', 'Trading', 'Portfolio Management', 'Risk Management', 'Analytics'];
const sortOptions = ['Popular', 'Highest Rated', 'Price: Low to High', 'Price: High to Low', 'Newest'];

const colorClasses: { [key: string]: string } = {
  blue: 'bg-blue-500/10 text-blue-500',
  purple: 'bg-purple-500/10 text-purple-500',
  red: 'bg-red-500/10 text-red-500',
  green: 'bg-green-500/10 text-green-500',
  yellow: 'bg-yellow-500/10 text-yellow-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
};

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredSkills = agentSkills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      {/* Main Content Wrapper */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Agent Skills Marketplace</h1>
                <p className="text-muted-foreground text-sm md:text-base">Discover and integrate powerful AI agents to enhance your trading</p>
              </div>
              <Button className="gap-2 w-full md:w-auto">
                <Sparkles size={18} />
                Sell Your Skills
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for agent skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 h-12 px-4 w-full md:w-auto">
                    <Filter size={18} />
                    Sort: {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem key={option} onClick={() => setSortBy(option)}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Section */}
          {selectedCategory === 'All' && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Featured Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills
                  .filter((skill) => skill.featured)
                  .map((skill) => (
                    <SkillCard key={skill.id} skill={skill} featured />
                  ))}
              </div>
            </div>
          )}

          {/* All Skills */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {selectedCategory === 'All' ? 'All Skills' : selectedCategory}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredSkills.length === 0 && (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No skills found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface SkillCardProps {
  skill: typeof agentSkills[0];
  featured?: boolean;
}

function SkillCard({ skill, featured = false }: SkillCardProps) {
  const Icon = skill.icon;

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group ${
        featured ? 'ring-2 ring-primary/20' : ''
      }`}
    >
      {featured && (
        <div className="flex items-center gap-1 text-xs font-medium text-primary mb-3">
          <Sparkles size={14} />
          Featured
        </div>
      )}

      {/* Icon and Price */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[skill.color]}`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">${skill.price}</div>
          <div className="text-xs text-muted-foreground">one-time</div>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {skill.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{skill.description}</p>

      {/* Category Badge */}
      <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-foreground mb-4">
        {skill.category}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-foreground">{skill.rating}</span>
            <span>({skill.reviews})</span>
          </div>
          <div>{skill.sales.toLocaleString()} sales</div>
        </div>
      </div>

      {/* Author */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          by <span className="font-medium text-foreground">{skill.author}</span>
        </div>
        <Button size="sm" className="h-8">
          Buy Now
        </Button>
      </div>
    </div>
  );
}

