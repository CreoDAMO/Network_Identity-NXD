
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download, 
  Share, 
  Maximize,
  Volume2,
  VolumeX,
  RotateCcw,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Globe,
  Users,
  DollarSign,
  Award
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

interface PitchSlide {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  metrics?: Array<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }>;
  charts?: Array<{
    type: 'bar' | 'line' | 'pie';
    data: any[];
  }>;
  animation?: 'slideLeft' | 'slideRight' | 'fadeIn' | 'zoomIn';
}

const LivePitchDeck: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const slides: PitchSlide[] = [
    {
      id: 1,
      title: "NXD Platform",
      subtitle: "The Cloudflare + Shopify of Web3 Identity",
      content: "Transforming Web3 identity into a scalable, AI-powered SaaS ecosystem. Modular smart contracts, multi-chain support, and white-label infrastructure for the decentralized future.",
      metrics: [
        { label: "Total Market", value: "$30B+", icon: <Globe className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Serviceable Market", value: "$5B", icon: <Target className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Obtainable Market", value: "$250M", icon: <DollarSign className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Profit Margin", value: "99.74%", icon: <TrendingUp className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 2,
      title: "Market Opportunity",
      subtitle: "Converging Markets: Web3 Identity + SaaS + AI",
      content: "Three converging sectors create unprecedented opportunity: Web3 domain & identity ($20B+), SaaS infrastructure for Web3 developers ($5B+), and AI-native developer platforms ($5B+). NXD captures value across all three with 37.7% market CAGR.",
      metrics: [
        { label: "TAM", value: "$30B+", icon: <Globe className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "SAM", value: "$5B", icon: <Target className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "SOM", value: "$250M", icon: <Zap className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Market CAGR", value: "37.7%", icon: <TrendingUp className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 3,
      title: "Financial Projections",
      subtitle: "Industry-Leading 99.74% Profit Margin",
      content: "Full TAM potential of $179.3M annually with exceptional 99.74% profit margin. Production costs optimized to $464K/year. Break-even at just 2.52% of TAM. Revenue distribution: 20% Founder, 50% Liquidity Providers, 30% Ecosystem/DAO Treasury.",
      metrics: [
        { label: "Full TAM Revenue", value: "$179.3M", icon: <DollarSign className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Profit Margin", value: "99.74%", icon: <TrendingUp className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Break-even", value: "2.52% TAM", icon: <Target className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "LP Revenue", value: "$89.7M", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 4,
      title: "Technology Infrastructure",
      subtitle: "Modular, Multi-Chain, AI-Powered",
      content: "Full-stack modular architecture: Registry, revenue splitter, AI, white-label, staking, and marketplace. Multi-cloud (AWS, GCP, Azure) with multi-chain support (Ethereum, Polygon, Solana, Base). Integrated AI assistant with Grok 3, GPT-4o, Claude 4, DeepSeek, and Poe.",
      metrics: [
        { label: "AI Models", value: "5+", icon: <Eye className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Blockchain Support", value: "Multi-Chain", icon: <Globe className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Infrastructure Cost", value: "$464K/year", icon: <Zap className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Deployment", value: "Production Ready", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 5,
      title: "White Label B2B SaaS",
      subtitle: "The Infrastructure Layer for Web3 Identity",
      content: "Multi-tenant SaaS model targeting Web3 startups, DAOs, NFT projects, and metaverse platforms. Partners deploy branded domain platforms with shared economics. Target: 50+ white label deployments post-launch with $1.5M+ revenue potential and 55% CAGR growth.",
      metrics: [
        { label: "Target Partners", value: "50+", icon: <Users className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "WL Revenue", value: "$17.9M", icon: <DollarSign className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Growth Rate", value: "55% CAGR", icon: <TrendingUp className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Deployment Rate", value: "84%", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 6,
      title: "Investment Opportunity",
      subtitle: "Clear Path to $25M-$50M Valuation",
      content: "Current production-ready valuation: $6.5M. Pre-launch target: $10M-$15M. Post-launch (6-12 months): $25M-$50M with upside to $75M-$100M+ in 18-24 months. Seeking strategic partners for market acceleration and ecosystem expansion.",
      metrics: [
        { label: "Current Valuation", value: "$6.5M", icon: <Target className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Post-Launch Target", value: "$37.5M", icon: <TrendingUp className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Revenue Multiple", value: "6-12x", icon: <DollarSign className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Market Position", value: "First Mover", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && autoAdvance) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setProgress(0);
      }, 10000); // 10 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, autoAdvance, slides.length]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isPlaying) {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(progressInterval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full h-full min-h-[400px]'}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          size="sm"
          variant="outline"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          onClick={() => setIsMuted(!isMuted)}
          size="sm"
          variant="outline"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button
          onClick={toggleFullscreen}
          size="sm"
          variant="outline"
        >
          <Maximize className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Download className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Share className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Navigation */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button onClick={prevSlide} size="sm" variant="outline">
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button onClick={nextSlide} size="sm" variant="outline">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Slide Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-black/90 p-8 flex flex-col justify-center"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {currentSlideData.title}
            </h1>
            {currentSlideData.subtitle && (
              <h2 className="text-xl md:text-2xl text-white/80 font-semibold">
                {currentSlideData.subtitle}
              </h2>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Content */}
            <div className="space-y-6">
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                {currentSlideData.content}
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Whitepaper
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Schedule Demo
                </Button>
              </div>
            </div>

            {/* Metrics */}
            {currentSlideData.metrics && (
              <div className="grid grid-cols-2 gap-4">
                {currentSlideData.metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`p-4 bg-gradient-to-br ${metric.color}/10 border-white/20 backdrop-blur-sm`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                          {metric.icon}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{metric.value}</div>
                          <div className="text-sm text-white/80">{metric.label}</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 right-4 z-10">
        <Badge variant="outline" className="text-white border-white/30">
          {currentSlide + 1} / {slides.length}
        </Badge>
      </div>
    </div>
  );
};

export default LivePitchDeck;
