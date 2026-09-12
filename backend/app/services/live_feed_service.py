import asyncio
import logging
from typing import Dict, Any, Set
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger("live_feed")

class LiveFeedBroadcaster:
    def __init__(self):
        self.queues: Set[asyncio.Queue] = set()
        self.scheduler = AsyncIOScheduler()
        self.last_data = {}

    def start(self, realtime_service):
        self.realtime_service = realtime_service
        self.scheduler.add_job(self.fetch_and_broadcast, 'interval', seconds=30)
        self.scheduler.start()
        logger.info("Live feed broadcaster and scheduler started.")

    async def shutdown(self):
        self.scheduler.shutdown()
        logger.info("Live feed broadcaster shut down.")

    async def add_client(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.queues.add(q)
        # Immediately push the last known state to the new client
        if self.last_data:
            await q.put(self.last_data)
        return q

    def remove_client(self, q: asyncio.Queue):
        self.queues.discard(q)

    async def broadcast(self, payload: Dict[str, Any]):
        self.last_data = payload
        dead_queues = set()
        for q in list(self.queues):
            try:
                # Use nowait to prevent blocking the broadcast loop
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead_queues.add(q)
            except Exception:
                dead_queues.add(q)
                
        for q in dead_queues:
            self.remove_client(q)

    async def fetch_and_broadcast(self):
        """Background job to fetch data and push to clients."""
        try:
            logger.debug("Fetching scheduled live updates...")
            # For this demo, we broadcast a fixed domain center (Bay of Bengal)
            # In a real system, you might broadcast multiple regions or generic updates.
            ocean_data = await self.realtime_service.get_live_conditions_and_forecast(lat=14.5, lon=84.8)
            fleet_data = await self.realtime_service.get_live_argo_network()
            
            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "ocean": ocean_data,
                "fleet": fleet_data
            }
            await self.broadcast(payload)
        except Exception as e:
            logger.error(f"Error in background fetch_and_broadcast: {e}")
