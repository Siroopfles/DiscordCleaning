# Webhook Integration Guide

This guide explains how to integrate with our webhook system to receive real-time updates for various events.

## Overview

Our webhook system allows you to receive real-time notifications when specific events occur in the system. Instead of polling our API, you can register a webhook URL where we'll send HTTP POST requests when events happen.

## Setup

### 1. Register a Webhook

To start receiving webhooks, first register your endpoint URL:

```bash
curl -X POST https://api.example.com/api/webhooks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-domain.com/webhook",
    "events": ["task.completed", "task.updated"],
    "secret": "your-secret-key"
  }'
```

### 2. Configure Your Endpoint

Your endpoint should:
- Accept POST requests
- Respond with 2xx status code for successful deliveries
- Process requests within 10 seconds to avoid timeouts

## Authentication

### Verifying Webhook Signatures

All webhook requests include a signature in the `X-Hub-Signature` header. Verify this signature to ensure the request came from our servers:

```typescript
import crypto from 'crypto';

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in Express.js
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature'].replace('sha256=', '');
  const payload = JSON.stringify(req.body);
  
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
});
```

## Event Types

### Core Events

| Event Type | Description | Example Payload |
|------------|-------------|----------------|
| `task.created` | Task is created | `{ "taskId": "123", "title": "New Task" }` |
| `task.updated` | Task is modified | `{ "taskId": "123", "changes": ["status"] }` |
| `task.completed` | Task is marked complete | `{ "taskId": "123", "completedAt": "..." }` |
| `task.deleted` | Task is deleted | `{ "taskId": "123" }` |

### System Events

| Event Type | Description | Example Payload |
|------------|-------------|----------------|
| `system.maintenance` | Scheduled maintenance | `{ "startTime": "...", "duration": 3600 }` |
| `system.error` | System-level error | `{ "code": "DB_ERROR", "severity": "high" }` |

## Headers

Each webhook request includes the following headers:

| Header | Description |
|--------|-------------|
| `X-Webhook-ID` | Unique identifier for the webhook configuration |
| `X-Delivery-ID` | Unique identifier for this delivery attempt |
| `X-Hub-Signature` | HMAC SHA-256 signature of the payload |
| `X-Event-Type` | Type of event that triggered the webhook |
| `Content-Type` | Always `application/json` |

## Rate Limiting

- Default limit: 60 requests per minute per endpoint
- Headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Timestamp when limit resets

When rate limited, webhooks return 429 status code and retry automatically.

## Retry Logic

Failed deliveries are automatically retried with exponential backoff:
- First retry: 5 seconds
- Second retry: 25 seconds
- Third retry: 125 seconds

Maximum retries configurable up to 10 attempts.

## Best Practices

1. **Verify Signatures**
   - Always verify webhook signatures
   - Use constant-time comparison

2. **Quick Response**
   - Respond quickly (< 10 seconds)
   - Process webhooks asynchronously
   - Store raw payload before processing

3. **Idempotency**
   - Use `X-Delivery-ID` for idempotency
   - Handle duplicate deliveries gracefully
   - Store processed delivery IDs

4. **Error Handling**
   - Return appropriate HTTP status codes
   - Log failed webhook processing
   - Implement dead letter queues

5. **Testing**
   - Use test environment for integration
   - Test signature verification
   - Test rate limiting handling
   - Test retry scenarios

## Testing Your Integration

### 1. Test Mode

Register a test webhook to receive test events:

```bash
curl -X POST https://api.example.com/api/webhooks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://your-domain.com/webhook",
    "events": ["task.completed"],
    "secret": "test-secret",
    "testMode": true
  }'
```

### 2. Send Test Events

Use the test endpoint to send sample events:

```bash
curl -X POST https://api.example.com/api/webhooks/{webhook-id}/test \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "123",
    "status": "completed"
  }'
```

## Monitoring

### Delivery Dashboard

Monitor webhook deliveries in the dashboard:
- View delivery history
- Check payload details
- See error messages
- Track retry attempts

### Metrics Available

- Delivery success rate
- Average response time
- Error rate by type
- Retry frequency
- Rate limit hits

## Support

For webhook integration support:
- Email: api-support@example.com
- API Status: status.example.com
- Documentation: docs.example.com/webhooks