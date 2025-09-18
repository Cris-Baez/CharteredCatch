import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  makeCancelCaptainSubscriptionHandler,
  makeCreateCaptainSubscriptionHandler,
  makeGetCaptainSubscriptionHandler,
} from "../server/stripe-subscription-handlers";
import { captains as captainsTable, users as usersTable } from "@shared/schema";

type CaptainRecord = {
  userId: string;
};

type UserRecord = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

class FakeDb {
  public user: UserRecord;
  private readonly captains: CaptainRecord[];

  constructor(user: UserRecord, captains: CaptainRecord[]) {
    this.user = { ...user };
    this.captains = [...captains];
  }

  select() {
    return {
      from: (table: unknown) => {
        if (table === usersTable) {
          return {
            where: async () => [{ ...this.user }],
          };
        }

        if (table === captainsTable) {
          return {
            where: () => ({
              execute: async () =>
                this.captains.filter((captain) => captain.userId === this.user.id),
            }),
          };
        }

        return {
          where: async () => [],
        };
      },
    };
  }

  update(table: unknown) {
    return {
      set: (values: Partial<UserRecord>) => ({
        where: async () => {
          if (table === usersTable) {
            this.user = { ...this.user, ...values };
          }
        },
      }),
    };
  }
}

type SubscriptionRecord = {
  id: string;
  status: string;
  current_period_end: number;
  trial_end: number | null;
  cancel_at_period_end: boolean;
};

class FakeStripe {
  private customerCounter = 0;
  private subscriptionCounter = 0;
  private readonly customerStore = new Map<string, { id: string; email?: string; name?: string }>();
  private readonly subscriptionStore = new Map<string, SubscriptionRecord>();

  customers = {
    retrieve: async (id: string) => {
      const customer = this.customerStore.get(id);
      if (!customer) {
        throw new Error(`Customer ${id} not found`);
      }
      return customer;
    },
    create: async ({ email, name }: { email?: string; name?: string }) => {
      const id = `cus_${++this.customerCounter}`;
      const customer = { id, email, name };
      this.customerStore.set(id, customer);
      return customer;
    },
  };

  subscriptions = {
    retrieve: async (id: string) => {
      const subscription = this.subscriptionStore.get(id);
      if (!subscription) {
        throw new Error(`Subscription ${id} not found`);
      }
      return subscription;
    },
    create: async ({ customer }: { customer: string }) => {
      const id = `sub_${++this.subscriptionCounter}`;
      const now = Math.floor(Date.now() / 1000);
      const subscription: SubscriptionRecord = {
        id,
        status: "trialing",
        current_period_end: now + 60 * 60 * 24 * 30,
        trial_end: now + 60 * 60 * 24 * 30,
        cancel_at_period_end: false,
      };
      this.subscriptionStore.set(id, subscription);
      return subscription;
    },
    update: async (
      id: string,
      { cancel_at_period_end }: { cancel_at_period_end?: boolean },
    ) => {
      const subscription = this.subscriptionStore.get(id);
      if (!subscription) {
        throw new Error(`Subscription ${id} not found`);
      }
      if (typeof cancel_at_period_end === "boolean") {
        subscription.cancel_at_period_end = cancel_at_period_end;
      }
      this.subscriptionStore.set(id, subscription);
      return subscription;
    },
  };
}

function createRequest(): Request {
  return {
    session: {
      userId: "user-1",
    },
  } as unknown as Request;
}

class MockResponse {
  statusCode = 200;
  body: unknown;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(payload: unknown) {
    this.body = payload;
    return this;
  }
}

async function run() {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";

  const db = new FakeDb(
    {
      id: "user-1",
      email: "captain@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
    [{ userId: "user-1" }],
  );

  const stripe = new FakeStripe();
  const stripeFactory = () => stripe;

  const createHandler = makeCreateCaptainSubscriptionHandler({
    db: db as unknown as any,
    stripeFactory,
  });

  const getHandler = makeGetCaptainSubscriptionHandler({
    db: db as unknown as any,
    stripeFactory,
  });

  const cancelHandler = makeCancelCaptainSubscriptionHandler({
    db: db as unknown as any,
    stripeFactory,
  });

  const createRes = new MockResponse();
  await createHandler(createRequest(), createRes as unknown as Response);
  assert.equal(createRes.statusCode, 200);
  const created = createRes.body as {
    subscription: SubscriptionRecord;
    clientSecret: null;
  };
  assert.ok(created.subscription.id);
  assert.equal(db.user.stripeSubscriptionId, created.subscription.id);
  assert.equal(db.user.stripeCustomerId?.startsWith("cus_"), true);

  const getRes = new MockResponse();
  await getHandler(createRequest(), getRes as unknown as Response);
  assert.equal(getRes.statusCode, 200);
  const retrieved = getRes.body as { subscription: SubscriptionRecord | null };
  assert.ok(retrieved.subscription);
  assert.equal(retrieved.subscription?.id, created.subscription.id);

  const cancelRes = new MockResponse();
  await cancelHandler(createRequest(), cancelRes as unknown as Response);
  assert.equal(cancelRes.statusCode, 200);
  const cancelled = cancelRes.body as { subscription: SubscriptionRecord };
  assert.equal(cancelled.subscription.cancel_at_period_end, true);

  console.log(
    "Stripe subscription handlers create/retrieve/cancel flows completed without throwing.",
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
