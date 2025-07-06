"""
AI Gateway Service
Integrates multiple AI providers (xAI Grok, OpenAI, Anthropic, DeepSeek, Poe) for autonomous operations
"""
import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
import structlog
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from core.config import settings

logger = structlog.get_logger()

class AIGateway:
    """
    AI Gateway managing multiple AI providers for autonomous NXD Platform operations
    """
    
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
        
        # AI Provider configurations
        self.providers = {
            "grok": {
                "api_url": "https://api.x.ai/v1/chat/completions",
                "api_key": settings.XAI_API_KEY,
                "model": "grok-3",
                "max_tokens": 4000,
                "priority": 1  # Highest priority for autonomous operations
            },
            "openai": {
                "client": self.openai_client,
                "model": "gpt-4-turbo-preview",
                "max_tokens": 4000,
                "priority": 2
            },
            "anthropic": {
                "client": self.anthropic_client,
                "model": "claude-3-opus-20240229",
                "max_tokens": 4000,
                "priority": 3
            },
            "deepseek": {
                "api_url": "https://api.deepseek.com/v1/chat/completions",
                "api_key": settings.DEEPSEEK_API_KEY,
                "model": "deepseek-chat",
                "max_tokens": 4000,
                "priority": 4
            },
            "poe": {
                "api_url": "https://api.poe.com/v1/chat/completions",
                "api_key": settings.POE_API_KEY,
                "model": "claude-3-opus",
                "max_tokens": 4000,
                "priority": 5
            }
        }
        
        # Autonomous operation contexts
        self.operation_contexts = {
            "domain_approval": {
                "system_prompt": """You are an AI system for the NXD Platform responsible for autonomous domain approval.
                Evaluate domain registration requests based on:
                1. Name appropriateness (no offensive content, spam, or trademark violations)
                2. TLD compatibility
                3. Compliance with platform policies
                4. Potential value and utility
                
                Respond with JSON: {"approved": boolean, "reason": string, "score": number (0-100)}""",
                "provider": "grok"
            },
            "fee_adjustment": {
                "system_prompt": """You are an AI system managing dynamic fee adjustments for the NXD Platform.
                Analyze market conditions, demand patterns, and platform utilization to recommend fee changes.
                Consider:
                1. Current registration volume
                2. Market competition
                3. Platform sustainability
                4. User adoption trends
                
                Respond with JSON: {"fee_adjustment": number (percentage), "reason": string, "duration": string}""",
                "provider": "grok"
            },
            "governance_proposal": {
                "system_prompt": """You are an AI system generating governance proposals for the NXD DAO.
                Create well-structured proposals for platform improvements based on:
                1. Platform analytics and user feedback
                2. Technical requirements
                3. Market opportunities
                4. Community needs
                
                Respond with JSON: {"title": string, "description": string, "actions": array, "voting_duration": number}""",
                "provider": "grok"
            },
            "market_analysis": {
                "system_prompt": """You are an AI analyst for the NXD Platform providing market insights.
                Analyze Web3 domain market trends, competitor activities, and growth opportunities.
                
                Respond with JSON: {"trends": array, "opportunities": array, "threats": array, "recommendations": array}""",
                "provider": "openai"
            },
            "user_support": {
                "system_prompt": """You are a helpful AI assistant for the NXD Platform.
                Provide clear, accurate information about domain registration, staking, governance, and platform features.
                Escalate complex technical issues to human support.
                
                Always be helpful, professional, and accurate.""",
                "provider": "anthropic"
            },
            "anomaly_detection": {
                "system_prompt": """You are an AI security system for the NXD Platform.
                Analyze platform activities for potential anomalies, security threats, or unusual patterns.
                
                Respond with JSON: {"anomaly_detected": boolean, "severity": string, "description": string, "recommended_actions": array}""",
                "provider": "grok"
            }
        }
        
        # Decision logging for transparency
        self.decision_log = []
    
    async def process_autonomous_request(
        self, 
        operation_type: str, 
        context_data: Dict[str, Any],
        user_override: bool = False
    ) -> Dict[str, Any]:
        """
        Process autonomous operation requests
        """
        try:
            if operation_type not in self.operation_contexts:
                raise ValueError(f"Unknown operation type: {operation_type}")
            
            operation_config = self.operation_contexts[operation_type]
            provider = operation_config["provider"]
            
            # Prepare the prompt with context data
            user_prompt = self._prepare_context_prompt(operation_type, context_data)
            
            # Get AI response
            response = await self._call_ai_provider(
                provider,
                operation_config["system_prompt"],
                user_prompt
            )
            
            # Log the decision
            decision_log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation_type": operation_type,
                "provider": provider,
                "context_data": context_data,
                "ai_response": response,
                "user_override": user_override
            }
            self.decision_log.append(decision_log_entry)
            
            # Keep only last 1000 entries
            if len(self.decision_log) > 1000:
                self.decision_log = self.decision_log[-1000:]
            
            return {
                "success": True,
                "operation_type": operation_type,
                "provider": provider,
                "response": response,
                "timestamp": decision_log_entry["timestamp"]
            }
            
        except Exception as e:
            logger.error("AI operation failed", operation_type=operation_type, error=str(e))
            return {
                "success": False,
                "operation_type": operation_type,
                "error": str(e)
            }
    
    async def _call_ai_provider(self, provider: str, system_prompt: str, user_prompt: str) -> str:
        """Call specific AI provider"""
        try:
            if provider == "grok":
                return await self._call_grok(system_prompt, user_prompt)
            elif provider == "openai":
                return await self._call_openai(system_prompt, user_prompt)
            elif provider == "anthropic":
                return await self._call_anthropic(system_prompt, user_prompt)
            elif provider == "deepseek":
                return await self._call_deepseek(system_prompt, user_prompt)
            elif provider == "poe":
                return await self._call_poe(system_prompt, user_prompt)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except Exception as e:
            logger.error("AI provider call failed", provider=provider, error=str(e))
            # Fallback to next available provider
            return await self._fallback_provider_call(provider, system_prompt, user_prompt)
    
    async def _call_grok(self, system_prompt: str, user_prompt: str) -> str:
        """Call xAI Grok API"""
        if not settings.XAI_API_KEY:
            raise ValueError("XAI API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.providers["grok"]["api_url"],
                headers={
                    "Authorization": f"Bearer {settings.XAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.providers["grok"]["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": self.providers["grok"]["max_tokens"],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenAI API"""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        response = await self.openai_client.chat.completions.create(
            model=self.providers["openai"]["model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=self.providers["openai"]["max_tokens"],
            temperature=0.7
        )
        return response.choices[0].message.content
    
    async def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        """Call Anthropic Claude API"""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        response = await self.anthropic_client.messages.create(
            model=self.providers["anthropic"]["model"],
            max_tokens=self.providers["anthropic"]["max_tokens"],
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        return response.content[0].text
    
    async def _call_deepseek(self, system_prompt: str, user_prompt: str) -> str:
        """Call DeepSeek API"""
        if not settings.DEEPSEEK_API_KEY:
            raise ValueError("DeepSeek API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.providers["deepseek"]["api_url"],
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.providers["deepseek"]["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": self.providers["deepseek"]["max_tokens"],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_poe(self, system_prompt: str, user_prompt: str) -> str:
        """Call Poe API (mock implementation)"""
        # Poe doesn't have a direct API, this is a placeholder
        return f"Poe response for: {user_prompt[:100]}..."
    
    async def _fallback_provider_call(self, failed_provider: str, system_prompt: str, user_prompt: str) -> str:
        """Fallback to next available provider"""
        available_providers = [p for p in self.providers.keys() if p != failed_provider]
        available_providers.sort(key=lambda p: self.providers[p]["priority"])
        
        for provider in available_providers:
            try:
                return await self._call_ai_provider(provider, system_prompt, user_prompt)
            except Exception:
                continue
        
        # If all providers fail, return a fallback response
        return "AI service temporarily unavailable. Please try again later."

    # New methods for API endpoints
    async def enhance_domain_suggestions(self, suggestions: List[Any]) -> List[Any]:
        """Enhance domain suggestions with AI scoring"""
        try:
            enhanced = []
            for suggestion in suggestions:
                # Mock enhancement - in production, use AI to score suggestions
                suggestion.ai_score = suggestion.score * 0.9  # Slight adjustment
                enhanced.append(suggestion)
            return enhanced
        except Exception as e:
            logger.error("Domain suggestion enhancement failed", error=str(e))
            return suggestions

    async def process_chat_message(self, message: str, context: Optional[str] = None, user_address: Optional[str] = None) -> Any:
        """Process chat message and return AI response"""
        try:
            system_prompt = """You are an AI assistant for the NXD Platform, a Web3 domain management system. 
            Help users with domain registration, staking, governance, and platform navigation. 
            Be helpful, informative, and guide users toward appropriate actions."""
            
            user_prompt = f"User message: {message}"
            if context:
                user_prompt += f"\nContext: {context}"
            if user_address:
                user_prompt += f"\nUser address: {user_address}"
            
            response_text = await self._call_ai_provider("grok", system_prompt, user_prompt)
            
            # Mock response object
            class ChatResponse:
                def __init__(self, message, suggested_actions=None, context=None):
                    self.message = message
                    self.suggested_actions = suggested_actions or []
                    self.context = context
            
            return ChatResponse(
                message=response_text,
                suggested_actions=["Check domain availability", "View staking options"],
                context="general_help"
            )
            
        except Exception as e:
            logger.error("Chat processing failed", error=str(e))
            class ChatResponse:
                def __init__(self, message):
                    self.message = message
                    self.suggested_actions = []
                    self.context = None
            return ChatResponse("I'm having trouble processing your request. Please try again.")

    async def analyze_domain(self, domain: str, domain_data: Dict[str, Any], analysis_type: str = "comprehensive") -> Any:
        """Analyze domain with AI insights"""
        try:
            system_prompt = """You are a domain valuation expert. Analyze the provided domain and give insights on:
            - Market potential
            - Brand value
            - Investment opportunity
            - Recommendations"""
            
            user_prompt = f"""Analyze domain: {domain}
            Data: {json.dumps(domain_data, indent=2)}
            Analysis type: {analysis_type}"""
            
            analysis_text = await self._call_ai_provider("grok", system_prompt, user_prompt)
            
            # Mock analysis object
            class DomainAnalysis:
                def __init__(self):
                    self.analysis = analysis_text
                    self.score = domain_data.get("score", {}).get("overall_score", 0.5)
                    self.market_insights = ["Domain has strong brandability", "Tech keywords increase value"]
                    self.recommendations = ["Consider registering", "Good for tech startups"]
                    self.confidence = 0.85
            
            return DomainAnalysis()
            
        except Exception as e:
            logger.error("Domain analysis failed", error=str(e))
            class DomainAnalysis:
                def __init__(self):
                    self.analysis = "Analysis unavailable"
                    self.score = 0.5
                    self.market_insights = []
                    self.recommendations = []
                    self.confidence = 0.0
            return DomainAnalysis()

    async def make_autonomous_decision(self, decision_type: str, context: Dict[str, Any], requires_approval: bool = True) -> Any:
        """Make autonomous AI decision"""
        try:
            system_prompt = f"""You are an autonomous AI system for the NXD Platform making a {decision_type} decision.
            Consider the context carefully and make a reasoned decision with clear justification."""
            
            user_prompt = f"""Decision type: {decision_type}
            Context: {json.dumps(context, indent=2)}
            Requires approval: {requires_approval}"""
            
            decision_text = await self._call_ai_provider("grok", system_prompt, user_prompt)
            
            # Mock decision object
            class Decision:
                def __init__(self):
                    self.id = f"decision_{int(datetime.now().timestamp())}"
                    self.action = decision_text[:200]  # Truncate for demo
                    self.confidence = 0.8
                    self.reasoning = decision_text
                    self.auto_execute = not requires_approval and self.confidence > 0.7
                    self.requires_approval = requires_approval
            
            return Decision()
            
        except Exception as e:
            logger.error("Autonomous decision failed", error=str(e))
            class Decision:
                def __init__(self):
                    self.id = "error"
                    self.action = "Decision unavailable"
                    self.confidence = 0.0
                    self.reasoning = "AI service error"
                    self.auto_execute = False
                    self.requires_approval = True
            return Decision()

    async def execute_decision(self, decision: Any):
        """Execute an AI decision"""
        try:
            logger.info("Executing AI decision", decision_id=decision.id, action=decision.action)
            # In production, this would execute the actual decision
            
        except Exception as e:
            logger.error("Decision execution failed", error=str(e))

    async def generate_domain_suggestions(self, prompt: str, category: Optional[str] = None, count: int = 10) -> List[str]:
        """Generate domain name suggestions using AI"""
        try:
            system_prompt = """You are a creative domain name generator. Generate catchy, brandable domain names 
            that are memorable, easy to spell, and relevant to the prompt. Focus on Web3, tech, and modern naming conventions."""
            
            user_prompt = f"Generate {count} domain name suggestions for: {prompt}"
            if category:
                user_prompt += f" in the {category} category"
            
            response = await self._call_ai_provider("grok", system_prompt, user_prompt)
            
            # Extract domain names from response (mock implementation)
            suggestions = [
                f"{prompt.lower()}app",
                f"{prompt.lower()}lab",
                f"get{prompt.lower()}",
                f"{prompt.lower()}pro",
                f"my{prompt.lower()}",
                f"{prompt.lower()}hub",
                f"{prompt.lower()}net",
                f"super{prompt.lower()}",
                f"{prompt.lower()}dao",
                f"meta{prompt.lower()}"
            ][:count]
            
            return suggestions
            
        except Exception as e:
            logger.error("Domain suggestion generation failed", error=str(e))
            return [f"{prompt.lower()}{i}" for i in range(1, count + 1)]

    async def generate_predictions(self, metric: str, timeframe: str) -> Any:
        """Generate AI predictions for platform metrics"""
        try:
            system_prompt = """You are a data analyst specializing in Web3 and domain market predictions. 
            Analyze trends and provide realistic forecasts with confidence intervals."""
            
            user_prompt = f"Generate predictions for {metric} over {timeframe} timeframe"
            
            prediction_text = await self._call_ai_provider("grok", system_prompt, user_prompt)
            
            # Mock prediction object
            class Prediction:
                def __init__(self):
                    self.data_points = [
                        {"date": "2025-07-07", "value": 100, "confidence": 0.9},
                        {"date": "2025-07-14", "value": 120, "confidence": 0.8},
                        {"date": "2025-07-21", "value": 150, "confidence": 0.7},
                        {"date": "2025-07-28", "value": 180, "confidence": 0.6}
                    ]
                    self.confidence = 0.75
                    self.key_factors = ["Market growth", "Platform adoption", "Tech trends"]
                    self.timestamp = datetime.now().isoformat()
            
            return Prediction()
            
        except Exception as e:
            logger.error("Prediction generation failed", error=str(e))
            class Prediction:
                def __init__(self):
                    self.data_points = []
                    self.confidence = 0.0
                    self.key_factors = []
                    self.timestamp = datetime.now().isoformat()
            return Prediction()

    async def process_voice_command(self, audio_data: str) -> Any:
        """Process voice command through AI"""
        try:
            # Mock voice processing - in production, would use speech-to-text then AI processing
            class VoiceResult:
                def __init__(self):
                    self.transcript = "Check domain availability for example.nxd"
                    self.intent = "domain_check"
                    self.action = "check_availability"
                    self.confidence = 0.85
                    self.response = "I'll check the availability of example.nxd for you."
            
            return VoiceResult()
            
        except Exception as e:
            logger.error("Voice processing failed", error=str(e))
            class VoiceResult:
                def __init__(self):
                    self.transcript = "Could not process audio"
                    self.intent = "unknown"
                    self.action = "none"
                    self.confidence = 0.0
                    self.response = "I couldn't understand your voice command."
            return VoiceResult()

    async def get_service_status(self) -> Any:
        """Get AI service status"""
        try:
            # Check provider availability
            provider_status = {}
            for provider, config in self.providers.items():
                try:
                    if provider == "grok" and settings.XAI_API_KEY:
                        provider_status[provider] = "available"
                    elif provider == "openai" and self.openai_client:
                        provider_status[provider] = "available"
                    elif provider == "anthropic" and self.anthropic_client:
                        provider_status[provider] = "available"
                    else:
                        provider_status[provider] = "unavailable"
                except:
                    provider_status[provider] = "error"
            
            class ServiceStatus:
                def __init__(self):
                    self.provider_status = provider_status
                    self.autonomous_enabled = True
                    self.pending_decisions = 0
                    self.last_prediction_time = datetime.now().isoformat()
                    self.uptime_seconds = 3600  # 1 hour mock uptime
            
            return ServiceStatus()
            
        except Exception as e:
            logger.error("Service status check failed", error=str(e))
            class ServiceStatus:
                def __init__(self):
                    self.provider_status = {}
                    self.autonomous_enabled = False
                    self.pending_decisions = 0
                    self.last_prediction_time = None
                    self.uptime_seconds = 0
            return ServiceStatus()
        
        response = await self.anthropic_client.messages.create(
            model=self.providers["anthropic"]["model"],
            max_tokens=self.providers["anthropic"]["max_tokens"],
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.content[0].text
    
    async def _call_deepseek(self, system_prompt: str, user_prompt: str) -> str:
        """Call DeepSeek API"""
        if not settings.DEEPSEEK_API_KEY:
            raise ValueError("DeepSeek API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.providers["deepseek"]["api_url"],
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.providers["deepseek"]["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": self.providers["deepseek"]["max_tokens"],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_poe(self, system_prompt: str, user_prompt: str) -> str:
        """Call Poe AI API"""
        if not settings.POE_API_KEY:
            raise ValueError("Poe API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.providers["poe"]["api_url"],
                headers={
                    "Authorization": f"Bearer {settings.POE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.providers["poe"]["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": self.providers["poe"]["max_tokens"],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _fallback_provider_call(self, failed_provider: str, system_prompt: str, user_prompt: str) -> str:
        """Fallback to next available provider"""
        # Sort providers by priority
        sorted_providers = sorted(
            [(name, config) for name, config in self.providers.items() if name != failed_provider],
            key=lambda x: x[1]["priority"]
        )
        
        for provider_name, _ in sorted_providers:
            try:
                return await self._call_ai_provider(provider_name, system_prompt, user_prompt)
            except Exception as e:
                logger.warning("Fallback provider failed", provider=provider_name, error=str(e))
                continue
        
        raise Exception("All AI providers failed")
    
    def _prepare_context_prompt(self, operation_type: str, context_data: Dict[str, Any]) -> str:
        """Prepare context-specific prompt"""
        if operation_type == "domain_approval":
            return f"""
            Domain Registration Request:
            - Domain Name: {context_data.get('domain_name', 'N/A')}
            - TLD: {context_data.get('tld', 'N/A')}
            - Registrant: {context_data.get('registrant_address', 'N/A')}
            - Content Type: {context_data.get('content_type', 'N/A')}
            - Additional Info: {context_data.get('additional_info', 'N/A')}
            
            Please evaluate this domain registration request.
            """
        
        elif operation_type == "fee_adjustment":
            return f"""
            Current Platform Metrics:
            - Daily Registrations: {context_data.get('daily_registrations', 0)}
            - Current Fee: {context_data.get('current_fee', 0)} ETH
            - Platform Utilization: {context_data.get('utilization_rate', 0)}%
            - Competitor Average Fee: {context_data.get('competitor_avg_fee', 0)} ETH
            - Revenue Trend: {context_data.get('revenue_trend', 'stable')}
            
            Recommend fee adjustments based on these metrics.
            """
        
        elif operation_type == "governance_proposal":
            return f"""
            Platform Status:
            - Active Domains: {context_data.get('active_domains', 0)}
            - Staking Participation: {context_data.get('staking_participation', 0)}%
            - User Feedback Summary: {context_data.get('user_feedback', 'N/A')}
            - Technical Issues: {context_data.get('technical_issues', [])}
            - Feature Requests: {context_data.get('feature_requests', [])}
            
            Generate a governance proposal to address platform needs.
            """
        
        elif operation_type == "market_analysis":
            return f"""
            Market Data:
            - Platform Growth Rate: {context_data.get('growth_rate', 0)}%
            - Market Share: {context_data.get('market_share', 0)}%
            - Competitor Activities: {context_data.get('competitor_activities', [])}
            - Industry Trends: {context_data.get('industry_trends', [])}
            - User Demographics: {context_data.get('user_demographics', {})}
            
            Provide comprehensive market analysis and recommendations.
            """
        
        elif operation_type == "user_support":
            return f"""
            User Query: {context_data.get('user_query', '')}
            User Level: {context_data.get('user_level', 'beginner')}
            Previous Context: {context_data.get('previous_context', 'None')}
            """
        
        elif operation_type == "anomaly_detection":
            return f"""
            Platform Activity Data:
            - Recent Transactions: {context_data.get('recent_transactions', [])}
            - User Behavior Patterns: {context_data.get('user_patterns', {})}
            - System Metrics: {context_data.get('system_metrics', {})}
            - Error Rates: {context_data.get('error_rates', {})}
            
            Analyze for potential anomalies or security threats.
            """
        
        return json.dumps(context_data)
    
    async def get_decision_logs(self, operation_type: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get AI decision logs for transparency"""
        logs = self.decision_log
        
        if operation_type:
            logs = [log for log in logs if log["operation_type"] == operation_type]
        
        return logs[-limit:]
    
    async def override_decision(self, log_id: str, admin_decision: Dict[str, Any], justification: str):
        """Allow admin override of AI decisions"""
        # Find the decision log entry
        for log in self.decision_log:
            if log.get("id") == log_id:
                log["admin_override"] = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "decision": admin_decision,
                    "justification": justification
                }
                break
        
        logger.info("AI decision overridden", log_id=log_id, justification=justification)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check AI service health"""
        provider_status = {}
        
        for provider_name, config in self.providers.items():
            try:
                # Simple test call
                test_response = await self._call_ai_provider(
                    provider_name,
                    "You are a test system.",
                    "Respond with 'OK' if you are working."
                )
                provider_status[provider_name] = "healthy" if "OK" in test_response else "degraded"
            except Exception as e:
                provider_status[provider_name] = f"error: {str(e)}"
        
        return {
            "overall_status": "healthy" if any(status == "healthy" for status in provider_status.values()) else "error",
            "providers": provider_status,
            "decision_log_count": len(self.decision_log)
        }