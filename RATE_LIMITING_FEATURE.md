# Rate Limiting Feature

## Overview
Comprehensive rate limiting system that protects the API from abuse, brute force attacks, and DDoS attempts through tiered rate limiting, violation tracking, and automated threat detection.

## Architecture

### Components
1. **Rate Limiter Middleware** (`backend/middleware/rateLimiter.js`)
   - 10 pre-configured rate limiters for different endpoint types
   - Optional Redis support for distributed rate limiting
   - Graceful fallback to memory store
   - IP whitelisting support
   - Automatic violation logging

2. **Violation Tracking Model** (`backend/models/RateLimitViolation.js`)
   - Tracks all rate limit violations with context
   - Automatic severity assessment (low, medium, high, critical)
   - Pattern detection for repeat offenders
   - 30-day TTL with automatic cleanup

3. **Monitoring API** (`backend/routes/rateLimit.js`)
   - User endpoints: View own violations and rate limit info
   - Admin endpoints: System statistics, suspicious IP detection, limit reset
   - Comprehensive filtering and pagination

4. **Admin UI** (`frontend/src/components/admin/RateLimitMonitor.jsx`)
   - Real-time monitoring dashboard
   - Violation table with advanced filtering
   - Suspicious IP detection and blocking recommendations
   - Statistics visualization

## Rate Limit Configurations

### 1. Authentication Limiter (authLimiter)
- **Limit**: 5 requests per 15 minutes
- **Use**: Login, registration (brute force prevention)
- **Message**: "Too many login attempts. Please try again in 15 minutes."

### 2. API Limiter (apiLimiter)
- **Limit**: 100 requests per 15 minutes
- **Use**: General API operations (CRUD operations)
- **Message**: "Too many requests from this IP. Please try again later."

### 3. Read Limiter (readLimiter)
- **Limit**: 200 requests per 15 minutes
- **Use**: GET operations, data retrieval
- **Message**: "Too many requests. Please slow down."

### 4. Expensive Limiter (expensiveLimiter)
- **Limit**: 10 requests per hour
- **Use**: Analytics, reports, heavy computations
- **Message**: "Too many expensive operations. Please try again later."

### 5. GDPR Limiter (gdprLimiter)
- **Limit**: 5 requests per hour
- **Use**: Data export, account deletion (resource-intensive operations)
- **Message**: "Too many GDPR requests. Please try again later."

### 6. Upload Limiter (uploadLimiter)
- **Limit**: 20 requests per 15 minutes
- **Use**: File upload endpoints
- **Message**: "Too many upload requests. Please try again later."

### 7. Password Reset Limiter (passwordResetLimiter)
- **Limit**: 3 requests per hour
- **Use**: Password reset operations (prevent abuse)
- **Message**: "Too many password reset attempts. Please try again later."

### 8. Two-Factor Limiter (twoFactorLimiter)
- **Limit**: 10 requests per 15 minutes
- **Use**: 2FA setup, verification, backup codes
- **Message**: "Too many 2FA requests. Please try again later."

### 9. Admin Limiter (adminLimiter)
- **Limit**: 150 requests per 15 minutes
- **Use**: Admin operations (elevated limits)
- **Message**: "Too many admin requests. Please try again later."

### 10. Global Limiter (globalLimiter)
- **Limit**: 500 requests per 15 minutes
- **Use**: Applied to all routes as baseline protection
- **Message**: "Global rate limit exceeded. Please try again later."

## Applied Rate Limits by Route

### Authentication (`/api/auth`)
- `/login` → **authLimiter** (5/15min)
- `/register` → **apiLimiter** (100/15min)
- `/forgot-password/*` → **passwordResetLimiter** (3/hour)

### Two-Factor Auth (`/api/2fa`)
- All endpoints → **twoFactorLimiter** (10/15min)

### GDPR (`/api/gdpr`)
- `/export` → **gdprLimiter** (5/hour)
- `/delete` → **gdprLimiter** (5/hour)
- `/admin/*` → **adminLimiter** (150/15min)

### Global
- All routes → **globalLimiter** (500/15min, baseline)

## Violation Tracking

### Severity Levels
Automatically assigned based on repeat violations in the last hour:
- **Low**: < 2 violations
- **Medium**: 2-4 violations
- **High**: 5-9 violations
- **Critical**: 10+ violations

### Tracked Data
- User ID and IP address
- Endpoint, method, and limiter type
- User agent and headers
- Rate limit configuration (limit, window)
- Previous violation count
- Response message

