"""
Satellite Service for NXD Platform
Handles satellite communication for remote connectivity and telemetry
"""
import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
import structlog
from dataclasses import dataclass

from core.config import settings

logger = structlog.get_logger()

@dataclass
class SatelliteConnection:
    satellite_id: str
    name: str
    status: str  # "active", "idle", "maintenance", "offline"
    signal_strength: float
    latency_ms: int
    bandwidth_mbps: float
    location: Dict[str, float]  # {"lat": float, "lon": float, "alt": float}
    last_contact: datetime

@dataclass
class TelemetryData:
    satellite_id: str
    timestamp: datetime
    system_health: Dict[str, Any]
    power_levels: Dict[str, float]
    temperature: float
    radiation_levels: float
    orbital_position: Dict[str, float]
    communication_stats: Dict[str, Any]

class SatelliteService:
    """
    Satellite communication service for remote areas and backup connectivity
    """
    
    def __init__(self):
        self.api_url = settings.SATELLITE_API_URL
        self.api_key = settings.SATELLITE_API_KEY
        
        # Mock satellite constellation for development
        self.satellites: Dict[str, SatelliteConnection] = {
            "NXD-SAT-001": SatelliteConnection(
                satellite_id="NXD-SAT-001",
                name="NXD Primary",
                status="active",
                signal_strength=85.5,
                latency_ms=600,
                bandwidth_mbps=10.0,
                location={"lat": 0.0, "lon": 0.0, "alt": 550.0},
                last_contact=datetime.utcnow()
            ),
            "NXD-SAT-002": SatelliteConnection(
                satellite_id="NXD-SAT-002", 
                name="NXD Backup",
                status="active",
                signal_strength=78.2,
                latency_ms=650,
                bandwidth_mbps=8.5,
                location={"lat": 45.0, "lon": -120.0, "alt": 580.0},
                last_contact=datetime.utcnow()
            ),
            "NXD-SAT-003": SatelliteConnection(
                satellite_id="NXD-SAT-003",
                name="NXD Regional",
                status="idle",
                signal_strength=92.1,
                latency_ms=580,
                bandwidth_mbps=12.0,
                location={"lat": -30.0, "lon": 60.0, "alt": 520.0},
                last_contact=datetime.utcnow()
            )
        }
        
        self.telemetry_history: Dict[str, List[TelemetryData]] = {}
        self.active_communications: Dict[str, Dict] = {}
    
    async def establish_connection(self, satellite_id: str, user_location: Dict[str, float]) -> Dict[str, Any]:
        """
        Establish connection to a specific satellite
        """
        try:
            if satellite_id not in self.satellites:
                return {"success": False, "error": "Satellite not found"}
            
            satellite = self.satellites[satellite_id]
            
            if satellite.status != "active":
                return {"success": False, "error": f"Satellite is {satellite.status}"}
            
            # Calculate distance and signal quality
            distance_km = self._calculate_distance(user_location, satellite.location)
            signal_quality = self._calculate_signal_quality(distance_km, satellite.signal_strength)
            
            if signal_quality < 30:  # Minimum signal threshold
                return {"success": False, "error": "Signal quality too low"}
            
            # Create communication session
            session_id = f"comm_{satellite_id}_{int(datetime.utcnow().timestamp())}"
            
            communication_session = {
                "session_id": session_id,
                "satellite_id": satellite_id,
                "user_location": user_location,
                "established_at": datetime.utcnow(),
                "signal_quality": signal_quality,
                "estimated_latency": satellite.latency_ms,
                "bandwidth_allocation": min(satellite.bandwidth_mbps * 0.3, 3.0),  # 30% allocation max 3 Mbps
                "status": "active"
            }
            
            self.active_communications[session_id] = communication_session
            
            return {
                "success": True,
                "session_id": session_id,
                "satellite_name": satellite.name,
                "signal_quality": signal_quality,
                "latency_ms": satellite.latency_ms,
                "bandwidth_mbps": communication_session["bandwidth_allocation"],
                "connection_status": "established"
            }
            
        except Exception as e:
            logger.error("Failed to establish satellite connection", error=str(e), satellite_id=satellite_id)
            return {"success": False, "error": str(e)}
    
    async def send_data(self, session_id: str, data: Dict[str, Any], priority: str = "normal") -> Dict[str, Any]:
        """
        Send data via satellite link
        """
        try:
            if session_id not in self.active_communications:
                return {"success": False, "error": "Communication session not found"}
            
            session = self.active_communications[session_id]
            satellite = self.satellites[session["satellite_id"]]
            
            # Calculate transmission parameters
            data_size_kb = len(json.dumps(data).encode()) / 1024
            transmission_time = data_size_kb / (session["bandwidth_allocation"] * 1024)  # Convert to seconds
            
            # Apply priority adjustments
            priority_multiplier = {"high": 0.5, "normal": 1.0, "low": 2.0}
            adjusted_time = transmission_time * priority_multiplier.get(priority, 1.0)
            
            # Simulate transmission delay
            await asyncio.sleep(min(adjusted_time, 0.1))  # Cap at 100ms for simulation
            
            # Store transmission record
            transmission_record = {
                "timestamp": datetime.utcnow(),
                "session_id": session_id,
                "data_size_kb": data_size_kb,
                "transmission_time_s": adjusted_time,
                "priority": priority,
                "success": True
            }
            
            return {
                "success": True,
                "transmission_id": f"tx_{session_id}_{int(datetime.utcnow().timestamp())}",
                "data_size_kb": data_size_kb,
                "transmission_time_s": adjusted_time,
                "signal_quality": session["signal_quality"],
                "satellite_id": session["satellite_id"]
            }
            
        except Exception as e:
            logger.error("Failed to send data via satellite", error=str(e), session_id=session_id)
            return {"success": False, "error": str(e)}
    
    async def receive_data(self, session_id: str, timeout_seconds: int = 30) -> Dict[str, Any]:
        """
        Receive data via satellite link
        """
        try:
            if session_id not in self.active_communications:
                return {"success": False, "error": "Communication session not found"}
            
            session = self.active_communications[session_id]
            
            # Simulate data reception with timeout
            start_time = datetime.utcnow()
            while (datetime.utcnow() - start_time).total_seconds() < timeout_seconds:
                # In production, this would poll the satellite for incoming data
                await asyncio.sleep(1)
                
                # Mock incoming data (10% chance per second)
                if datetime.utcnow().microsecond % 10 == 0:
                    mock_data = {
                        "message_type": "domain_update",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": {
                            "domain": "example.nxd",
                            "status": "active",
                            "location": session["user_location"]
                        }
                    }
                    
                    return {
                        "success": True,
                        "data": mock_data,
                        "signal_quality": session["signal_quality"],
                        "reception_time": datetime.utcnow().isoformat()
                    }
            
            return {"success": False, "error": "No data received within timeout"}
            
        except Exception as e:
            logger.error("Failed to receive data via satellite", error=str(e), session_id=session_id)
            return {"success": False, "error": str(e)}
    
    async def get_satellite_status(self, satellite_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get status of satellites
        """
        try:
            if satellite_id:
                if satellite_id not in self.satellites:
                    return {"success": False, "error": "Satellite not found"}
                
                satellite = self.satellites[satellite_id]
                telemetry = await self._get_latest_telemetry(satellite_id)
                
                return {
                    "success": True,
                    "satellite": {
                        "id": satellite.satellite_id,
                        "name": satellite.name,
                        "status": satellite.status,
                        "signal_strength": satellite.signal_strength,
                        "latency_ms": satellite.latency_ms,
                        "bandwidth_mbps": satellite.bandwidth_mbps,
                        "location": satellite.location,
                        "last_contact": satellite.last_contact.isoformat(),
                        "telemetry": telemetry
                    }
                }
            else:
                # Return all satellites
                satellites_status = []
                for sat_id, satellite in self.satellites.items():
                    satellites_status.append({
                        "id": satellite.satellite_id,
                        "name": satellite.name,
                        "status": satellite.status,
                        "signal_strength": satellite.signal_strength,
                        "latency_ms": satellite.latency_ms,
                        "bandwidth_mbps": satellite.bandwidth_mbps,
                        "location": satellite.location,
                        "last_contact": satellite.last_contact.isoformat()
                    })
                
                return {
                    "success": True,
                    "satellites": satellites_status,
                    "total_satellites": len(self.satellites),
                    "active_satellites": len([s for s in self.satellites.values() if s.status == "active"])
                }
                
        except Exception as e:
            logger.error("Failed to get satellite status", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def find_best_satellite(self, user_location: Dict[str, float], min_bandwidth: float = 1.0) -> Dict[str, Any]:
        """
        Find the best available satellite for a user location
        """
        try:
            best_satellite = None
            best_score = 0
            
            for satellite in self.satellites.values():
                if satellite.status != "active":
                    continue
                
                if satellite.bandwidth_mbps < min_bandwidth:
                    continue
                
                # Calculate distance and signal quality
                distance_km = self._calculate_distance(user_location, satellite.location)
                signal_quality = self._calculate_signal_quality(distance_km, satellite.signal_strength)
                
                if signal_quality < 30:  # Minimum threshold
                    continue
                
                # Score based on signal quality, bandwidth, and latency
                score = (
                    signal_quality * 0.4 +
                    (satellite.bandwidth_mbps / 20.0) * 100 * 0.3 +  # Normalize bandwidth
                    (1000 - satellite.latency_ms) / 10 * 0.3  # Lower latency is better
                )
                
                if score > best_score:
                    best_score = score
                    best_satellite = satellite
            
            if not best_satellite:
                return {"success": False, "error": "No suitable satellite found"}
            
            return {
                "success": True,
                "satellite_id": best_satellite.satellite_id,
                "satellite_name": best_satellite.name,
                "signal_quality": self._calculate_signal_quality(
                    self._calculate_distance(user_location, best_satellite.location),
                    best_satellite.signal_strength
                ),
                "bandwidth_mbps": best_satellite.bandwidth_mbps,
                "latency_ms": best_satellite.latency_ms,
                "score": best_score
            }
            
        except Exception as e:
            logger.error("Failed to find best satellite", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def close_connection(self, session_id: str) -> Dict[str, Any]:
        """
        Close satellite communication session
        """
        try:
            if session_id not in self.active_communications:
                return {"success": False, "error": "Communication session not found"}
            
            session = self.active_communications[session_id]
            
            # Calculate session statistics
            duration = (datetime.utcnow() - session["established_at"]).total_seconds()
            
            session_stats = {
                "session_id": session_id,
                "duration_seconds": duration,
                "satellite_id": session["satellite_id"],
                "average_signal_quality": session["signal_quality"],
                "total_bandwidth_used": session["bandwidth_allocation"] * duration / 3600,  # MB
                "closed_at": datetime.utcnow().isoformat()
            }
            
            # Remove from active communications
            del self.active_communications[session_id]
            
            return {
                "success": True,
                "message": "Connection closed successfully",
                "session_stats": session_stats
            }
            
        except Exception as e:
            logger.error("Failed to close satellite connection", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def emergency_broadcast(self, message: str, priority: str = "emergency") -> Dict[str, Any]:
        """
        Send emergency broadcast via all available satellites
        """
        try:
            broadcast_id = f"emergency_{int(datetime.utcnow().timestamp())}"
            successful_broadcasts = 0
            failed_broadcasts = 0
            broadcast_results = []
            
            emergency_payload = {
                "broadcast_id": broadcast_id,
                "message": message,
                "priority": priority,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "emergency_broadcast"
            }
            
            for satellite in self.satellites.values():
                try:
                    if satellite.status == "active":
                        # Simulate emergency broadcast
                        result = {
                            "satellite_id": satellite.satellite_id,
                            "satellite_name": satellite.name,
                            "broadcast_success": True,
                            "signal_strength": satellite.signal_strength,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        successful_broadcasts += 1
                    else:
                        result = {
                            "satellite_id": satellite.satellite_id,
                            "satellite_name": satellite.name,
                            "broadcast_success": False,
                            "error": f"Satellite is {satellite.status}",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        failed_broadcasts += 1
                    
                    broadcast_results.append(result)
                    
                except Exception as e:
                    failed_broadcasts += 1
                    broadcast_results.append({
                        "satellite_id": satellite.satellite_id,
                        "broadcast_success": False,
                        "error": str(e)
                    })
            
            return {
                "success": successful_broadcasts > 0,
                "broadcast_id": broadcast_id,
                "successful_broadcasts": successful_broadcasts,
                "failed_broadcasts": failed_broadcasts,
                "total_satellites": len(self.satellites),
                "broadcast_results": broadcast_results
            }
            
        except Exception as e:
            logger.error("Failed to send emergency broadcast", error=str(e))
            return {"success": False, "error": str(e)}
    
    # Internal helper methods
    
    def _calculate_distance(self, loc1: Dict[str, float], loc2: Dict[str, float]) -> float:
        """Calculate distance between two locations in km"""
        import math
        
        lat1, lon1 = math.radians(loc1["lat"]), math.radians(loc1["lon"])
        lat2, lon2 = math.radians(loc2["lat"]), math.radians(loc2["lon"])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth radius in km, plus satellite altitude
        earth_radius = 6371
        satellite_alt = loc2.get("alt", 550)
        
        return (earth_radius + satellite_alt) * c
    
    def _calculate_signal_quality(self, distance_km: float, base_signal: float) -> float:
        """Calculate signal quality based on distance and base signal strength"""
        # Signal degrades with distance
        max_distance = 2000  # Maximum effective distance in km
        distance_factor = max(0, 1 - (distance_km / max_distance))
        
        return base_signal * distance_factor
    
    async def _get_latest_telemetry(self, satellite_id: str) -> Optional[Dict[str, Any]]:
        """Get latest telemetry data for a satellite"""
        try:
            if satellite_id not in self.telemetry_history:
                return None
            
            telemetry_list = self.telemetry_history[satellite_id]
            if not telemetry_list:
                return None
            
            latest = telemetry_list[-1]
            return {
                "timestamp": latest.timestamp.isoformat(),
                "system_health": latest.system_health,
                "power_levels": latest.power_levels,
                "temperature": latest.temperature,
                "radiation_levels": latest.radiation_levels,
                "orbital_position": latest.orbital_position,
                "communication_stats": latest.communication_stats
            }
            
        except Exception as e:
            logger.error("Failed to get telemetry", error=str(e))
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for satellite service"""
        try:
            active_satellites = [s for s in self.satellites.values() if s.status == "active"]
            total_bandwidth = sum(s.bandwidth_mbps for s in active_satellites)
            avg_latency = sum(s.latency_ms for s in active_satellites) / len(active_satellites) if active_satellites else 0
            
            return {
                "status": "healthy" if active_satellites else "degraded",
                "total_satellites": len(self.satellites),
                "active_satellites": len(active_satellites),
                "total_bandwidth_mbps": total_bandwidth,
                "average_latency_ms": avg_latency,
                "active_communications": len(self.active_communications),
                "api_configured": bool(self.api_url and self.api_key)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }