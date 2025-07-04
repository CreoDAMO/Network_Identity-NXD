"""
Communication Service for NXD Platform
Handles Waku messaging, WebRTC voice calls, and IPFS-based data transfer
"""
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import httpx
import websockets
import structlog
from dataclasses import dataclass, asdict

from core.config import settings
from services.ipfs_service import IPFSService

logger = structlog.get_logger()

@dataclass
class Message:
    id: str
    sender: str
    recipient: str
    content: str
    message_type: str  # "text", "voice", "data", "file", "call_signal"
    timestamp: datetime
    encrypted: bool = True
    ipfs_hash: Optional[str] = None
    call_session_id: Optional[str] = None

@dataclass
class VoiceCallSession:
    session_id: str
    caller: str
    callee: str
    status: str  # "initiated", "ringing", "active", "ended"
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None  # seconds
    quality_score: Optional[float] = None

@dataclass
class DataTransfer:
    transfer_id: str
    sender: str
    recipient: str
    file_name: str
    file_size: int
    ipfs_hash: str
    status: str  # "uploading", "available", "downloading", "completed"
    created_at: datetime
    expires_at: datetime

class CommunicationService:
    """
    Comprehensive communication service for Web3 messaging and voice calls
    """
    
    def __init__(self):
        self.waku_node_url = settings.WAKU_NODE_URL
        self.webrtc_stun_servers = settings.WEBRTC_STUN_SERVERS.split(",")
        self.ipfs_service = IPFSService()
        
        # Active connections and sessions
        self.active_connections: Dict[str, Any] = {}
        self.voice_sessions: Dict[str, VoiceCallSession] = {}
        self.data_transfers: Dict[str, DataTransfer] = {}
        self.message_history: Dict[str, List[Message]] = {}
        
        # WebRTC configuration
        self.webrtc_config = {
            "iceServers": [
                {"urls": [f"stun:{server}" for server in self.webrtc_stun_servers]},
                # Add TURN servers for NAT traversal in production
            ]
        }
        
        # Waku topics for different message types
        self.waku_topics = {
            "messages": "/nxd/1/chat/proto",
            "voice_signals": "/nxd/1/voice/proto", 
            "data_transfer": "/nxd/1/data/proto",
            "presence": "/nxd/1/presence/proto"
        }
    
    async def send_message(
        self, 
        sender: str, 
        recipient: str, 
        content: str, 
        message_type: str = "text",
        encrypt: bool = True
    ) -> Dict[str, Any]:
        """
        Send a message via Waku network
        """
        try:
            message_id = str(uuid.uuid4())
            
            # Create message object
            message = Message(
                id=message_id,
                sender=sender,
                recipient=recipient,
                content=content,
                message_type=message_type,
                timestamp=datetime.utcnow(),
                encrypted=encrypt
            )
            
            # Store large content in IPFS if needed
            if len(content) > 1024:  # Store large messages in IPFS
                ipfs_result = await self.ipfs_service.pin_communication_data({
                    "message_id": message_id,
                    "sender": sender,
                    "recipient": recipient,
                    "content": content,
                    "timestamp": message.timestamp.isoformat()
                })
                
                if ipfs_result["success"]:
                    message.ipfs_hash = ipfs_result["ipfs_hash"]
                    message.content = f"[IPFS_CONTENT:{ipfs_result['ipfs_hash']}]"
            
            # Encrypt content if requested
            if encrypt:
                encrypted_content = await self._encrypt_message(content, recipient)
                message.content = encrypted_content
            
            # Send via Waku
            waku_result = await self._send_waku_message(message)
            
            # Store in local message history
            self._store_message_locally(message)
            
            return {
                "success": True,
                "message_id": message_id,
                "waku_message_id": waku_result.get("message_id"),
                "ipfs_hash": message.ipfs_hash,
                "timestamp": message.timestamp.isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to send message", error=str(e), sender=sender, recipient=recipient)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def initiate_voice_call(self, caller: str, callee: str) -> Dict[str, Any]:
        """
        Initiate a WebRTC voice call
        """
        try:
            session_id = str(uuid.uuid4())
            
            # Create call session
            call_session = VoiceCallSession(
                session_id=session_id,
                caller=caller,
                callee=callee,
                status="initiated",
                started_at=datetime.utcnow()
            )
            
            self.voice_sessions[session_id] = call_session
            
            # Send call initiation signal via Waku
            call_signal = {
                "type": "call_initiate",
                "session_id": session_id,
                "caller": caller,
                "callee": callee,
                "webrtc_config": self.webrtc_config,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self._send_voice_signal(call_signal)
            
            # Update call status
            call_session.status = "ringing"
            
            return {
                "success": True,
                "session_id": session_id,
                "status": "ringing",
                "webrtc_config": self.webrtc_config
            }
            
        except Exception as e:
            logger.error("Failed to initiate voice call", error=str(e), caller=caller, callee=callee)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def answer_voice_call(self, session_id: str, callee: str, accept: bool = True) -> Dict[str, Any]:
        """
        Answer or reject a voice call
        """
        try:
            if session_id not in self.voice_sessions:
                return {"success": False, "error": "Call session not found"}
            
            call_session = self.voice_sessions[session_id]
            
            if call_session.callee != callee:
                return {"success": False, "error": "Unauthorized to answer this call"}
            
            # Send answer signal
            answer_signal = {
                "type": "call_answer",
                "session_id": session_id,
                "accepted": accept,
                "callee": callee,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self._send_voice_signal(answer_signal)
            
            # Update call status
            if accept:
                call_session.status = "active"
            else:
                call_session.status = "ended"
                call_session.ended_at = datetime.utcnow()
                call_session.duration = 0
            
            return {
                "success": True,
                "session_id": session_id,
                "accepted": accept,
                "status": call_session.status
            }
            
        except Exception as e:
            logger.error("Failed to answer voice call", error=str(e), session_id=session_id)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def end_voice_call(self, session_id: str, user: str) -> Dict[str, Any]:
        """
        End an active voice call
        """
        try:
            if session_id not in self.voice_sessions:
                return {"success": False, "error": "Call session not found"}
            
            call_session = self.voice_sessions[session_id]
            
            if user not in [call_session.caller, call_session.callee]:
                return {"success": False, "error": "Unauthorized to end this call"}
            
            # Calculate call duration
            if call_session.started_at:
                duration = (datetime.utcnow() - call_session.started_at).total_seconds()
                call_session.duration = int(duration)
            
            # Send end call signal
            end_signal = {
                "type": "call_end",
                "session_id": session_id,
                "ended_by": user,
                "duration": call_session.duration,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self._send_voice_signal(end_signal)
            
            # Update call status
            call_session.status = "ended"
            call_session.ended_at = datetime.utcnow()
            
            return {
                "success": True,
                "session_id": session_id,
                "duration": call_session.duration,
                "status": "ended"
            }
            
        except Exception as e:
            logger.error("Failed to end voice call", error=str(e), session_id=session_id)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def transfer_file(
        self, 
        sender: str, 
        recipient: str, 
        file_data: bytes, 
        file_name: str,
        expires_in_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Transfer file via IPFS and notify recipient via Waku
        """
        try:
            transfer_id = str(uuid.uuid4())
            
            # Upload file to IPFS
            file_metadata = {
                "transfer_id": transfer_id,
                "sender": sender,
                "recipient": recipient,
                "file_name": file_name,
                "file_size": len(file_data),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            ipfs_result = await self.ipfs_service.pin_content(file_data, "file_transfer", file_metadata)
            
            if not ipfs_result["success"]:
                return {"success": False, "error": "Failed to upload file to IPFS"}
            
            # Create data transfer record
            data_transfer = DataTransfer(
                transfer_id=transfer_id,
                sender=sender,
                recipient=recipient,
                file_name=file_name,
                file_size=len(file_data),
                ipfs_hash=ipfs_result["ipfs_hash"],
                status="available",
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours)
            )
            
            self.data_transfers[transfer_id] = data_transfer
            
            # Notify recipient via Waku
            transfer_notification = {
                "type": "file_transfer",
                "transfer_id": transfer_id,
                "sender": sender,
                "recipient": recipient,
                "file_name": file_name,
                "file_size": len(file_data),
                "ipfs_hash": ipfs_result["ipfs_hash"],
                "expires_at": data_transfer.expires_at.isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self._send_data_transfer_notification(transfer_notification)
            
            return {
                "success": True,
                "transfer_id": transfer_id,
                "ipfs_hash": ipfs_result["ipfs_hash"],
                "file_size": len(file_data),
                "expires_at": data_transfer.expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to transfer file", error=str(e), sender=sender, recipient=recipient)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def download_file(self, transfer_id: str, recipient: str) -> Dict[str, Any]:
        """
        Download file from IPFS using transfer ID
        """
        try:
            if transfer_id not in self.data_transfers:
                return {"success": False, "error": "Transfer not found"}
            
            data_transfer = self.data_transfers[transfer_id]
            
            if data_transfer.recipient != recipient:
                return {"success": False, "error": "Unauthorized to download this file"}
            
            if datetime.utcnow() > data_transfer.expires_at:
                return {"success": False, "error": "Transfer has expired"}
            
            # Retrieve file from IPFS
            ipfs_result = await self.ipfs_service.retrieve_content(data_transfer.ipfs_hash)
            
            if not ipfs_result["success"]:
                return {"success": False, "error": "Failed to retrieve file from IPFS"}
            
            # Update transfer status
            data_transfer.status = "completed"
            
            return {
                "success": True,
                "transfer_id": transfer_id,
                "file_name": data_transfer.file_name,
                "file_data": ipfs_result["content"],
                "file_size": data_transfer.file_size
            }
            
        except Exception as e:
            logger.error("Failed to download file", error=str(e), transfer_id=transfer_id)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_message_history(
        self, 
        user: str, 
        peer: Optional[str] = None, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get message history for a user
        """
        try:
            user_messages = self.message_history.get(user, [])
            
            # Filter by peer if specified
            if peer:
                user_messages = [
                    msg for msg in user_messages 
                    if msg.sender == peer or msg.recipient == peer
                ]
            
            # Sort by timestamp and limit
            user_messages.sort(key=lambda x: x.timestamp, reverse=True)
            user_messages = user_messages[:limit]
            
            # Convert to dict format
            return [asdict(msg) for msg in user_messages]
            
        except Exception as e:
            logger.error("Failed to get message history", error=str(e), user=user)
            return []
    
    async def get_active_voice_calls(self, user: str) -> List[Dict[str, Any]]:
        """
        Get active voice calls for a user
        """
        try:
            active_calls = []
            
            for session_id, call_session in self.voice_sessions.items():
                if (call_session.caller == user or call_session.callee == user) and \
                   call_session.status in ["initiated", "ringing", "active"]:
                    active_calls.append(asdict(call_session))
            
            return active_calls
            
        except Exception as e:
            logger.error("Failed to get active voice calls", error=str(e), user=user)
            return []
    
    async def get_pending_transfers(self, recipient: str) -> List[Dict[str, Any]]:
        """
        Get pending file transfers for a recipient
        """
        try:
            pending_transfers = []
            
            for transfer_id, data_transfer in self.data_transfers.items():
                if data_transfer.recipient == recipient and \
                   data_transfer.status == "available" and \
                   datetime.utcnow() < data_transfer.expires_at:
                    pending_transfers.append(asdict(data_transfer))
            
            return pending_transfers
            
        except Exception as e:
            logger.error("Failed to get pending transfers", error=str(e), recipient=recipient)
            return []
    
    # Internal methods
    
    async def _send_waku_message(self, message: Message) -> Dict[str, Any]:
        """Send message via Waku network"""
        try:
            # In production, this would use the Waku REST API or WebSocket
            async with httpx.AsyncClient() as client:
                waku_payload = {
                    "topic": self.waku_topics["messages"],
                    "payload": {
                        "id": message.id,
                        "sender": message.sender,
                        "recipient": message.recipient,
                        "content": message.content,
                        "type": message.message_type,
                        "timestamp": message.timestamp.isoformat(),
                        "encrypted": message.encrypted,
                        "ipfs_hash": message.ipfs_hash
                    }
                }
                
                # Mock Waku API call - replace with actual Waku endpoint
                return {"success": True, "message_id": str(uuid.uuid4())}
                
        except Exception as e:
            logger.error("Failed to send Waku message", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _send_voice_signal(self, signal: Dict[str, Any]) -> bool:
        """Send voice call signal via Waku"""
        try:
            # Send voice signaling via Waku
            async with httpx.AsyncClient() as client:
                waku_payload = {
                    "topic": self.waku_topics["voice_signals"],
                    "payload": signal
                }
                
                # Mock Waku API call - replace with actual Waku endpoint
                return True
                
        except Exception as e:
            logger.error("Failed to send voice signal", error=str(e))
            return False
    
    async def _send_data_transfer_notification(self, notification: Dict[str, Any]) -> bool:
        """Send data transfer notification via Waku"""
        try:
            async with httpx.AsyncClient() as client:
                waku_payload = {
                    "topic": self.waku_topics["data_transfer"],
                    "payload": notification
                }
                
                # Mock Waku API call - replace with actual Waku endpoint
                return True
                
        except Exception as e:
            logger.error("Failed to send data transfer notification", error=str(e))
            return False
    
    async def _encrypt_message(self, content: str, recipient: str) -> str:
        """Encrypt message content for recipient"""
        # In production, implement proper end-to-end encryption
        # For now, return base64 encoded content as placeholder
        import base64
        return base64.b64encode(content.encode()).decode()
    
    async def _decrypt_message(self, encrypted_content: str, sender: str) -> str:
        """Decrypt message content from sender"""
        # In production, implement proper decryption
        # For now, return base64 decoded content as placeholder
        import base64
        try:
            return base64.b64decode(encrypted_content.encode()).decode()
        except:
            return encrypted_content  # Return as-is if not base64
    
    def _store_message_locally(self, message: Message):
        """Store message in local history"""
        if message.sender not in self.message_history:
            self.message_history[message.sender] = []
        if message.recipient not in self.message_history:
            self.message_history[message.recipient] = []
        
        self.message_history[message.sender].append(message)
        self.message_history[message.recipient].append(message)
    
    async def cleanup_expired_transfers(self):
        """Clean up expired file transfers"""
        try:
            current_time = datetime.utcnow()
            expired_transfers = [
                transfer_id for transfer_id, transfer in self.data_transfers.items()
                if current_time > transfer.expires_at
            ]
            
            for transfer_id in expired_transfers:
                del self.data_transfers[transfer_id]
                
            logger.info("Cleaned up expired transfers", count=len(expired_transfers))
            
        except Exception as e:
            logger.error("Failed to cleanup expired transfers", error=str(e))
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for communication service"""
        try:
            # Test IPFS connectivity
            ipfs_status = await self.ipfs_service.health_check()
            
            # Test Waku connectivity (mock for now)
            waku_status = "connected"  # Replace with actual Waku health check
            
            return {
                "status": "healthy",
                "waku_node": waku_status,
                "ipfs_service": ipfs_status["status"],
                "active_connections": len(self.active_connections),
                "active_voice_calls": len([s for s in self.voice_sessions.values() if s.status == "active"]),
                "pending_transfers": len([t for t in self.data_transfers.values() if t.status == "available"]),
                "webrtc_config": self.webrtc_config
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }