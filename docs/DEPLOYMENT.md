# The 6th Tool - Deployment Guide

## Quick Start Deployment

The 6th Tool is designed to be deployed on Replit. Follow these steps to deploy to production.

### Pre-Deployment Checklist

- [ ] All features tested in development
- [ ] Stripe products seeded (`npx tsx server/seed-stripe-products.ts`)
- [ ] Admin user created
- [ ] Course content seeded (`npx tsx server/seed.ts`)
- [ ] Environment secrets configured
- [ ] Database migrations applied

### Step 1: Configure Secrets

Ensure these secrets are set in the Replit Secrets tab:

| Secret | Description | Required |
|--------|-------------|----------|
| `SESSION_SECRET` | Random 32+ character string for session encryption | Yes |
| `DATABASE_URL` | PostgreSQL connection string (auto-provided by Replit) | Yes |

### Step 2: Configure Stripe

1. Go to the Replit Integrations panel
2. Connect your Stripe account (both test and live modes)
3. The connector automatically manages API keys

### Step 3: Seed Database

```bash
# Push database schema
npm run db:push

# Seed course content
npx tsx server/seed.ts

# Seed Stripe products (run in both dev and prod)
npx tsx server/seed-stripe-products.ts
```

### Step 4: Deploy

1. Click the "Deploy" button in Replit
2. Select "Autoscale" or "Reserved VM" deployment type
3. Configure your custom domain (optional)
4. Click "Deploy"

### Step 5: Post-Deployment Verification

Run through this checklist after deployment:

1. **Health Check**
   - Visit `/api/health`
   - Verify database connection: `"database": { "status": "connected" }`
   - Verify Stripe: `"stripe": { "status": "configured" }`

2. **Authentication**
   - Test login with Replit Auth
   - Verify session persistence

3. **Payment Flow**
   - Visit `/pricing`
   - Test Stripe checkout (use test mode first)
   - Verify webhook receives events

4. **Core Features**
   - Access dashboard after login
   - Start a daily practice session
   - Navigate through a module/lesson

---

## Production Environment

### Environment Variables

In production, these are automatically set:
- `NODE_ENV=production`
- `REPLIT_DEPLOYMENT=1`
- `REPLIT_DOMAINS=your-app.replit.app`

### CORS Configuration

CORS is automatically configured to allow only your Replit domains in production.

### Rate Limiting

Applied to these endpoints:
- `/api/auth/*` - 100 requests per 15 minutes
- `/api/checkout` - 10 requests per minute
- `/api/customer-portal` - 10 requests per minute

---

## Monitoring

### Health Endpoint

`GET /api/health` returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": { "status": "connected", "latency": 5 },
  "stripe": { "status": "configured" },
  "version": "1.0.0"
}
```

Status codes:
- `200` - All systems healthy
- `503` - Degraded (database or services down)

### Stripe Dashboard

Monitor payment metrics in your Stripe Dashboard:
- Payment success rate
- Failed payment attempts
- Subscription churn
- Revenue analytics

### User Engagement

Track in Admin dashboard (`/admin/analytics`):
- Daily active users
- Practice completion rate
- Module completion rate
- Certainty rating trends

---

## Rollback Procedure

If deployment fails:

1. **Use Replit Checkpoints**
   - Go to the Replit Checkpoints panel
   - Select a previous working checkpoint
   - Click "Restore"

2. **Manual Rollback**
   - Redeploy with previous code version
   - Database schema changes may need manual intervention

### Database Rollback

If database schema changes cause issues:

1. Do NOT delete data without backup
2. Contact Replit support for database restore options
3. Use the development database to test fixes first

---

## Scaling

### Autoscale Deployment

Replit Autoscale automatically handles:
- Load balancing
- Instance scaling
- Health monitoring
- Auto-restart on failure

### Reserved VM Deployment

For predictable workloads:
- Fixed compute resources
- Always-on availability
- Lower latency

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check DATABASE_URL is set
- Verify PostgreSQL service is running
- Check network connectivity

**2. Stripe Webhooks Not Working**
- Verify Stripe connector is connected
- Check webhook URL in Stripe Dashboard
- Review server logs for webhook errors

**3. Authentication Issues**
- Clear browser cookies
- Verify SESSION_SECRET is set
- Check Replit Auth configuration

**4. Page Load Slow**
- Check health endpoint for database latency
- Review server logs for slow queries
- Consider upgrading deployment tier

### Support

- Replit Support: https://replit.com/support
- Stripe Support: https://support.stripe.com
