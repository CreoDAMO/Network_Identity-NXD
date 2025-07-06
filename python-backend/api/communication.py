"""
Communication API Routes
Handles Web3 messaging, WebRTC calls, and IPFS file transfers
"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket
from typing import List, Optional
from pydantic import BaseModel
import structlog

from services.communication_service import CommunicationService

logger = structlog.get_logger()
router = APIRouter(prefix="/api/communication", tags=["communication"])

class MessageRequest(BaseModel):
    recipient: str
    content: str
    sender: str
    channel: str = "general"
    encrypt: bool = True

class CallRequest(BaseModel):
    caller: str
    callee: str
    call_type: str = "voice"  # voice, video

@router.post("/messages")
async def send_message(
    request: MessageRequest,
    comm_service: CommunicationService = Depends(lambda: CommunicationService())
):
    """
    Send encrypted message via Waku network
    """
    try:
        message_id = await comm_service.send_waku_message(
            recipient=request.recipient,
            content=request.content,
            sender=request.sender,
            channel=request.channel,
            encrypt=request.encrypt
        )
        
        return {
            "message_id": message_id,
            "status": "sent",
            "timestamp": "2025-07-06T12:00:00Z",
            "encrypted": request.encrypt
        }
        
    except Exception as e:
        logger.error("Message sending failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/messages/{address}")
async def get_messages(
    address: str,
    limit: Optional[int] = 50,
    comm_service: CommunicationService = Depends(lambda: CommunicationService())
):
    """
    Get messages for user address
    """
    try:
        messages = await comm_service.get_user_messages(address, limit)
        return {"messages": messages}
        
    except Exception as e:
        logger.error("Failed to get messages", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")

@router.post("/calls/initiate")
async def initiate_call(
    request: CallRequest,
    comm_service: CommunicationService = Depends(lambda: CommunicationService())
):
    """
    Initiate WebRTC voice/video call
    """
    try:
        call_id = await comm_service.initiate_webrtc_call(
            caller=request.caller,
            callee=request.callee,
            call_type=request.call_type
        )
        
        return {
            "call_id": call_id,
            "status": "initiated",
            "signaling_server": "wss://signal.nxd.com",
            "stun_servers": ["stun:stun.l.google.com:19302"]
        }
        
    except Exception as e:
        logger.error("Call initiation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to initiate call")

@router.get("/files/upload")
async def upload_file_to_ipfs(
    file_hash: str,
    file_name: str,
    uploader: str,
    comm_service: CommunicationService = Depends(lambda: CommunicationService())
):
    """
    Upload file to IPFS cluster
    """
    try:
        result = await comm_service.upload_to_ipfs(
            file_hash=file_hash,
            file_name=file_name,
            uploader=uploader
        )
        
        return result
        
    except Exception as e:
        logger.error("IPFS upload failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to upload file")

@router.websocket("/ws/{user_address}")
async def websocket_endpoint(websocket: WebSocket, user_address: str):
    """
    WebSocket endpoint for real-time communication
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for demo - in production, handle message routing
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        await websocket.close()

@router.get("/status")
async def get_communication_status(
    comm_service: CommunicationService = Depends(lambda: CommunicationService())
):
    """
    Get communication services status
    """
    try:
        status = await comm_service.get_service_status()
        return status
        
    except Exception as e:
        logger.error("Failed to get communication status", error=str(e))
        raise HTTPException(status_code=500, detail="Communication status unavailable")