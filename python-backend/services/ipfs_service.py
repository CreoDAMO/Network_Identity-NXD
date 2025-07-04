"""
IPFS Service for NXD Platform
Handles decentralized storage for domain content, audit logs, and communication data
"""
import asyncio
import json
import hashlib
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import httpx
import structlog
from pathlib import Path

from core.config import settings

logger = structlog.get_logger()

class IPFSService:
    """
    IPFS Service for decentralized content storage and retrieval
    """
    
    def __init__(self):
        self.api_url = settings.IPFS_API_URL
        self.cluster_api_url = settings.IPFS_CLUSTER_API_URL
        self.gateway_url = settings.IPFS_GATEWAY_URL
        
        # IPFS cluster configuration
        self.cluster_nodes = [
            {"id": "node1", "api_url": settings.IPFS_CLUSTER_API_URL, "status": "unknown"},
            {"id": "node2", "api_url": settings.IPFS_CLUSTER_API_URL.replace("9094", "9095"), "status": "unknown"},
            {"id": "node3", "api_url": settings.IPFS_CLUSTER_API_URL.replace("9094", "9096"), "status": "unknown"}
        ]
        
        # Content type mappings
        self.content_types = {
            "domain_content": "application/json",
            "audit_log": "application/json", 
            "communication_data": "application/json",
            "satellite_telemetry": "application/json",
            "iot_data": "application/json",
            "user_profile": "application/json",
            "governance_proposal": "application/json",
            "marketplace_listing": "application/json",
            "website_data": "text/html",
            "metadata": "application/json"
        }
    
    async def pin_content(
        self, 
        content: Union[str, bytes, Dict],
        content_type: str = "domain_content",
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Pin content to IPFS cluster with metadata
        """
        try:
            # Prepare content for upload
            if isinstance(content, dict):
                content_bytes = json.dumps(content, indent=2).encode('utf-8')
                mime_type = "application/json"
            elif isinstance(content, str):
                content_bytes = content.encode('utf-8')
                mime_type = self.content_types.get(content_type, "text/plain")
            else:
                content_bytes = content
                mime_type = self.content_types.get(content_type, "application/octet-stream")
            
            # Calculate content hash for verification
            content_hash = hashlib.sha256(content_bytes).hexdigest()
            
            # Upload to IPFS
            ipfs_hash = await self._upload_to_ipfs(content_bytes, mime_type)
            
            # Pin to cluster for redundancy
            pin_result = await self._pin_to_cluster(ipfs_hash)
            
            # Create metadata
            full_metadata = {
                "content_type": content_type,
                "mime_type": mime_type,
                "content_hash": content_hash,
                "ipfs_hash": ipfs_hash,
                "timestamp": datetime.utcnow().isoformat(),
                "size": len(content_bytes),
                "cluster_status": pin_result,
                **(metadata or {})
            }
            
            # Store metadata
            metadata_hash = await self._upload_metadata(full_metadata)
            
            return {
                "success": True,
                "ipfs_hash": ipfs_hash,
                "metadata_hash": metadata_hash,
                "content_hash": content_hash,
                "size": len(content_bytes),
                "cluster_replicas": pin_result.get("replicas", 0),
                "gateway_url": f"{self.gateway_url}{ipfs_hash}"
            }
            
        except Exception as e:
            logger.error("Failed to pin content to IPFS", error=str(e), content_type=content_type)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def retrieve_content(self, ipfs_hash: str) -> Dict[str, Any]:
        """
        Retrieve content from IPFS
        """
        try:
            # Try to get from local node first
            content = await self._get_from_ipfs(ipfs_hash)
            
            if not content:
                # Try gateway as fallback
                content = await self._get_from_gateway(ipfs_hash)
            
            if not content:
                raise Exception("Content not found")
            
            # Try to parse as JSON if possible
            try:
                parsed_content = json.loads(content.decode('utf-8'))
                content_type = "application/json"
            except:
                parsed_content = content.decode('utf-8')
                content_type = "text/plain"
            
            return {
                "success": True,
                "ipfs_hash": ipfs_hash,
                "content": parsed_content,
                "content_type": content_type,
                "size": len(content)
            }
            
        except Exception as e:
            logger.error("Failed to retrieve content from IPFS", ipfs_hash=ipfs_hash, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def pin_domain_content(self, domain_name: str, content_data: Dict) -> Dict[str, Any]:
        """
        Pin domain-specific content (website data, DNS records, etc.)
        """
        metadata = {
            "domain_name": domain_name,
            "content_category": "domain_content",
            "version": "1.0"
        }
        
        return await self.pin_content(content_data, "domain_content", metadata)
    
    async def pin_audit_log(self, log_data: Dict) -> Dict[str, Any]:
        """
        Pin audit log data for transparency
        """
        metadata = {
            "log_type": log_data.get("type", "general"),
            "timestamp": log_data.get("timestamp"),
            "content_category": "audit_log"
        }
        
        return await self.pin_content(log_data, "audit_log", metadata)
    
    async def pin_communication_data(self, message_data: Dict) -> Dict[str, Any]:
        """
        Pin communication data (Waku messages, WebRTC signaling)
        """
        metadata = {
            "message_type": message_data.get("type", "message"),
            "sender": message_data.get("sender"),
            "content_category": "communication_data"
        }
        
        return await self.pin_content(message_data, "communication_data", metadata)
    
    async def pin_satellite_telemetry(self, telemetry_data: Dict) -> Dict[str, Any]:
        """
        Pin satellite telemetry data
        """
        metadata = {
            "satellite_id": telemetry_data.get("satellite_id"),
            "data_type": "telemetry",
            "content_category": "satellite_telemetry"
        }
        
        return await self.pin_content(telemetry_data, "satellite_telemetry", metadata)
    
    async def pin_iot_data(self, iot_data: Dict) -> Dict[str, Any]:
        """
        Pin IoT device data
        """
        metadata = {
            "device_id": iot_data.get("device_id"),
            "data_type": "iot_sensor_data",
            "content_category": "iot_data"
        }
        
        return await self.pin_content(iot_data, "iot_data", metadata)
    
    async def search_content(self, content_type: Optional[str] = None, metadata_filters: Optional[Dict] = None) -> List[Dict]:
        """
        Search for content by type and metadata (requires indexing service)
        """
        try:
            # This would require a separate indexing service in production
            # For now, return empty list with indication that indexing is needed
            return []
        except Exception as e:
            logger.error("Content search failed", error=str(e))
            return []
    
    async def get_cluster_status(self) -> Dict[str, Any]:
        """
        Get IPFS cluster health status
        """
        cluster_status = {
            "nodes": [],
            "total_nodes": len(self.cluster_nodes),
            "healthy_nodes": 0,
            "total_pins": 0,
            "cluster_health": "unknown"
        }
        
        for node in self.cluster_nodes:
            try:
                status = await self._check_node_status(node["api_url"])
                node_info = {
                    "id": node["id"],
                    "api_url": node["api_url"],
                    "status": "healthy" if status["success"] else "unhealthy",
                    "pins": status.get("pins", 0),
                    "peers": status.get("peers", 0)
                }
                cluster_status["nodes"].append(node_info)
                
                if status["success"]:
                    cluster_status["healthy_nodes"] += 1
                    cluster_status["total_pins"] += status.get("pins", 0)
                    
            except Exception as e:
                cluster_status["nodes"].append({
                    "id": node["id"],
                    "api_url": node["api_url"],
                    "status": "error",
                    "error": str(e)
                })
        
        # Determine overall cluster health
        if cluster_status["healthy_nodes"] == 0:
            cluster_status["cluster_health"] = "critical"
        elif cluster_status["healthy_nodes"] < len(self.cluster_nodes) / 2:
            cluster_status["cluster_health"] = "degraded"
        else:
            cluster_status["cluster_health"] = "healthy"
        
        return cluster_status
    
    async def _upload_to_ipfs(self, content: bytes, mime_type: str) -> str:
        """Upload content to IPFS node"""
        async with httpx.AsyncClient() as client:
            files = {"file": ("content", content, mime_type)}
            response = await client.post(f"{self.api_url}/api/v0/add", files=files)
            response.raise_for_status()
            result = response.json()
            return result["Hash"]
    
    async def _pin_to_cluster(self, ipfs_hash: str) -> Dict[str, Any]:
        """Pin content to IPFS cluster"""
        successful_pins = 0
        total_attempts = 0
        
        for node in self.cluster_nodes:
            total_attempts += 1
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{node['api_url']}/api/v0/pins/{ipfs_hash}",
                        json={"replication_factor_min": 2, "replication_factor_max": 3}
                    )
                    if response.status_code == 200:
                        successful_pins += 1
            except Exception as e:
                logger.warning("Failed to pin to cluster node", node=node["id"], error=str(e))
        
        return {
            "replicas": successful_pins,
            "attempted": total_attempts,
            "success_rate": successful_pins / total_attempts if total_attempts > 0 else 0
        }
    
    async def _upload_metadata(self, metadata: Dict) -> str:
        """Upload metadata to IPFS"""
        metadata_json = json.dumps(metadata, indent=2)
        return await self._upload_to_ipfs(metadata_json.encode('utf-8'), "application/json")
    
    async def _get_from_ipfs(self, ipfs_hash: str) -> Optional[bytes]:
        """Get content from local IPFS node"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.api_url}/api/v0/cat?arg={ipfs_hash}")
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.warning("Failed to get content from local IPFS", ipfs_hash=ipfs_hash, error=str(e))
            return None
    
    async def _get_from_gateway(self, ipfs_hash: str) -> Optional[bytes]:
        """Get content from IPFS gateway as fallback"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.gateway_url}{ipfs_hash}")
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.warning("Failed to get content from IPFS gateway", ipfs_hash=ipfs_hash, error=str(e))
            return None
    
    async def _check_node_status(self, node_api_url: str) -> Dict[str, Any]:
        """Check individual IPFS node status"""
        try:
            async with httpx.AsyncClient() as client:
                # Get node ID
                id_response = await client.post(f"{node_api_url}/api/v0/id")
                id_response.raise_for_status()
                
                # Get pin count
                pins_response = await client.post(f"{node_api_url}/api/v0/pin/ls", params={"type": "recursive"})
                pins_response.raise_for_status()
                pins_data = pins_response.text.strip().split('\n')
                pin_count = len([line for line in pins_data if line.strip()])
                
                # Get peer count
                peers_response = await client.post(f"{node_api_url}/api/v0/swarm/peers")
                peers_response.raise_for_status()
                peers_data = peers_response.json()
                peer_count = len(peers_data.get("Peers", []))
                
                return {
                    "success": True,
                    "pins": pin_count,
                    "peers": peer_count
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def cleanup_old_content(self, days_old: int = 30) -> Dict[str, Any]:
        """
        Clean up old unpinned content (placeholder for garbage collection)
        """
        # This would require tracking pinned content and implementing cleanup logic
        # For now, return a placeholder response
        return {
            "cleaned_items": 0,
            "freed_space": 0,
            "message": "Cleanup functionality requires content tracking implementation"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for IPFS service
        """
        try:
            # Test basic IPFS functionality
            test_content = {"test": "health_check", "timestamp": datetime.utcnow().isoformat()}
            pin_result = await self.pin_content(test_content, "metadata")
            
            if pin_result["success"]:
                # Try to retrieve it back
                retrieve_result = await self.retrieve_content(pin_result["ipfs_hash"])
                
                cluster_status = await self.get_cluster_status()
                
                return {
                    "status": "healthy",
                    "ipfs_node": "connected",
                    "cluster_health": cluster_status["cluster_health"],
                    "healthy_nodes": cluster_status["healthy_nodes"],
                    "total_nodes": cluster_status["total_nodes"],
                    "test_pin_success": pin_result["success"],
                    "test_retrieve_success": retrieve_result["success"]
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Failed to pin test content"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }