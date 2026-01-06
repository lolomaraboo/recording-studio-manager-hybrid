# Phase 3: Billing Infrastructure - Discovery

## Research Date
2025-12-26

## Source
Existing Python implementation (recording-studio-manager/utils/stripe_subscriptions.py, 854 lines)

## API Version
Stripe API: 2025-12-15.clover (already configured)
Stripe SDK: v20.1.0 (already installed)

## Subscriptions vs One-Time Payments

**Key differences found in Python code:**

| Aspect | One-Time Payments (Current) | Subscriptions (To Implement) |
|--------|----------------------------|------------------------------|
| Mode | `mode: "payment"` | `mode: "subscription"` |
| Lifecycle | Single event | Recurring + trial + cancellation |
| Webhooks | checkout.session.completed, payment_intent.succeeded | customer.subscription.created, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted |
| Data model | paymentTransactions table | subscriptions table in master DB |
| Price object | One-time price_data | Recurring stripe.Price with interval |

## Implementation Pattern

### 1. Subscription Setup (from Python code)

**Create Products & Prices:**
```typescript
// Similar to Python create_checkout_session_direct()
stripe.checkout.Session.create({
  customer: customerId,
  mode: "subscription",  // Key difference
  line_items: [{
    price: stripePriceId,  // Pre-created monthly/yearly prices
    quantity: 1
  }],
  subscription_data: {
    trial_period_days: 14,  // 14-day trial
    metadata: {
      organization_id: org.id,
      plan_id: plan.id
    }
  },
  allow_promotion_codes: true,
  billing_address_collection: "auto"
})
```

**Trial configuration:**
- Set `trial_period_days: 14` in subscription_data
- Trial ends automatically, invoice generated
- Webhook `customer.subscription.trial_will_end` 3 days before

### 2. Subscription Lifecycle (from webhooks)

**State diagram:**
```
trialing → active → past_due → canceled
    ↓         ↓          ↓
 canceled  canceled   suspended
```

**Critical webhooks (from Python stripe_subscriptions.py):**

1. **customer.subscription.created**
   - Trigger: Subscription created after checkout
   - Action: Create Subscription record in master DB, link to Organization

2. **invoice.payment_succeeded**
   - Trigger: Recurring payment successful OR trial converted
   - Action: Update current_period_end, set status ACTIVE, reset usage counters

3. **invoice.payment_failed**
   - Trigger: Card declined, insufficient funds
   - Action: Set status PAST_DUE, send dunning email, retry per Stripe settings

4. **customer.subscription.deleted**
   - Trigger: Canceled OR payment failed after retries
   - Action: Set status CANCELED, suspend organization access

5. **charge.refunded**
   - Trigger: Admin refunds payment
   - Action: Log refund, update balance

### 3. Usage Limits (from Python subscription_limits.py)

**Approach:**
- Store limits in `subscriptionPlans` table (already exists in master schema)
- Track usage in tenant database (sessions count, storage used)
- Enforce at API level before creating resources

**Example from Python:**
```python
# Check if limit exceeded
limits = plan.limits  # JSON: {"maxSessions": 50, "maxStorage": 10}
current_usage = count_sessions_this_month(org_id)

if current_usage >= limits["maxSessions"]:
    raise LimitExceededError("Monthly session limit reached")
```

**Billing cycle reset:**
- Reset usage counters on `invoice.payment_succeeded` webhook
- Store `current_period_start` and `current_period_end` from Stripe subscription

### 4. Customer Portal (from Python billing_routes.py)

**Setup:**
```typescript
// Create portal session
const session = stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${baseUrl}/settings/billing`
})

