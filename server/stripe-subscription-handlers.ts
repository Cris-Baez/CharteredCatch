import type { Request, Response } from "express";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { captains as captainsTable, users as usersTable } from "@shared/schema";

type RealDb = typeof import("./db")["db"];
type DbClient = Pick<RealDb, "select" | "update">;

type StripeFactory = () => Stripe;

interface SubscriptionHandlerDeps {
  db: DbClient;
  stripeFactory: StripeFactory;
}

function normalizeSubscription(subscription: Stripe.Subscription) {
  const subscriptionWithLegacyFields = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };
  const firstItem = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number | null })
    | undefined;
  const currentPeriodEnd =
    subscriptionWithLegacyFields.current_period_end ??
    firstItem?.current_period_end ??
    null;

  return {
    id: subscription.id,
    status: subscription.status,
    current_period_end: currentPeriodEnd,
    trial_end: subscription.trial_end,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
  };
}

export function makeCreateCaptainSubscriptionHandler({
  db,
  stripeFactory,
}: SubscriptionHandlerDeps) {
  return async function createCaptainSubscription(
    req: Request,
    res: Response,
  ) {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      const stripe = stripeFactory();

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );

        if (subscription.status === "active" || subscription.status === "trialing") {
          return res.json({
            subscription: normalizeSubscription(subscription),
            clientSecret: null,
          });
        }
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email || "",
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            undefined,
        });

        await db
          .update(usersTable)
          .set({ stripeCustomerId: customer.id })
          .where(eq(usersTable.id, user.id));
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: 4900,
              recurring: {
                interval: "month",
              },
              product_data: {
                name: "Captain Subscription",
                description:
                  "Professional charter captain subscription with full platform access",
              },
            } as any,
          },
        ],
        trial_period_days: 30,
      });

      await db
        .update(usersTable)
        .set({ stripeSubscriptionId: subscription.id })
        .where(eq(usersTable.id, user.id));

      return res.json({
        subscription: normalizeSubscription(subscription),
        clientSecret: null,
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      return res
        .status(500)
        .json({ error: "Failed to create subscription: " + error.message });
    }
  };
}

export function makeGetCaptainSubscriptionHandler({
  db,
  stripeFactory,
}: SubscriptionHandlerDeps) {
  return async function getCaptainSubscription(req: Request, res: Response) {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      const stripe = stripeFactory();

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));

      if (!user || !user.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      );

      return res.json({
        subscription: normalizeSubscription(subscription),
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      return res.status(500).json({ error: "Failed to get subscription" });
    }
  };
}

export function makeCancelCaptainSubscriptionHandler({
  db,
  stripeFactory,
}: SubscriptionHandlerDeps) {
  return async function cancelCaptainSubscription(
    req: Request,
    res: Response,
  ) {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const captain = await db
        .select()
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId))
        .execute();

      if (!captain.length) {
        return res
          .status(403)
          .json({ error: "Only captains can cancel subscription" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      const stripe = stripeFactory();

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));

      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      return res.json({
        subscription: normalizeSubscription(subscription),
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  };
}
