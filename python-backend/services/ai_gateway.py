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