// Redirect to session.url
```

**Portal capabilities (configured in Stripe Dashboard):**
- Update payment method
- View invoices & receipts
- Cancel subscription (with confirmation)
- Upgrade/downgrade (if enabled)

**Integration:**
- Store `stripe_customer_id` in organizations table
- Portal handles payment method updates automatically
- Webhook events sync changes back to application

## Webhook Events Required

| Event | Trigger | Action Required |
|-------|---------|-----------------|
| customer.subscription.created | Checkout completed | Create Subscription in master DB, link to Organization, set trial_end |
| customer.subscription.trial_will_end | 3 days before trial ends | Send trial ending email reminder |
| customer.subscription.updated | Plan changed, billing cycle | Update Subscription record (plan_id, billing_period, price) |
| invoice.payment_succeeded | Trial converted OR recurring payment | Set status ACTIVE, update current_period_end, reset usage counters |
| invoice.payment_failed | Payment declined | Set status PAST_DUE, send dunning email, log failure |
| customer.subscription.deleted | Canceled or suspended | Set status CANCELED, suspend org access, send cancellation email |
| charge.refunded | Admin refunds | Log refund in payment transactions |

## Key Decisions

**1. Database Model:**
- Use existing `subscriptionPlans` table in master schema (lines 111-127)
- Add `subscriptions` table to organizations (Python has `Subscription` model with fields: status, stripe_subscription_id, stripe_customer_id, plan_id, billing_period, current_period_start/end, cancel_at_period_end, trial_end)

**2. Pricing Tiers:**
- Starter: €29/month (maxSessions: 50, maxStorage: 10GB)
- Pro: €99/month (maxSessions: unlimited, maxStorage: 100GB)
- Enterprise: €299/month (unlimited everything)

**3. Trial Period:**
- 14 days for all plans (standard SaaS practice)
- No credit card upfront required (collect at trial end)

**4. Usage Enforcement:**
- Soft limits: Warn at 80%, block at 100%
- Reset counters on `invoice.payment_succeeded` (billing cycle start)

**5. Cancellation:**
- Default: Cancel at period end (prorated refund available)
- Immediate cancellation option for admins only

## Code Examples (from Python)

**Create Checkout Session:**
```typescript
// Port from Python stripe_subscriptions.py lines 147-199
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: {
    trial_period_days: 14,
    metadata: {
      organization_id: org.id,
      plan_id: plan.id
    }
  },
  allow_promotion_codes: true,
  success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/billing/cancel`
})
```

**Handle Webhook:**
```typescript
// Port from Python stripe_subscriptions.py lines 500-660
const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

switch (event.type) {
  case "customer.subscription.created":
    await handleSubscriptionCreated(event.data.object)
    break
  case "invoice.payment_succeeded":
    await handlePaymentSucceeded(event.data.object)
    break
  // ... other events
}
```

## Integration with Existing Code

**stripe-client.ts:**
- Add subscription-specific helpers:
  - `createSubscriptionCheckout()`
  - `getSubscription(subscriptionId)`
  - `cancelSubscription(subscriptionId, immediate)`

**stripe-webhook.ts:**
- Add subscription webhook handlers alongside existing payment webhooks
- Reuse `verifyWebhookSignature()` utility

**Master DB schema:**
- Already has `subscriptionPlans` table
- Already has `subscriptionTier` field on organizations
- Need to add `subscriptions` table or fields to organizations

## Pitfalls to Avoid

1. **Don't mix payment intents with subscriptions:**
   - One-time = PaymentIntent + Checkout mode: "payment"
   - Recurring = Subscription + Checkout mode: "subscription"

2. **Trial period gotcha:**
   - Stripe sends `invoice.payment_succeeded` at trial END (not start)
   - Don't activate subscription until payment succeeds

3. **Webhook idempotency:**
   - Stripe retries failed webhooks
   - Use `event.id` to prevent duplicate processing

4. **Proration calculations:**
   - Stripe handles upgrade/downgrade proration automatically
   - Don't try to calculate manually

5. **Customer object reuse:**
   - One customer per organization (store stripe_customer_id)
   - Don't create duplicate customers

6. **Usage limits timing:**
   - Reset on `invoice.payment_succeeded` (NOT on calendar month)
   - Billing periods may not align with calendar months

## Next Steps

Port Python implementation to TypeScript:
1. Create subscription checkout flow (tRPC router)
2. Implement webhook handlers for subscription events
3. Add usage limit enforcement middleware
4. Configure Customer Portal in Stripe Dashboard
