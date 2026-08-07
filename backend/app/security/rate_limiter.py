"""Rate limiter dependency using Redis token bucket."""

import time
from fastapi import Request, HTTPException, status
from app.services.redis_service import redis_service
from app.config import settings

async def rate_limit(request: Request):
    """
    Rate limiting dependency using a simple fixed-window counter in Redis.
    Limits to `settings.rate_limit_per_min` requests per minute per IP address.
    """
    if not redis_service.redis:
        await redis_service.connect()
        
    client_ip = request.client.host if request.client else "unknown"
    current_minute = int(time.time() // 60)
    key = f"rate_limit:{client_ip}:{current_minute}"
    
    current_count = await redis_service.redis.get(key)
    
    if current_count and int(current_count) >= settings.rate_limit_per_min:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again in a minute."
        )
        
    async with redis_service.redis.pipeline() as pipe:
        pipe.incr(key)
        pipe.expire(key, 60)
        await pipe.execute()
        
    return True
