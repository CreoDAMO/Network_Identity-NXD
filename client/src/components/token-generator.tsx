import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Download, Palette, Sparkles, Settings, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Type definitions
interface ColorVariant {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  emissive: string;
  description: string;
}

interface PlatformConfig {
  name: string;
  size: string;
  format: string;
  background: string;
  requirements: string[];
}

interface ParticleSystem {
  enabled: boolean;
  count: number;
  speed: number;
  color: string;
}

interface TokenGeneratorState {
  selectedVariant: ColorVariant;
  selectedPlatform: string;
  particleSystem: ParticleSystem;
  logoText: string;
  isGenerating: boolean;
  generatedLogos: string[];
}

// Color variants configuration
const COLOR_VARIANTS: ColorVariant[] = [
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    primary: '#8B5CF6',
    secondary: '#1E1B4B',
    accent: '#3B82F6',
    emissive: '#A855F7',
    description: 'NXD signature cosmic theme'
  },
  {
    id: 'nebula-blue',
    name: 'Nebula Blue',
    primary: '#3B82F6',
    secondary: '#0F172A',
    accent: '#1E40AF',
    emissive: '#60A5FA',
    description: 'Deep space blue aesthetic'
  },
  {
    id: 'meteor-green',
    name: 'Meteor Green',
    primary: '#10B981',
    secondary: '#064E3B',
    accent: '#059669',
    emissive: '#34D399',
    description: 'High-tech matrix style'
  },
  {
    id: 'solar-orange',
    name: 'Solar Orange',
    primary: '#F59E0B',
    secondary: '#451A03',
    accent: '#D97706',
    emissive: '#FBBF24',
    description: 'Energetic solar flare'
  },
  {
    id: 'quantum-pink',
    name: 'Quantum Pink',
    primary: '#EC4899',
    secondary: '#500724',
    accent: '#DB2777',
    emissive: '#F472B6',
    description: 'Futuristic quantum vibes'
  },
  {
    id: 'chrome',
    name: 'Chrome',
    primary: '#94A3B8',
    secondary: '#1E293B',
    accent: '#64748B',
    emissive: '#CBD5E1',
    description: 'Premium metallic finish'
  }
];

// Platform-specific configurations
const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'CoinGecko',
    size: '256x256',
    format: 'PNG',
    background: 'Transparent',
    requirements: ['Square ratio', 'Clean background', 'High contrast']
  },
  {
    name: 'CoinMarketCap',
    size: '200x200',
    format: 'PNG',
    background: 'Transparent',
    requirements: ['Minimal design', 'Clear at small sizes', 'Brand colors']
  },
  {
    name: 'Etherscan',
    size: '32x32',
    format: 'ICO/PNG',
    background: 'Transparent',
    requirements: ['Favicon compatible', 'Simple design', 'Recognizable']
  },
  {
    name: 'Wallet UI',
    size: '64x64',
    format: 'SVG/PNG',
    background: 'Transparent',
    requirements: ['Vector preferred', 'Scalable', 'Consistent branding']
  },
  {
    name: 'Social Media',
    size: '1200x1200',
    format: 'PNG/JPG',
    background: 'Gradient',
    requirements: ['Eye-catching', 'Branded background', 'High resolution']
  },
  {
    name: 'DEX Listing',
    size: '512x512',
    format: 'PNG',
    background: 'Transparent',
    requirements: ['Professional appearance', 'High resolution', 'Clear branding']
  }
];

