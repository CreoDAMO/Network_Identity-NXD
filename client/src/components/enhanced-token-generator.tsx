import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Download, Palette, Sparkles, Settings, Copy, ExternalLink, Edit2 } from 'lucide-react';

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

// Color variants configuration
const COLOR_VARIANTS: ColorVariant[] = [
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    primary: '#00ffff',
    secondary: '#002222',
    accent: '#111111',
    emissive: '#0066ff',
    description: 'Classic AI-tech aesthetic'
  },
  {
    id: 'chrome',
    name: 'Chrome',
    primary: '#c0c0c0',
    secondary: '#333333',
    accent: '#808080',
    emissive: '#ffffff',
    description: 'Premium metallic finish'
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    primary: '#1a1a1a',
    secondary: '#0a0a0a',
    accent: '#333333',
    emissive: '#444444',
    description: 'Stealth premium look'
  },
  {
    id: 'holographic',
    name: 'Holographic',
    primary: '#ff00ff',
    secondary: '#4d004d',
    accent: '#ff6600',
    emissive: '#00ff88',
    description: 'Dynamic rainbow effect'
  },
  {
    id: 'gold',
    name: 'Gold',
    primary: '#ffd700',
    secondary: '#332200',
    accent: '#ffaa00',
    emissive: '#ffff66',
    description: 'Luxury finance theme'
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    primary: '#00ff00',
    secondary: '#002200',
    accent: '#004400',
    emissive: '#66ff66',
    description: 'Matrix-inspired'
  },
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    primary: '#8B5CF6',
    secondary: '#2D1B69',
    accent: '#4C1D95',
    emissive: '#A78BFA',
    description: 'Deep space aesthetic'
  },
  {
    id: 'flame-orange',
    name: 'Flame Orange',
    primary: '#FF6B00',
    secondary: '#331400',
    accent: '#CC4400',
    emissive: '#FF8533',
    description: 'Energy and innovation'
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
    name: 'DEX Listings',
    size: '128x128',
    format: 'PNG',
    background: 'Transparent',
    requirements: ['Clean symbol', 'Brand recognition', 'Professional look']
  }
];

