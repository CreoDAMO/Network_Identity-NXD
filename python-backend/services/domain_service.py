"""
Domain Service for NXD Platform
Handles domain availability, scoring, suggestions, and market analysis
"""
import asyncio
import re
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import httpx
import structlog
from dataclasses import dataclass

from core.config import settings

logger = structlog.get_logger()

@dataclass
class DomainSuggestion:
    name: str
    tld: str
    full_domain: str
    available: bool
    score: float
    category: str  # "premium", "standard", "creative"
    estimated_value: float
    reasons: List[str]

@dataclass
class DomainScore:
    overall_score: float
    length_score: float
    brandability_score: float
    keyword_score: float
    memorability_score: float
    market_value: float
    reasons: List[str]

class DomainService:
    """
    Comprehensive domain management service
    """
    
    def __init__(self):
        # TLD configurations with pricing and characteristics
        self.tlds = {
            "nxd": {
                "base_price": 0.01,  # ETH
                "premium_multiplier": 10,
                "renewal_price": 0.005,
                "is_premium": True,
                "description": "NXD Protocol native domain"
            },
            "web3": {
                "base_price": 0.008,
                "premium_multiplier": 5,
                "renewal_price": 0.004,
                "is_premium": True,
                "description": "Web3 focused domain"
            },
            "dao": {
                "base_price": 0.012,
                "premium_multiplier": 8,
                "renewal_price": 0.006,
                "is_premium": True,
                "description": "Decentralized organization domain"
            },
            "defi": {
                "base_price": 0.015,
                "premium_multiplier": 12,
                "renewal_price": 0.008,
                "is_premium": True,
                "description": "DeFi protocol domain"
            },
            "nft": {
                "base_price": 0.010,
                "premium_multiplier": 6,
                "renewal_price": 0.005,
                "is_premium": True,
                "description": "NFT collection domain"
            }
        }
        
        # Domain scoring criteria
        self.scoring_weights = {
            "length": 0.25,        # Shorter is better (3-10 chars ideal)
            "brandability": 0.30,  # Easy to pronounce, remember
            "keywords": 0.20,      # Tech/crypto keywords
            "memorability": 0.25   # Uniqueness and catchiness
        }
        
        # Popular tech/crypto keywords for scoring
        self.tech_keywords = {
            "ai", "crypto", "defi", "nft", "dao", "web3", "meta", "blockchain", 
            "smart", "token", "coin", "digital", "virtual", "cyber", "tech",
            "app", "lab", "labs", "protocol", "network", "chain", "vault",
            "swap", "pool", "stake", "yield", "farm", "mint", "burn", "bridge"
        }
        
        # Character quality mappings
        self.char_quality = {
            "vowels": "aeiou",
            "easy_consonants": "bcdfghjklmnpqrstvwxyz",
            "hard_consonants": "qxz",
            "numbers": "0123456789"
        }
    
    async def check_domain_availability(self, domain_name: str, tld: str) -> Dict[str, Any]:
        """
        Check if a domain is available for registration
        """
        try:
            full_domain = f"{domain_name}.{tld}"
            
            # Validate domain format
            validation_result = self._validate_domain_format(domain_name, tld)
            if not validation_result["valid"]:
                return {
                    "available": False,
                    "full_domain": full_domain,
                    "error": validation_result["error"],
                    "suggestions": []
                }
            
            # Check against existing registrations (would query database in production)
            is_available = await self._check_registration_status(domain_name, tld)
            
            # Calculate domain score if available
            score = None
            estimated_value = 0
            if is_available:
                score_result = await self.score_domain(domain_name, tld)
                score = score_result
                estimated_value = self._estimate_domain_value(domain_name, tld, score_result.overall_score)
            
            # Generate suggestions if not available
            suggestions = []
            if not is_available:
                suggestions = await self.generate_domain_suggestions(domain_name, tld, limit=5)
            
            return {
                "available": is_available,
                "full_domain": full_domain,
                "domain_name": domain_name,
                "tld": tld,
                "score": score.__dict__ if score else None,
                "estimated_value": estimated_value,
                "pricing": self._get_domain_pricing(domain_name, tld, score),
                "suggestions": [s.__dict__ for s in suggestions]
            }
            
        except Exception as e:
            logger.error("Domain availability check failed", domain=f"{domain_name}.{tld}", error=str(e))
            return {
                "available": False,
                "error": str(e)
            }
    
    async def score_domain(self, domain_name: str, tld: str) -> DomainScore:
        """
        Score a domain based on various criteria
        """
        # Length scoring (3-10 characters is ideal)
        length_score = self._score_length(domain_name)
        
        # Brandability scoring (pronounceable, memorable)
        brandability_score = self._score_brandability(domain_name)
        
        # Keyword scoring (tech/crypto relevance)
        keyword_score = self._score_keywords(domain_name)
        
        # Memorability scoring (uniqueness, catchiness)
        memorability_score = self._score_memorability(domain_name)
        
        # Calculate overall score
        overall_score = (
            length_score * self.scoring_weights["length"] +
            brandability_score * self.scoring_weights["brandability"] +
            keyword_score * self.scoring_weights["keywords"] +
            memorability_score * self.scoring_weights["memorability"]
        )
        
        # Estimate market value
        market_value = self._estimate_domain_value(domain_name, tld, overall_score)
        
        # Generate scoring reasons
        reasons = self._generate_scoring_reasons(
            domain_name, length_score, brandability_score, 
            keyword_score, memorability_score
        )
        
        return DomainScore(
            overall_score=round(overall_score, 2),
            length_score=round(length_score, 2),
            brandability_score=round(brandability_score, 2),
            keyword_score=round(keyword_score, 2),
            memorability_score=round(memorability_score, 2),
            market_value=round(market_value, 4),
            reasons=reasons
        )
    
    async def generate_domain_suggestions(
        self, 
        base_name: str, 
        preferred_tld: str = "nxd", 
        limit: int = 10
    ) -> List[DomainSuggestion]:
        """
        Generate creative domain suggestions based on input
        """
        suggestions = []
        
        # Strategy 1: Variations of the original name
        variations = self._generate_name_variations(base_name)
        
        # Strategy 2: Add prefixes/suffixes
        enhanced_names = self._generate_enhanced_names(base_name)
        
        # Strategy 3: Tech/crypto related combinations
        tech_combinations = self._generate_tech_combinations(base_name)
        
        # Combine all suggestions
        all_candidates = variations + enhanced_names + tech_combinations
        
        # Score and filter suggestions
        for candidate in all_candidates[:limit * 3]:  # Check more than needed
            try:
                # Check availability
                availability = await self.check_domain_availability(candidate, preferred_tld)
                
                if availability.get("available", False):
                    score_result = availability.get("score")
                    
                    suggestion = DomainSuggestion(
                        name=candidate,
                        tld=preferred_tld,
                        full_domain=f"{candidate}.{preferred_tld}",
                        available=True,
                        score=score_result["overall_score"] if score_result else 0,
                        category=self._categorize_domain(candidate, score_result["overall_score"] if score_result else 0),
                        estimated_value=availability.get("estimated_value", 0),
                        reasons=score_result["reasons"] if score_result else []
                    )
                    
                    suggestions.append(suggestion)
                    
                    if len(suggestions) >= limit:
                        break
                        
            except Exception as e:
                logger.warning("Error processing suggestion", candidate=candidate, error=str(e))
                continue
        
        # Sort by score
        suggestions.sort(key=lambda x: x.score, reverse=True)
        
        return suggestions[:limit]
    
    async def analyze_domain_market(self, domain_name: str, tld: str) -> Dict[str, Any]:
        """
        Analyze domain market value and trends
        """
        try:
            # Get domain score
            score = await self.score_domain(domain_name, tld)
            
            # Analyze similar domains (would query database/market data in production)
            similar_domains = await self._find_similar_domains(domain_name, tld)
            
            # Market trend analysis
            market_trends = await self._analyze_market_trends(tld)
            
            # Price recommendations
            price_recommendations = self._generate_price_recommendations(
                domain_name, tld, score, similar_domains, market_trends
            )
            
            return {
                "domain": f"{domain_name}.{tld}",
                "score": score.__dict__,
                "market_analysis": {
                    "similar_domains": similar_domains,
                    "market_trends": market_trends,
                    "price_recommendations": price_recommendations,
                    "investment_potential": self._assess_investment_potential(score, market_trends),
                    "liquidity_estimate": self._estimate_liquidity(domain_name, tld, score)
                },
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error("Domain market analysis failed", domain=f"{domain_name}.{tld}", error=str(e))
            return {
                "error": str(e)
            }
    
    def _validate_domain_format(self, domain_name: str, tld: str) -> Dict[str, Any]:
        """Validate domain name format"""
        # Check length
        if len(domain_name) < 1 or len(domain_name) > 63:
            return {"valid": False, "error": "Domain name must be 1-63 characters long"}
        
        # Check characters (alphanumeric and hyphens)
        if not re.match(r'^[a-zA-Z0-9-]+$', domain_name):
            return {"valid": False, "error": "Domain name can only contain letters, numbers, and hyphens"}
        
        # Cannot start or end with hyphen
        if domain_name.startswith('-') or domain_name.endswith('-'):
            return {"valid": False, "error": "Domain name cannot start or end with a hyphen"}
        
        # Check TLD
        if tld not in self.tlds:
            return {"valid": False, "error": f"TLD '{tld}' is not supported"}
        
        return {"valid": True}
    
    async def _check_registration_status(self, domain_name: str, tld: str) -> bool:
        """Check if domain is already registered"""
        # In production, this would query the database
        # For now, simulate some registrations
        taken_domains = {
            "test", "example", "demo", "admin", "api", "www", "mail", 
            "bitcoin", "ethereum", "crypto", "defi", "nft", "dao"
        }
        
        return domain_name.lower() not in taken_domains
    
    def _score_length(self, domain_name: str) -> float:
        """Score domain based on length (shorter is generally better)"""
        length = len(domain_name)
        
        if length <= 3:
            return 100  # Very short, premium
        elif length <= 6:
            return 90   # Short, excellent
        elif length <= 10:
            return 75   # Good length
        elif length <= 15:
            return 50   # Acceptable
        else:
            return 25   # Too long
    
    def _score_brandability(self, domain_name: str) -> float:
        """Score domain brandability (pronounceability, memorability)"""
        score = 50  # Base score
        
        # Vowel-consonant balance
        vowels = sum(1 for c in domain_name.lower() if c in self.char_quality["vowels"])
        consonants = len(domain_name) - vowels
        
        if vowels > 0 and consonants > 0:
            ratio = min(vowels, consonants) / max(vowels, consonants)
            score += ratio * 30  # Up to 30 points for good balance
        
        # Avoid hard consonant clusters
        hard_clusters = ["qq", "xx", "zz", "qx", "xz"]
        for cluster in hard_clusters:
            if cluster in domain_name.lower():
                score -= 15
        
        # Bonus for dictionary words or word-like patterns
        if self._is_word_like(domain_name):
            score += 20
        
        return min(100, max(0, score))
    
    def _score_keywords(self, domain_name: str) -> float:
        """Score domain based on tech/crypto keyword relevance"""
        score = 0
        domain_lower = domain_name.lower()
        
        # Direct keyword matches
        for keyword in self.tech_keywords:
            if keyword in domain_lower:
                # Full word match gets more points
                if keyword == domain_lower:
                    score += 50
                # Partial match gets fewer points
                elif len(keyword) >= 3:  # Only count substantial keywords
                    score += 25
        
        # Bonus for crypto/web3 specific terms
        web3_terms = ["web3", "crypto", "defi", "nft", "dao", "blockchain"]
        for term in web3_terms:
            if term in domain_lower:
                score += 30
        
        return min(100, score)
    
    def _score_memorability(self, domain_name: str) -> float:
        """Score domain memorability and uniqueness"""
        score = 50  # Base score
        
        # Avoid common patterns that reduce memorability
        common_patterns = ["123", "000", "999", "aaa", "abc"]
        for pattern in common_patterns:
            if pattern in domain_name.lower():
                score -= 20
        
        # Bonus for unique but pronounceable combinations
        if self._has_unique_pattern(domain_name):
            score += 25
        
        # Penalty for too many numbers
        num_digits = sum(1 for c in domain_name if c.isdigit())
        if num_digits > len(domain_name) * 0.5:  # More than 50% numbers
            score -= 30
        
        return min(100, max(0, score))
    
    def _estimate_domain_value(self, domain_name: str, tld: str, score: float) -> float:
        """Estimate domain value in ETH"""
        base_price = self.tlds.get(tld, {}).get("base_price", 0.01)
        
        # Value multiplier based on score
        if score >= 90:
            multiplier = 20  # Premium domains
        elif score >= 75:
            multiplier = 10  # High-quality domains
        elif score >= 60:
            multiplier = 5   # Good domains
        elif score >= 40:
            multiplier = 2   # Average domains
        else:
            multiplier = 1   # Standard domains
        
        # Length bonus (shorter = more valuable)
        length_bonus = max(0, (10 - len(domain_name)) * 0.1)
        
        estimated_value = base_price * multiplier + length_bonus
        
        return estimated_value
    
    def _get_domain_pricing(self, domain_name: str, tld: str, score: Optional[DomainScore]) -> Dict[str, float]:
        """Get domain pricing information"""
        tld_config = self.tlds.get(tld, {})
        base_price = tld_config.get("base_price", 0.01)
        
        # Determine if premium based on score
        is_premium = False
        if score and score.overall_score >= 75:
            is_premium = True
            premium_multiplier = tld_config.get("premium_multiplier", 5)
            registration_price = base_price * premium_multiplier
        else:
            registration_price = base_price
        
        return {
            "registration_eth": registration_price,
            "renewal_eth": tld_config.get("renewal_price", base_price * 0.5),
            "is_premium": is_premium,
            "estimated_market_value": score.market_value if score else registration_price
        }
    
    def _generate_name_variations(self, base_name: str) -> List[str]:
        """Generate variations of the base name"""
        variations = []
        base_lower = base_name.lower()
        
        # Add common prefixes
        prefixes = ["my", "get", "the", "use", "go", "try", "pro", "smart", "meta", "web3"]
        for prefix in prefixes:
            variations.append(f"{prefix}{base_lower}")
        
        # Add common suffixes
        suffixes = ["app", "io", "ai", "lab", "pro", "hub", "net", "xyz", "tech", "defi"]
        for suffix in suffixes:
            variations.append(f"{base_lower}{suffix}")
        
        # Shortened versions
        if len(base_name) > 4:
            variations.append(base_lower[:3])
            variations.append(base_lower[:4])
        
        return variations
    
    def _generate_enhanced_names(self, base_name: str) -> List[str]:
        """Generate enhanced versions with tech terms"""
        enhanced = []
        base_lower = base_name.lower()
        
        tech_enhancers = ["ai", "web3", "defi", "nft", "dao", "meta", "crypto", "smart"]
        
        for enhancer in tech_enhancers:
            enhanced.append(f"{enhancer}{base_lower}")
            enhanced.append(f"{base_lower}{enhancer}")
        
        return enhanced
    
    def _generate_tech_combinations(self, base_name: str) -> List[str]:
        """Generate tech/crypto themed combinations"""
        combinations = []
        base_lower = base_name.lower()
        
        # Common crypto/tech combinations
        tech_words = ["protocol", "network", "chain", "vault", "swap", "pool", "bridge"]
        
        for word in tech_words:
            if len(f"{base_lower}{word}") <= 15:  # Keep reasonable length
                combinations.append(f"{base_lower}{word}")
        
        return combinations
    
    def _categorize_domain(self, domain_name: str, score: float) -> str:
        """Categorize domain based on score and characteristics"""
        if score >= 80:
            return "premium"
        elif score >= 60:
            return "standard"
        else:
            return "creative"
    
    def _is_word_like(self, domain_name: str) -> bool:
        """Check if domain resembles a real word"""
        # Simple heuristic: alternating vowels and consonants
        vowel_positions = [i for i, c in enumerate(domain_name.lower()) if c in self.char_quality["vowels"]]
        return len(vowel_positions) >= 2 and len(vowel_positions) <= len(domain_name) * 0.6
    
    def _has_unique_pattern(self, domain_name: str) -> bool:
        """Check for unique but memorable patterns"""
        # Look for interesting patterns like alliteration, rhyming, etc.
        if len(set(domain_name.lower())) < len(domain_name) * 0.5:
            return False  # Too repetitive
        
        return True  # Placeholder for more complex pattern analysis
    
    async def _find_similar_domains(self, domain_name: str, tld: str) -> List[Dict]:
        """Find similar domains for market comparison"""
        # Placeholder - would query marketplace/sales data in production
        return [
            {"domain": f"similar1.{tld}", "last_sale_price": 0.5, "sale_date": "2024-01-15"},
            {"domain": f"similar2.{tld}", "last_sale_price": 1.2, "sale_date": "2024-02-20"}
        ]
    
    async def _analyze_market_trends(self, tld: str) -> Dict[str, Any]:
        """Analyze market trends for the TLD"""
        # Placeholder - would analyze real market data in production
        return {
            "average_sale_price": 0.8,
            "price_trend": "increasing",
            "volume_trend": "stable",
            "popular_categories": ["defi", "nft", "dao"],
            "seasonal_patterns": {"q1": 1.1, "q2": 0.9, "q3": 1.0, "q4": 1.2}
        }
    
    def _generate_price_recommendations(
        self, 
        domain_name: str, 
        tld: str, 
        score: DomainScore, 
        similar_domains: List[Dict], 
        market_trends: Dict
    ) -> Dict[str, float]:
        """Generate pricing recommendations"""
        base_value = score.market_value
        
        # Adjust based on market trends
        trend_multiplier = 1.0
        if market_trends.get("price_trend") == "increasing":
            trend_multiplier = 1.2
        elif market_trends.get("price_trend") == "decreasing":
            trend_multiplier = 0.8
        
        return {
            "suggested_listing_price": base_value * trend_multiplier,
            "minimum_acceptable_price": base_value * 0.7,
            "premium_price": base_value * 1.5,
            "market_adjusted_value": base_value * trend_multiplier
        }
    
    def _assess_investment_potential(self, score: DomainScore, market_trends: Dict) -> str:
        """Assess domain investment potential"""
        if score.overall_score >= 80 and market_trends.get("price_trend") == "increasing":
            return "high"
        elif score.overall_score >= 60:
            return "medium"
        else:
            return "low"
    
    def _estimate_liquidity(self, domain_name: str, tld: str, score: DomainScore) -> str:
        """Estimate how quickly domain might sell"""
        if score.overall_score >= 85:
            return "high"
        elif score.overall_score >= 65:
            return "medium"
        else:
            return "low"
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for domain service"""
        try:
            # Test domain scoring
            test_score = await self.score_domain("test", "nxd")
            
            # Test suggestion generation
            test_suggestions = await self.generate_domain_suggestions("example", "nxd", limit=3)
            
            return {
                "status": "healthy",
                "supported_tlds": list(self.tlds.keys()),
                "scoring_system": "operational",
                "suggestion_engine": "operational",
                "test_score_generated": test_score.overall_score > 0,
                "test_suggestions_count": len(test_suggestions)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }