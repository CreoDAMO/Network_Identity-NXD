
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
      subtitle: "Web3 Domain Management Revolution",
      content: "The future of decentralized digital identity powered by AI, blockchain, and cutting-edge infrastructure.",
      metrics: [
        { label: "Market Size", value: "$393B", icon: <Globe className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Target Users", value: "1M+", icon: <Users className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Revenue Model", value: "Multi-Stream", icon: <DollarSign className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "ROI Potential", value: "99%+", icon: <TrendingUp className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 2,
      title: "Market Opportunity",
      subtitle: "Massive Growth Potential",
      content: "The blockchain market is projected to reach $393.42B by 2032, growing at 37.7% CAGR. NXD targets multiple high-growth segments including Web3 communication, satellite services, and IoT.",
      metrics: [
        { label: "Blockchain Market", value: "$393B", icon: <BarChart3 className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "IoT Market", value: "$1.1T", icon: <Zap className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Satellite Market", value: "$159B", icon: <Globe className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "CAGR", value: "37.7%", icon: <TrendingUp className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 3,
      title: "Financial Projections",
      subtitle: "Exceptional Profit Margins",
      content: "Our conservative projections show a 98%+ profit margin with break-even in just 2.3 months. Multiple revenue streams ensure sustainable growth.",
      metrics: [
        { label: "Annual Revenue", value: "$35.9M", icon: <DollarSign className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Profit Margin", value: "98%", icon: <TrendingUp className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Break-even", value: "2.3 months", icon: <Target className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "ROI", value: "3,392%", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 4,
      title: "Technology Stack",
      subtitle: "Cutting-Edge Infrastructure",
      content: "Built on a robust multi-cloud, multi-chain architecture with AI integration. Ethereum for security, Polygon/Solana for efficiency, IPFS for decentralization.",
      metrics: [
        { label: "Blockchains", value: "3", icon: <Globe className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Cloud Providers", value: "3", icon: <Zap className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "AI Integration", value: "Grok", icon: <Eye className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Uptime", value: "99.9%", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
      ]
    },
    {
      id: 5,
      title: "Investment Ask",
      subtitle: "Join the Web3 Revolution",
      content: "Seeking strategic partners to accelerate growth and market penetration. Your investment will fuel platform development, market expansion, and team scaling.",
      metrics: [
        { label: "Funding Goal", value: "$5M", icon: <Target className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
        { label: "Use of Funds", value: "Development", icon: <Zap className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
        { label: "Expected Exit", value: "3-5 years", icon: <TrendingUp className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
        { label: "Return Multiple", value: "10-50x", icon: <Award className="w-6 h-6" />, color: "from-orange-500 to-red-500" }
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
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full h-96'}`}>
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
