import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { CONFIG } from './config';
import { createLogger } from './logger';

const logger = createLogger('CONFIG');

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!CONFIG.STRIPE_PUBLIC_KEY) {
      logger.warn('VITE_STRIPE_PUBLIC_KEY is missing; Stripe integrations are disabled.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(CONFIG.STRIPE_PUBLIC_KEY);
    }
  }
  return stripePromise;
}
