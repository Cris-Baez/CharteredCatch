#!/usr/bin/env npx tsx

import express from "express";
import Stripe from "stripe";
import { once } from "events";
import type { AddressInfo } from "net";

async function main() {
  // Provide sensible defaults so the webhook module can be imported in isolation.
  process.env.STRIPE_SECRET_KEY =
    process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy_secret";
  process.env.STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_dummy_secret";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/postgres";

  const { stripeWebhookRouter } = await import("../server/routes");

  const app = express();
  app.use(stripeWebhookRouter);

  const server = app.listen(0);
  await once(server, "listening");
  const port = (server.address() as AddressInfo).port;

  const payload = JSON.stringify({
    id: "evt_test_webhook",
    object: "event",
    type: "charge.succeeded",
  });

  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });

  const url = `http://127.0.0.1:${port}/api/stripe/webhook`;

  const sendWebhook = async (attempt: number) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });

    console.log(`Attempt ${attempt}: HTTP ${response.status}`);

    if (response.status !== 200) {
      throw new Error(`Expected HTTP 200 but received ${response.status}`);
    }
  };

  await sendWebhook(1);
  await sendWebhook(2);

  console.log(
    "Stripe webhook responded with HTTP 200 on the initial delivery and retry."
  );

  server.close();
}

main().catch((error) => {
  console.error("Stripe webhook test failed:", error);
  process.exitCode = 1;
});