### TTL
- Violations auto-delete after 30 days
- Manual cleanup available via admin API

## Monitoring & Analytics

### Statistics Tracked
1. **Total Violations**: Overall count across all limiters
2. **By Limiter Type**: Distribution across auth, API, GDPR, etc.
3. **By Severity**: Low, medium, high, critical counts
4. **By Endpoint**: Most frequently violated endpoints
5. **Top IPs**: IPs with most violations
6. **Timeline**: Daily violation trends

### Suspicious IP Detection
Criteria:
- 10+ violations in last hour (configurable)
- Grouped by severity and endpoints
- Blocking recommendation if 20+ high/critical violations in last hour

### Audit Integration
- High/critical severity violations automatically logged to audit system
- Tracks: IP address, endpoint, violation count, user context
- Severity: High (5-9 violations/hour), Critical (10+ violations/hour)

## API Endpoints

### User Endpoints
```
GET /api/rate-limit/info
  - Get current user's rate limit info
  - Auth: Required

GET /api/rate-limit/violations
  - Get user's own violations
  - Auth: Required
  - Query: limit, startDate
```

### Admin Endpoints
```
GET /api/rate-limit/admin/stats
  - Get system-wide rate limit statistics
  - Auth: Admin only

GET /api/rate-limit/admin/violations
  - Get all violations with filtering
  - Auth: Admin only
  - Query: page, limit, limiterType, severity, ipAddress, userId, startDate, endDate

GET /api/rate-limit/admin/violations/ip/:ipAddress
  - Get violations by specific IP
  - Auth: Admin only
  - Returns: violations, shouldBlock recommendation

GET /api/rate-limit/admin/violations/user/:userId
  - Get violations by specific user
  - Auth: Admin only

GET /api/rate-limit/admin/suspicious-ips
  - Get list of suspicious IPs
  - Auth: Admin only
  - Query: minViolations (default 10), timeWindow (default 3600000ms)

POST /api/rate-limit/admin/reset/:key
  - Reset rate limit for specific key
  - Auth: Admin only
  - Creates audit log entry

POST /api/rate-limit/admin/cleanup
  - Clean up old violations
  - Auth: Admin only
  - Body: { daysOld: 30 } (minimum 7)
  - Creates audit log entry

DELETE /api/rate-limit/admin/violations/:id
  - Delete specific violation
  - Auth: Admin only
```

## Admin UI Features

### Overview Tab
- Total violations statistic card
- Critical violations count
- Suspicious IPs count
- Active rate limiters count
- Violations by limiter type (table with percentages)
- Violations by severity (visual grid)

### Violations Tab
- Advanced filtering:
  * Limiter type (auth, API, GDPR, admin, global)
  * Severity (low, medium, high, critical)
  * IP address search
  * Date range (start/end)
- Violations table:
  * Time, IP, User, Endpoint, Limiter, Severity, Repeat count
  * Clickable IP addresses for details
  * Pagination support
- Auto-refresh (10s, 30s, 1min, 5min intervals)

### Suspicious IPs Tab
- Table of IPs with abnormal patterns
- Shows: IP, violation count, severity breakdown, targeted endpoints
- Actions: View details, reset rate limit
- Blocking recommendations based on violation patterns

### IP Details Modal
- Full violation history for specific IP
- Block/reset recommendations
- Recent violations table (last 10)
- Direct reset action

## Redis Configuration

### Optional Setup
Rate limiting works without Redis (uses memory store), but Redis recommended for:
- Distributed deployments (multiple server instances)
- Persistent rate limit tracking across restarts
- Better performance at scale

### Environment Variables
```bash
# Optional - if not set, falls back to memory store
REDIS_URL=redis://localhost:6379

# Comma-separated list of IPs to skip rate limiting (internal services)
RATE_LIMIT_WHITELIST=127.0.0.1,::1
```

### Redis Key Format
```
rate-limit:{limiterName}:{key}

Examples:
rate-limit:auth:user:507f1f77bcf86cd799439011
rate-limit:api:ip:192.168.1.1
rate-limit:global:user:507f1f77bcf86cd799439011
```

## Security Best Practices

### Key Generation
- **Authenticated Users**: Uses `user:${userId}` to track per-user limits
- **Anonymous Users**: Uses `ip:${ipAddress}` to track per-IP limits
- Benefits: Prevents shared IP issues (offices, networks)

