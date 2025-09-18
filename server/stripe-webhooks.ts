import Stripe from 'stripe';
import { db } from './db.js';
import { subscriptions as subscriptionsTable, users as usersTable } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(rawBody: Buffer | string, signature: string) {
  if (!WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }

  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;
  
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Find user by Stripe customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId));
    
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }
  
  // Create or update subscription in our database
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptionsTable.userId, user.id),
  });
  
  const subscriptionData = {
    userId: user.id,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending',
    planType: 'captain_monthly' as const,
    trialStartDate: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
  
  if (existingSubscription) {
    await db
      .update(subscriptionsTable)
      .set(subscriptionData)
      .where(eq(subscriptionsTable.id, existingSubscription.id));
  } else {
    await db.insert(subscriptionsTable).values(subscriptionData);
  }
  
  // Update user with subscription ID
  await db
    .update(usersTable)
    .set({ stripeSubscriptionId: subscriptionId })
    .where(eq(usersTable.id, user.id));
    
  console.log('Checkout completed for user:', user.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId));
    
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }
  
  // Update subscription status
  await db
    .update(subscriptionsTable)
    .set({
      status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
    .where(eq(subscriptionsTable.stripeSubscriptionId, subscription.id));
    
  console.log('Subscription updated for user:', user.id, 'Status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Mark subscription as canceled in our database
  await db
    .update(subscriptionsTable)
    .set({
      status: 'canceled' as const,
      cancelAtPeriodEnd: false,
    })
    .where(eq(subscriptionsTable.stripeSubscriptionId, subscription.id));
    
  console.log('Subscription canceled:', subscription.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user by customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId));
    
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }
  
  // Could implement additional logic here:
  // - Send payment failed email
  // - Update subscription to past_due status
  // - Disable access after grace period
  
  console.log('Payment failed for user:', user.id);
}