export function TokenGenerator() {
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant>(COLOR_VARIANTS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig>(PLATFORM_CONFIGS[0]);
  const [showFlat, setShowFlat] = useState(false);
  const [particleSystem, setParticleSystem] = useState<ParticleSystem>({
    enabled: true,
    count: 30,
    speed: 1,
    color: '#8B5CF6'
  });
  const [autoRotate, setAutoRotate] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // 3D Token Component
  const Token3D: React.FC<{ variant: ColorVariant; className?: string }> = ({ variant, className }) => {
    const tokenRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef(0);

    useEffect(() => {
      const animate = () => {
        timeRef.current += 0.016 * animationSpeed;
        if (tokenRef.current && autoRotate) {
          tokenRef.current.style.transform = `
            rotateY(${timeRef.current * 20}deg) 
            rotateX(${Math.sin(timeRef.current) * 10}deg)
            translateY(${Math.sin(timeRef.current * 0.5) * 5}px)
          `;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [autoRotate, animationSpeed]);

    return (
      <div className={`relative w-96 h-96 ${className}`} style={{ perspective: '1000px' }}>
        <div 
          ref={tokenRef}
          className="relative w-full h-full transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            '--primary-color': variant.primary,
            '--secondary-color': variant.secondary,
            '--accent-color': variant.accent,
            '--emissive-color': variant.emissive,
          } as React.CSSProperties}
        >
          {/* Token Face */}
          <div className="absolute w-full h-full rounded-full border-4 shadow-2xl"
               style={{
                 background: `linear-gradient(45deg, ${variant.accent}, ${variant.secondary})`,
                 borderColor: variant.primary,
                 boxShadow: `0 0 40px ${variant.primary}, inset 0 0 20px ${variant.secondary}`,
                 transform: 'translateZ(10px)'
               }}>

            {/* Circuit Pattern */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} 
                     className="absolute w-0.5 h-10 opacity-60"
                     style={{
                       background: `linear-gradient(to bottom, transparent, ${variant.primary}, transparent)`,
                       left: '50%',
                       top: '10px',
                       transformOrigin: '50% 180px',
                       transform: `translateX(-50%) rotate(${i * 45}deg)`,
                       animation: `pulse 2s infinite ${i * 0.25}s`
                     }} />
              ))}
            </div>

            {/* Center NXD Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-3 z-10">
                {['N', 'X', 'D'].map((letter, i) => (
                  <span key={letter}
                        className="text-5xl font-bold"
                        style={{
                          color: variant.primary,
                          textShadow: `0 0 20px ${variant.primary}`,
                          animation: `glow 2s infinite alternate ${i * 0.2}s`
                        }}>
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            {/* Glow Ring */}
            <div className="absolute -inset-4 border rounded-full opacity-30"
                 style={{
                   borderColor: variant.primary,
                   animation: 'ring-pulse 3s infinite'
                 }} />
          </div>
        </div>

        {/* Particle System */}
        {particleSystem.enabled && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            {Array.from({ length: particleSystem.count }, (_, i) => (
              <div key={i}
                   className="absolute w-1 h-1 rounded-full"
                   style={{
                     backgroundColor: particleSystem.color,
                     left: `${Math.random() * 100}%`,
                     top: `${Math.random() * 100}%`,
                     animation: `float 3s infinite linear ${Math.random() * 3}s`,
                     animationDuration: `${3 / particleSystem.speed}s`
                   }} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Flat Icon Component
  const FlatIcon: React.FC<{ variant: ColorVariant; size?: number }> = ({ variant, size = 64 }) => {
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox="0 0 64 64" className="rounded-lg">
          <defs>
            <linearGradient id={`grad-${variant.id}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={variant.primary} />
              <stop offset="100%" stopColor={variant.secondary} />
            </linearGradient>
            <filter id={`glow-${variant.id}-${size}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <circle 
            cx="32" 
            cy="32" 
            r="28" 
            fill={`url(#grad-${variant.id}-${size})`}
            filter={`url(#glow-${variant.id}-${size})`}
          />

          <circle 
            cx="32" 
            cy="32" 
            r="24" 
            fill={variant.accent}
            opacity="0.8"
          />

          {/* Circuit lines */}
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={i}
              x1="32"
              y1="8"
              x2="32"
              y2="18"
              stroke={variant.primary}
              strokeWidth="2"
              transform={`rotate(${i * 60} 32 32)`}
            />
          ))}

          {/* NXD Text */}
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fontSize={size > 128 ? "16" : size > 64 ? "12" : "8"}
            fontWeight="bold"
            fill={variant.primary}
            fontFamily="Arial, sans-serif"
          >
            NXD
          </text>
        </svg>
        <div className="text-xs text-white/60 mt-2">{size}px</div>
      </div>
    );
  };

  // Export functionality
  const exportToken = useCallback(async () => {
    try {
      // In a real implementation, you'd capture the canvas/SVG and convert to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size based on platform requirements
      const [width, height] = selectedPlatform.size.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, selectedVariant.primary);
        gradient.addColorStop(1, selectedVariant.secondary);

        // Draw token
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(width/2, height/2, Math.min(width, height)/2 - 10, 0, 2 * Math.PI);
        ctx.fill();

        // Add NXD text
        ctx.fillStyle = selectedVariant.primary;
        ctx.font = `bold ${Math.max(12, width/8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('NXD', width/2, height/2 + 5);

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nxd-token-${selectedVariant.id}-${selectedPlatform.name.toLowerCase().replace(' ', '-')}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [selectedVariant, selectedPlatform]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-void via-deep-space to-quantum-blue p-6">
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes glow {
          0% { text-shadow: 0 0 10px var(--primary-color); }
          100% { text-shadow: 0 0 30px var(--primary-color); }
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-orbitron font-bold text-white mb-4">
            <Sparkles className="inline w-8 h-8 mr-2 text-cosmic-purple" />
            NXD Token Generator
          </h1>
          <p className="text-white/80">Professional 3D Token Visualization & Multi-Platform Export</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Preview */}
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-white/20 h-[600px]">
              <CardContent className="p-6 h-full flex items-center justify-center">
                {showFlat ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <FlatIcon variant={selectedVariant} size={32} />
                    <FlatIcon variant={selectedVariant} size={64} />
                    <FlatIcon variant={selectedVariant} size={128} />
                    <FlatIcon variant={selectedVariant} size={256} />
                  </div>
                ) : (
                  <Token3D variant={selectedVariant} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Color Variants */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Color Variants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {COLOR_VARIANTS.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedVariant.id === variant.id 
                        ? 'border-cosmic-purple bg-cosmic-purple/20' 
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: variant.primary }}
                      />
                      <div>
                        <div className="text-white font-medium">{variant.name}</div>
                        <div className="text-white/60 text-sm">{variant.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Platform Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select 
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  value={selectedPlatform.name}
                  onChange={(e) => {
                    const platform = PLATFORM_CONFIGS.find(p => p.name === e.target.value);
                    if (platform) setSelectedPlatform(platform);
                  }}
                >
                  {PLATFORM_CONFIGS.map((platform) => (
                    <option key={platform.name} value={platform.name} className="bg-gray-800">
                      {platform.name} ({platform.size})
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Format:</span>
                    <Badge variant="outline">{selectedPlatform.format}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Background:</span>
                    <Badge variant="outline">{selectedPlatform.background}</Badge>
                  </div>
                </div>

                <div className="text-xs text-white/60">
                  <div className="font-medium mb-1">Requirements:</div>
                  <ul className="space-y-1">
                    {selectedPlatform.requirements.map((req, i) => (
                      <li key={i}>• {req}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Display Controls */}
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Display Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowFlat(!showFlat)}
                  variant={showFlat ? "default" : "outline"}
                  className="w-full"
                >
                  {showFlat ? 'Show 3D View' : 'Show Flat Icons'}
                </Button>

                <Button
                  onClick={() => setAutoRotate(!autoRotate)}
                  variant={autoRotate ? "default" : "outline"}
                  className="w-full"
                >
                  {autoRotate ? 'Disable' : 'Enable'} Auto Rotate
                </Button>

                <div className="space-y-2">
                  <label className="text-white text-sm">Animation Speed: {animationSpeed}x</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                    className="w-full accent-cosmic-purple"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm">Particles</label>
                    <Button
                      size="sm"
                      variant={particleSystem.enabled ? "default" : "outline"}
                      onClick={() => setParticleSystem(prev => ({ ...prev, enabled: !prev.enabled }))}
                    >
                      {particleSystem.enabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                  {particleSystem.enabled && (
                    <div className="space-y-2">
                      <label className="text-white text-xs">Count: {particleSystem.count}</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={particleSystem.count}
                        onChange={(e) => setParticleSystem(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                        className="w-full accent-cosmic-purple"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={exportToken}
                  className="w-full bg-cosmic-purple hover:bg-cosmic-purple/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Token
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}