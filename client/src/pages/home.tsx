import { useLocation } from "wouter";
import { DomainSearch } from "@/components/domain-search";
import { DomainsDashboard } from "@/components/domains-dashboard";
import { StakingInterface } from "@/components/staking-interface";
import { GovernanceInterface } from "@/components/governance-interface";
import { MarketplaceInterface } from "@/components/marketplace-interface";
import { AIAssistant } from "@/components/ai-assistant";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";

export default function Home() {
  const [location] = useLocation();

  const renderSection = () => {
    const section = location === "/" ? "home" : location.slice(1);
    
    switch (section) {
      case "domains":
        return <DomainsDashboard />;
      case "staking":
        return <StakingInterface />;
      case "governance":
        return <GovernanceInterface />;
      case "marketplace":
        return <MarketplaceInterface />;
      case "ai":
        return <AIAssistant />;
      default:
        return <DomainSearch />;
    }
  };

  const getSectionTitle = () => {
    const section = location === "/" ? "home" : location.slice(1);
    
    switch (section) {
      case "domains":
        return {
          title: "My Domains",
          subtitle: "Manage your Web3 domain portfolio"
        };
      case "staking":
        return {
          title: "NXD Staking",
          subtitle: "Earn rewards by staking your NXD tokens"
        };
      case "governance":
        return {
          title: "DAO Governance",
          subtitle: "Participate in platform governance and shape the future of NXD"
        };
      case "marketplace":
        return {
          title: "Domain Marketplace",
          subtitle: "Buy, sell, and discover premium Web3 domains"
        };
      case "ai":
        return {
          title: "AI Assistant",
          subtitle: "Get intelligent domain suggestions and platform assistance powered by xAI's Grok"
        };
      default:
        return {
          title: "Own Your Web3 Domain",
          subtitle: "Discover, register, and manage decentralized domains with AI-powered suggestions and NXD token rewards"
        };
    }
  };

  const { title, subtitle } = getSectionTitle();
  const isHomePage = location === "/";

  return (
    <div className="min-h-screen">
      {/* Hero/Header Section */}
      <section className={`${isHomePage ? "pt-32 pb-20" : "pt-20 pb-12"} px-4`}>
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className={`${isHomePage ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"} font-orbitron font-bold mb-6 bg-gradient-to-r from-cosmic-purple via-nebula-blue to-starlight-pink bg-clip-text text-transparent animate-pulse-slow`}>
              {title}
            </h1>
            <p className={`${isHomePage ? "text-xl md:text-2xl" : "text-lg md:text-xl"} text-white/70 mb-12 font-light`}>
              {subtitle}
            </p>
            
            {/* Main Content */}
            <div className="mb-16">
              {renderSection()}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cosmic-purple to-nebula-blue rounded-xl flex items-center justify-center">
                  <i className="fas fa-cube text-white text-xl"></i>
                </div>
                <h1 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-cosmic-purple to-starlight-pink bg-clip-text text-transparent">
                  NXD
                </h1>
              </div>
              <p className="text-white/70 mb-6">
                The future of Web3 domain management with AI-powered insights and decentralized governance.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <i className="fab fa-discord"></i>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <i className="fab fa-telegram"></i>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="/domains" className="text-white/70 hover:text-white transition-colors">Domain Search</a></li>
                <li><a href="/domains" className="text-white/70 hover:text-white transition-colors">My Domains</a></li>
                <li><a href="/marketplace" className="text-white/70 hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="/staking" className="text-white/70 hover:text-white transition-colors">Staking</a></li>
                <li><a href="/governance" className="text-white/70 hover:text-white transition-colors">Governance</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">White Paper</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Tokenomics</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Brand Kit</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Bug Report</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Feature Request</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/60 text-sm">
                © 2024 NXD Platform. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
