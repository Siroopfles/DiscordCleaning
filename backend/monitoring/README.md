# Monitoring Setup Guide

This document outlines the monitoring setup for the Google Calendar integration.

## Components

### 1. Prometheus Metrics
Located in `src/config/metrics.ts`
- API response times
- Sync operation durations
- Cache hit/miss ratios
- Rate limiting metrics
- Error counts

### 2. Redis Monitoring
- Performance metrics
- Cache efficiency
- Connection status

### 3. Logging System
Located in `src/utils/logger.ts`
- Structured logging with Winston
- Daily rotating log files
- Error tracking
- Request context enrichment

### 4. APM Configuration
Located in `src/config/apm.ts`
- Transaction tracking
- Error monitoring
- Performance metrics
- Resource utilization

## Setup Instructions

1. **Prometheus Setup**
```bash
# Install Prometheus locally for development
docker run -d \
    -p 9090:9090 \
    -v ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus
```

2. **Configure Redis Monitoring**
```bash
# Enable Redis metrics
redis-cli CONFIG SET notify-keyspace-events KEA
```

3. **APM Setup**
```bash
# Install Elastic APM
npm install elastic-apm-node

# Configure environment variables
ELASTIC_APM_SERVER_URL=your_apm_server_url
ELASTIC_APM_SECRET_TOKEN=your_secret_token
```

4. **Environment Variables**
```env
# Monitoring Configuration
PROMETHEUS_METRICS_PORT=9091
REDIS_MONITOR_ENABLED=true
LOG_LEVEL=info
NODE_ENV=production
```

## Alert Configuration

### Response Time Alerts
- Warning: >150ms average
- Critical: >200ms average
- Window: 5 minutes

### Cache Performance
- Warning: <80% hit rate
- Critical: <60% hit rate
- Window: 15 minutes

### Rate Limiting
- Warning: <20% quota remaining
- Critical: <10% quota remaining

### Error Rates
- Warning: >1% error rate
- Critical: >5% error rate
- Window: 5 minutes

## Dashboards

### Prometheus Metrics Dashboard
Available metrics:
- `calendar_api_duration_seconds`
- `calendar_sync_duration_seconds`
- `calendar_cache_hits_total`
- `calendar_cache_misses_total`
- `calendar_rate_limit_remaining`
- `calendar_errors_total`

### APM Dashboard
Key metrics:
- Transaction duration
- Error rates
- Resource utilization
- Dependency tracking

## Maintenance

### Log Rotation
- Daily rotation enabled
- 30 days retention
- Automatic compression

### Metric Retention
- Prometheus: 15 days
- APM: 30 days
- Error logs: 90 days

## Health Checks

```typescript
// Example health check endpoint
GET /health
{
  "status": "up",
  "redis": "connected",
  "calendar_api": "operational",
  "metrics": "collecting"
}
```

## Troubleshooting

1. **High Response Times**
   - Check Redis connection
   - Monitor API rate limits
   - Review cache efficiency

2. **Cache Miss Rate High**
   - Verify cache TTL settings
   - Check invalidation patterns
   - Monitor memory usage

3. **Rate Limiting Issues**
   - Review quota usage patterns
   - Implement request batching
   - Adjust concurrent requests

4. **Error Rate Spikes**
   - Check error logs
   - Monitor API status
   - Verify credentials