### IP Whitelisting
Configure trusted IPs to skip rate limiting:
```bash
RATE_LIMIT_WHITELIST=10.0.0.1,192.168.1.100,::1
```

Use for:
- Internal monitoring services
- Health check endpoints
- Trusted admin IPs

### Response Headers
Standard rate limit headers included in all responses:
```
RateLimit-Limit: 100          # Max requests in window
RateLimit-Remaining: 87       # Requests left in window
RateLimit-Reset: 1638360000   # Unix timestamp when limit resets
```

### Blocking Recommendations
System recommends IP blocking when:
- 20+ high/critical violations in last hour
- Shows in "Suspicious IPs" tab with warning
- Admin can review and take action

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too Many Requests",
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 900
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1638360900
```

## Testing

### Manual Testing
```bash
# Test auth rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# Check rate limit info
curl http://localhost:3001/api/rate-limit/info \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin: Get statistics
curl http://localhost:3001/api/rate-limit/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Admin: Reset rate limit
curl -X POST http://localhost:3001/api/rate-limit/admin/reset/ip:192.168.1.1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Load Testing
Use tools like Apache Bench or Artillery:
```bash
# Test with 1000 requests
ab -n 1000 -c 10 http://localhost:3001/api/auth/login

# Check violations
curl http://localhost:3001/api/rate-limit/admin/violations \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Maintenance

### Cleanup Schedule
- Violations automatically expire after 30 days (TTL index)
- Manual cleanup via admin UI or API: `POST /api/rate-limit/admin/cleanup`
- Minimum 7 days for manual cleanup (safety check)

### Monitoring Checklist
1. Check critical violations daily
2. Review suspicious IPs weekly
3. Adjust rate limits based on usage patterns
4. Clean up old violations monthly
5. Monitor Redis memory usage (if enabled)

### Performance Optimization
- Redis recommended for >100 req/sec
- Consider increasing limits for legitimate high-volume users
- Add specific IPs to whitelist for internal services
- Monitor violation patterns to identify configuration issues

## Troubleshooting

### Issue: Rate limits too strict
**Solution**: Adjust configuration in `rateLimiter.js`:
```javascript
auth: {
  windowMs: 15 * 60 * 1000,
  max: 10, // Increase from 5
  // ...
}
```

### Issue: Redis connection errors
**Solution**: 
- Falls back to memory store automatically
- Check `REDIS_URL` environment variable
- Verify Redis server is running
- Console shows: "❌ Rate limiting using memory store (Redis connection failed)"

### Issue: Legitimate users blocked
**Solution**:
1. Check violations in admin UI
2. Reset specific user's rate limit: `POST /admin/reset/user:{userId}`
3. Consider adding to whitelist if internal service
4. Increase limits for that endpoint type

### Issue: High memory usage
**Solution**:
- Enable Redis to offload from memory
- Reduce TTL on violations (default 30 days)
- Run cleanup more frequently
- Consider increasing `windowMs` to reduce tracking

## Integration with Other Systems

### Audit Logging
- High/critical violations auto-create audit log entries
- Track pattern: Multiple violations = security incident
- Admin reset actions logged to audit system

### Monitoring
- Statistics available via API for external monitoring
- Can integrate with Grafana/Prometheus
- Real-time alerts via webhook (future enhancement)

### IP Blocking (Future)
- Currently provides recommendations
- Can integrate with firewall (iptables, AWS WAF)
- Automatic blocking based on severity threshold

## Future Enhancements
- [ ] Automatic IP blocking via firewall integration
- [ ] Machine learning for anomaly detection
- [ ] WebSocket real-time violation alerts
- [ ] Geographic rate limiting
- [ ] Custom rate limit profiles per user role
- [ ] Rate limit bypass tokens for API clients
- [ ] Integration with CDN rate limiting (Cloudflare)
- [ ] Detailed analytics dashboard with charts

## Related Documentation
- [Audit Trail System](AUDIT_TRAIL_FEATURE.md)
- [Two-Factor Authentication](TWO_FACTOR_AUTH.md)
- [GDPR Compliance](GDPR_COMPLIANCE_FEATURE.md)
- [Security Best Practices](SECURITY.md)

## Change Log
- **2025-12-06**: Initial implementation
  * 10 tiered rate limit configurations
  * Violation tracking with severity assessment
  * Admin monitoring UI
  * Redis support with memory fallback
  * Audit logging integration
