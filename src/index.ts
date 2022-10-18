import express from "express";
import cors from "cors";
import bodyparser from "body-parser";
import Stripe from "stripe";

require("dotenv").config();

const app = express();
app.use(express.static("public"))
app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json());
app.use(cors({ origin: true, credentials: true}));

const stripe = new Stripe(process.env.STRIPE_KEY as string, {apiVersion: '2022-08-01'})

app.post("/checkout", async (req, res, next) => {
  try {
      const session = await stripe.checkout.sessions.create({
      currency: 'brl',
      payment_method_types: ['card'],
      shipping_address_collection: {
      allowed_countries: ['BR'],
      },
         line_items: [
          {
            price: "5000",
            quantity: 1,

          }
         ],
         mode: "subscription",
         success_url: `${process.env.STRIPE_URL}/success.html`,
         cancel_url: `${process.env.STRIPE_URL}/cancel.html`,
      });

      res.status(200).json(session);
  } catch (error) {
      next(error);
  }
});

app.post('/create-portal-session',async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    const returnUrl = process.env.STRIPE_URL;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer as string,
      return_url: returnUrl
    })

    res.redirect(303, portalSession.url)
  } catch (error) {
    next(error);
  }
})

app.post('./webhook', express.raw({ type: 'application/json'}), (req, res) => {
  let event = req.body;

  const endpointSecret = process.env.WEBHOOK_ENDPOINT;

  if(endpointSecret) {
    const signature = req.headers['authorization'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature as string | string[] | Buffer,
        endpointSecret
      );
    } catch(ex) {
      console.log(`Webhook signature verification failed - ${ex}`)
      return res.sendStatus(400)
    }
  }
  let subscription;
  let status;

  switch (event.type) {
    case 'customer.subscription.trial_will_end':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // function to trial will end
        break;
      case 'customer.subscription.deleted':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // function to subscription deleted
        break;
      case 'customer.subscription.created':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // function to create subcription
        break;
      case 'customer.subscription.updated':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // function to update subcription
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
  }
  res.send();
})

app.listen(process.env.PORT, () => console.log(`app is running on ${process.env.PORT}`));
