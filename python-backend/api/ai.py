"""
AI Integration API Routes
Handles AI-powered features and autonomous operations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import structlog

from services.ai_gateway import AIGateway
from services.domain_service import DomainService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    user_address: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None
    context: Optional[str] = None

class DomainAnalysisRequest(BaseModel):
    domain: str
    analysis_type: str = "comprehensive"  # comprehensive, market, technical

class AutonomousDecisionRequest(BaseModel):
    decision_type: str  # domain_approval, fee_adjustment, proposal_generation
    context: Dict[str, Any]
    requires_approval: bool = True

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Chat with AI assistant for platform help and domain suggestions
    """
    try:
        response = await ai_gateway.process_chat_message(
            message=request.message,
            context=request.context,
            user_address=request.user_address
        )
        
        return ChatResponse(
            response=response.message,
            suggestions=response.suggested_actions,
            context=response.context
        )
        
    except Exception as e:
        logger.error("AI chat failed", error=str(e))
        raise HTTPException(status_code=500, detail="AI chat service unavailable")

@router.post("/analyze/domain")
async def analyze_domain(
    request: DomainAnalysisRequest,
    ai_gateway: AIGateway = Depends(lambda: AIGateway()),
    domain_service: DomainService = Depends(lambda: DomainService())
):
    """
    Get AI analysis of domain value and market potential
    """
    try:
        # Get domain data
        domain_data = await domain_service.get_domain_data(request.domain)
        
        # AI analysis
        analysis = await ai_gateway.analyze_domain(
            domain=request.domain,
            domain_data=domain_data,
            analysis_type=request.analysis_type
        )
        
        return {
            "domain": request.domain,
            "analysis": analysis.analysis,
            "score": analysis.score,
            "market_insights": analysis.market_insights,
            "recommendations": analysis.recommendations,
            "confidence": analysis.confidence
        }
        
    except Exception as e:
        logger.error("Domain analysis failed", domain=request.domain, error=str(e))
        raise HTTPException(status_code=500, detail="Domain analysis failed")

@router.post("/autonomous/decision")
async def autonomous_decision(
    request: AutonomousDecisionRequest,
    background_tasks: BackgroundTasks,
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Process autonomous AI decisions for platform operations
    """
    try:
        decision = await ai_gateway.make_autonomous_decision(
            decision_type=request.decision_type,
            context=request.context,
            requires_approval=request.requires_approval
        )
        
        if decision.auto_execute and not request.requires_approval:
            # Execute decision immediately
            background_tasks.add_task(
                ai_gateway.execute_decision,
                decision
            )
            
        return {
            "decision_id": decision.id,
            "decision": decision.action,
            "confidence": decision.confidence,
            "reasoning": decision.reasoning,
            "auto_executed": decision.auto_execute and not request.requires_approval,
            "requires_approval": decision.requires_approval
        }
        
    except Exception as e:
        logger.error("Autonomous decision failed", error=str(e))
        raise HTTPException(status_code=500, detail="Autonomous decision failed")

@router.get("/suggestions/domains")
async def get_domain_suggestions(
    prompt: str,
    category: Optional[str] = None,
    count: int = 10,
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Get AI-powered domain name suggestions
    """
    try:
        suggestions = await ai_gateway.generate_domain_suggestions(
            prompt=prompt,
            category=category,
            count=count
        )
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error("Domain suggestions failed", error=str(e))
        raise HTTPException(status_code=500, detail="Domain suggestions failed")

@router.get("/analytics/predictions")
async def get_ai_predictions(
    metric: str,  # domain_registrations, staking_trends, revenue
    timeframe: str = "30d",
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Get AI predictions for platform metrics
    """
    try:
        predictions = await ai_gateway.generate_predictions(
            metric=metric,
            timeframe=timeframe
        )
        
        return {
            "metric": metric,
            "timeframe": timeframe,
            "predictions": predictions.data_points,
            "confidence": predictions.confidence,
            "factors": predictions.key_factors,
            "generated_at": predictions.timestamp
        }
        
    except Exception as e:
        logger.error("AI predictions failed", error=str(e))
        raise HTTPException(status_code=500, detail="AI predictions failed")

@router.post("/voice/process")
async def process_voice_command(
    audio_data: str,  # Base64 encoded audio
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Process voice commands through AI
    """
    try:
        result = await ai_gateway.process_voice_command(audio_data)
        
        return {
            "transcript": result.transcript,
            "intent": result.intent,
            "action": result.action,
            "confidence": result.confidence,
            "response": result.response
        }
        
    except Exception as e:
        logger.error("Voice processing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Voice processing failed")

@router.get("/status")
async def get_ai_status(
    ai_gateway: AIGateway = Depends(lambda: AIGateway())
):
    """
    Get AI services status and health
    """
    try:
        status = await ai_gateway.get_service_status()
        
        return {
            "providers": status.provider_status,
            "autonomous_operations": status.autonomous_enabled,
            "decisions_pending": status.pending_decisions,
            "last_prediction": status.last_prediction_time,
            "uptime": status.uptime_seconds
        }
        
    except Exception as e:
        logger.error("AI status check failed", error=str(e))
        raise HTTPException(status_code=500, detail="AI status unavailable")