const EnhancedTokenGenerator: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant>(COLOR_VARIANTS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig>(PLATFORM_CONFIGS[0]);
  const [showFlat, setShowFlat] = useState(false);
  const [particleSystem, setParticleSystem] = useState<ParticleSystem>({
    enabled: true,
    count: 50,
    speed: 1,
    color: '#00ffff'
  });
  const [autoRotate, setAutoRotate] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [tokenText, setTokenText] = useState('NXD');
  const [showBrandingPanel, setShowBrandingPanel] = useState(false);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  
  // Auto-lock NXD text when white-label mode is off
  useEffect(() => {
    if (!isWhiteLabel) {
      setTokenText('NXD');
    }
  }, [isWhiteLabel]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Update particle color when variant changes
  useEffect(() => {
    setParticleSystem(prev => ({ ...prev, color: selectedVariant.primary }));
  }, [selectedVariant]);

  // 3D Token Component
  const Token3D: React.FC<{ variant: ColorVariant; className?: string }> = ({ variant, className }) => {
    const tokenRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef(0);

    useEffect(() => {
      const animate = () => {
        timeRef.current += 0.016 * animationSpeed;
        if (tokenRef.current) {
          if (autoRotate) {
            tokenRef.current.style.transform = `
              rotateY(${timeRef.current * 20}deg) 
              rotateX(${Math.sin(timeRef.current) * 10}deg)
              translateY(${Math.sin(timeRef.current * 0.5) * 5}px)
            `;
          }
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
      <div className={`relative w-96 h-96 perspective-1000 ${className}`}>
        <div 
          ref={tokenRef}
          className="relative w-full h-full preserve-3d transition-transform duration-300"
          style={{
            '--primary-color': variant.primary,
            '--secondary-color': variant.secondary,
            '--accent-color': variant.accent,
            '--emissive-color': variant.emissive,
          } as React.CSSProperties}
        >
          <div className="relative w-full h-full preserve-3d">
            {/* Token Front Face */}
            <div className="absolute w-full h-full rounded-full border-2 transform translate-z-2.5"
                 style={{
                   background: `linear-gradient(45deg, ${variant.accent}, ${variant.secondary})`,
                   borderColor: variant.primary,
                   boxShadow: `0 0 20px ${variant.primary}, inset 0 0 20px ${variant.secondary}`
                 }}>
              
              {/* Circuit Pattern */}
              <div className="absolute w-full h-full top-0 left-0">
                {Array.from({ length: 8 }, (_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-0.5 h-10 left-1/2 top-2.5 animate-pulse"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${variant.primary}, transparent)`,
                      transformOrigin: '50% 190px',
                      transform: `rotate(${i * 45}deg)`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>

              {/* NXD Text */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2.5 z-10">
                {['N', 'X', 'D'].map((letter, i) => (
                  <span 
                    key={letter}
                    className="text-5xl font-bold animate-pulse"
                    style={{
                      color: variant.primary,
                      textShadow: `0 0 20px ${variant.primary}`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>

              {/* Glow Ring */}
              <div 
                className="absolute w-full h-full border rounded-full -top-2.5 -left-2.5 opacity-30 animate-pulse"
                style={{
                  width: '120%',
                  height: '120%',
                  borderColor: variant.primary,
                  animationDuration: '3s'
                }}
              />
            </div>

            {/* Token Back Face */}
            <div className="absolute w-full h-full rounded-full border-2 transform translate-z-minus-2.5 rotate-y-180"
                 style={{
                   background: `linear-gradient(45deg, ${variant.accent}, ${variant.secondary})`,
                   borderColor: variant.primary,
                   boxShadow: `0 0 20px ${variant.primary}, inset 0 0 20px ${variant.secondary}`
                 }}>
              
              {/* Circuit Nodes */}
              <div className="absolute w-full h-full top-0 left-0">
                {Array.from({ length: 12 }, (_, i) => (
                  <div 
                    key={i}
                    className="absolute w-1 h-1 rounded-full left-1/2 top-1/2 animate-pulse"
                    style={{
                      background: variant.primary,
                      transformOrigin: '50% 50%',
                      transform: `rotate(${i * 30}deg) translateY(-60px)`,
                      boxShadow: `0 0 10px ${variant.primary}`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '1.5s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Particle System */}
        {particleSystem.enabled && (
          <div className="absolute w-full h-full top-0 left-0 pointer-events-none overflow-hidden">
            {Array.from({ length: particleSystem.count }, (_, i) => (
              <div 
                key={i} 
                className="absolute w-0.5 h-0.5 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: particleSystem.color,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 / particleSystem.speed}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Flat Icon Component
  const FlatIcon: React.FC<{ variant: ColorVariant; size?: number }> = ({ variant, size = 64 }) => {
    return (
      <div className="inline-block" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 64 64">
          <defs>
            <linearGradient id={`grad-${variant.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={variant.primary} />
              <stop offset="100%" stopColor={variant.secondary} />
            </linearGradient>
            <filter id={`glow-${variant.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main circle */}
          <circle 
            cx="32" 
            cy="32" 
            r="28" 
            fill={`url(#grad-${variant.id})`}
            filter={`url(#glow-${variant.id})`}
          />
          
          {/* Inner circle */}
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
          
          {/* Token Text */}
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill={variant.primary}
            fontFamily="Arial, sans-serif"
          >
            {tokenText}
          </text>
        </svg>
      </div>
    );
  };

  // Screenshot functionality
  const takeScreenshot = useCallback(() => {
    console.log('Exporting token for platform:', selectedPlatform.name);
    console.log('Variant:', selectedVariant.name);
    
    // In a real implementation, you'd use html2canvas or similar
    const link = document.createElement('a');
    link.download = `nxd-token-${selectedVariant.id}-${selectedPlatform.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    
    // Create a notification for user
    alert(`Token exported for ${selectedPlatform.name}\nVariant: ${selectedVariant.name}\nSize: ${selectedPlatform.size}\nFormat: ${selectedPlatform.format}`);
  }, [selectedVariant, selectedPlatform]);

  // Export configuration
  const exportConfig = useCallback(() => {
    const config = {
      variant: selectedVariant,
      platform: selectedPlatform,
      particles: particleSystem,
      animation: {
        autoRotate,
        speed: animationSpeed
      },
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nxd-token-config-${selectedVariant.id}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [selectedVariant, selectedPlatform, particleSystem, autoRotate, animationSpeed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white font-sans overflow-x-hidden">
      {/* Custom Styles */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-2\.5 { transform: translateZ(10px); }
        .translate-z-minus-2\.5 { transform: translateZ(-10px); }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        .animate-float {
          animation: float 3s infinite linear;
        }
        
        @media (max-width: 768px) {
          .grid-cols-2-to-1 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="p-5 text-center border-b border-white border-opacity-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
          NXD Token Studio
        </h1>
        <p className="mt-2 opacity-80">Professional 3D Token Visualization & Multi-Platform Export</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 max-w-7xl mx-auto">
        
        {/* Token Showcase */}
        <div className="lg:col-span-2 relative h-96 lg:h-auto min-h-96 bg-black bg-opacity-30 rounded-2xl border border-white border-opacity-10 flex items-center justify-center overflow-hidden">
          {showFlat ? (
            <div className="flex flex-wrap gap-4 p-5">
              <div className="text-center">
                <FlatIcon variant={selectedVariant} size={32} />
                <div className="text-xs mt-1 opacity-70">32px</div>
              </div>
              <div className="text-center">
                <FlatIcon variant={selectedVariant} size={64} />
                <div className="text-xs mt-1 opacity-70">64px</div>
              </div>
              <div className="text-center">
                <FlatIcon variant={selectedVariant} size={128} />
                <div className="text-xs mt-1 opacity-70">128px</div>
              </div>
              <div className="text-center">
                <FlatIcon variant={selectedVariant} size={256} />
                <div className="text-xs mt-1 opacity-70">256px</div>
              </div>
            </div>
          ) : (
            <Token3D variant={selectedVariant} />
          )}
        </div>

        {/* Controls Panel */}
        <div className="bg-black bg-opacity-40 rounded-2xl p-5 border border-white border-opacity-10 h-fit">
          
          {/* Color Variants */}
          <div className="mb-6">
            <h3 className="text-cyan-400 text-lg mb-3">Color Variants</h3>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_VARIANTS.map((variant) => (
                <div
                  key={variant.id}
                  className={`p-2 border rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedVariant.id === variant.id 
                      ? 'border-cyan-400 bg-cyan-400 bg-opacity-20' 
                      : 'border-white border-opacity-20 bg-black bg-opacity-20 hover:border-cyan-400 hover:bg-cyan-400 hover:bg-opacity-10'
                  }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <div 
                    className="w-5 h-5 rounded-full mb-1" 
                    style={{ background: variant.primary }}
                  />
                  <div className="text-sm font-bold">{variant.name}</div>
                  <div className="text-xs opacity-70">{variant.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NXD Branding & White Label */}
          <div className="mb-6">
            <h3 className="text-cyan-400 text-lg mb-3 flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              NXD Branding
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-black bg-opacity-40 rounded-lg border border-white border-opacity-10">
                <div className="text-sm font-bold text-cyan-400 mb-2">Token Text</div>
                <input
                  type="text"
                  value={tokenText}
                  onChange={(e) => isWhiteLabel && setTokenText(e.target.value.toUpperCase().slice(0, 5))}
                  className={`w-full p-2 bg-black bg-opacity-50 border border-white border-opacity-20 rounded text-white text-center text-sm ${
                    !isWhiteLabel ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter token name"
                  maxLength={5}
                  disabled={!isWhiteLabel}
                />
                <div className="text-xs opacity-70 mt-1">Max 5 characters</div>
              </div>
              
              <div className="p-3 bg-black bg-opacity-40 rounded-lg border border-white border-opacity-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-cyan-400">White Label Mode</div>
                  <button
                    onClick={() => setIsWhiteLabel(!isWhiteLabel)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      isWhiteLabel 
                        ? 'bg-cyan-400 text-black' 
                        : 'bg-black bg-opacity-50 text-white border border-white border-opacity-20'
                    }`}
                  >
                    {isWhiteLabel ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="text-xs opacity-70">
                  {isWhiteLabel 
                    ? 'Custom branding enabled - Token text can be changed'
                    : 'NXD branding locked - Official NXD Platform mode'
                  }
                </div>
              </div>
              
              {!isWhiteLabel && (
                <div className="p-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-opacity-20 rounded-lg border border-cyan-400 border-opacity-30">
                  <div className="text-sm font-bold text-cyan-400 mb-1">🚀 Official NXD Platform</div>
                  <div className="text-xs opacity-90">
                    Powered by NXD Web3 Domain Management System
                  </div>
                </div>
              )}
              
              {isWhiteLabel && (
                <div className="p-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-opacity-20 rounded-lg border border-purple-400 border-opacity-30">
                  <div className="text-sm font-bold text-purple-400 mb-1">⚡ White Label License</div>
                  <div className="text-xs opacity-90">
                    Customize for your brand - Contact NXD for licensing
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Optimization */}
          <div className="mb-6">
            <h3 className="text-cyan-400 text-lg mb-3">Platform</h3>
            <select 
              className="w-full p-2 bg-black bg-opacity-50 border border-white border-opacity-20 rounded text-white mb-2"
              value={selectedPlatform.name}
              onChange={(e) => {
                const platform = PLATFORM_CONFIGS.find(p => p.name === e.target.value);
                if (platform) setSelectedPlatform(platform);
              }}
            >
              {PLATFORM_CONFIGS.map((platform) => (
                <option key={platform.name} value={platform.name}>
                  {platform.name} ({platform.size})
                </option>
              ))}
            </select>
            <div className="text-xs opacity-70 mb-2">
              Format: {selectedPlatform.format} | Background: {selectedPlatform.background}
            </div>
            <div className="text-xs opacity-60">
              <strong>Requirements:</strong>
              <ul className="mt-1">
                {selectedPlatform.requirements.map((req, i) => (
                  <li key={i}>• {req}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Display Options */}
          <div className="mb-6">
            <h3 className="text-cyan-400 text-lg mb-3">Display</h3>
            <button 
              className={`w-full p-2 border rounded mb-2 transition-all duration-300 ${
                showFlat 
                  ? 'border-cyan-400 bg-cyan-400 bg-opacity-30' 
                  : 'border-cyan-400 bg-cyan-400 bg-opacity-10 hover:bg-cyan-400 hover:bg-opacity-20'
              }`}
              onClick={() => setShowFlat(!showFlat)}
            >
              {showFlat ? 'Show 3D Token' : 'Show Flat Icons'}
            </button>
            <button 
              className={`w-full p-2 border rounded transition-all duration-300 ${
                autoRotate 
                  ? 'border-cyan-400 bg-cyan-400 bg-opacity-30' 
                  : 'border-cyan-400 bg-cyan-400 bg-opacity-10 hover:bg-cyan-400 hover:bg-opacity-20'
              }`}
              onClick={() => setAutoRotate(!autoRotate)}
            >
              {autoRotate ? 'Disable Auto Rotate' : 'Enable Auto Rotate'}
            </button>
          </div>

          {/* Particle Effects */}
          <div className="mb-6">
            <h3 className="text-cyan-400 text-lg mb-3">Effects</h3>
            <button 
              className={`w-full p-2 border rounded mb-3 transition-all duration-300 ${
                particleSystem.enabled 
                  ? 'border-cyan-400 bg-cyan-400 bg-opacity-30' 
                  : 'border-cyan-400 bg-cyan-400 bg-opacity-10 hover:bg-cyan-400 hover:bg-opacity-20'
              }`}
              onClick={() => setParticleSystem(prev => ({ ...prev, enabled: !prev.enabled }))}
            >
              {particleSystem.enabled ? 'Disable Particles' : 'Enable Particles'}
            </button>
            
            <div className="mb-3">
              <label className="block text-sm mb-1">Particle Count: {particleSystem.count}</label>
              <input
                type="range"
                min="10"
                max="100"
                value={particleSystem.count}
                onChange={(e) => setParticleSystem(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm mb-1">Animation Speed: {animationSpeed}x</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              className="flex-1 p-2 bg-cyan-400 bg-opacity-10 border border-cyan-400 rounded text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center gap-1"
              onClick={takeScreenshot}
            >
              <Download size={16} />
              Export
            </button>
            <button 
              className="flex-1 p-2 bg-cyan-400 bg-opacity-10 border border-cyan-400 rounded text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center gap-1"
              onClick={exportConfig}
            >
              <Settings size={16} />
              Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTokenGenerator;