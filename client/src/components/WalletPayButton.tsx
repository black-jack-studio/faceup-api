// src/components/WalletPayButton.tsx
import {loadStripe} from "@stripe/stripe-js";
import type {PaymentRequest} from "@stripe/stripe-js";
import {
  Elements,
  PaymentRequestButtonElement,
  useStripe
} from "@stripe/react-stripe-js";
import {useEffect, useMemo, useState} from "react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

type Props = {
  // ex: 599 = 5,99€ (en cents)
  amountCents: number;
  currency?: "eur" | "usd";
  label?: string; // label de la ligne totale
  onSuccess?: () => void;
};

function InnerButton({ amountCents, currency = "eur", label = "BlackGame purchase", onSuccess }: Props) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: currency === "eur" ? "FR" : "US",
      currency,
      total: { label, amount: amountCents },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setReady(true);
      } else {
        setReady(false);
      }
    });

    // Au clic / validation Apple Pay / Google Pay :
    pr.on("paymentmethod", async (ev) => {
      try {
        // Demande un clientSecret à ton backend
        const r = await fetch("/api/create-payment-intent-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountCents,
            currency,
            metadata: { source: "wallet", product: "gems_pack_1" }
          }),
        });
        const { clientSecret, error } = await r.json();
        if (error) throw new Error(error);

        // Confirme le paiement avec le paymentMethod d'Apple/Google Pay
        const { error: confirmError } = await stripe!.confirmCardPayment(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        if (confirmError) {
          ev.complete("fail");
          console.error(confirmError);
          return;
        }

        ev.complete("success");
        onSuccess?.(); // crédite les gemmes/coins ici (appel Supabase, state, etc.)
      } catch (e) {
        console.error(e);
        ev.complete("fail");
      }
    });
  }, [stripe, amountCents, currency, label, onSuccess]);

  if (!ready || !paymentRequest) {
    // Fallback vers un bouton "Acheter" normal si Apple/Google Pay indisponible
    return (
      <button
        className="rounded-full px-4 py-2 bg-white/10 text-white"
        onClick={() => alert("Wallet not available here — fallback flow")}
      >
        Buy
      </button>
    );
  }

  return (
    <PaymentRequestButtonElement
      options={{
        paymentRequest,
        style: {
          paymentRequestButton: {
            type: "buy",        // "buy" | "donate" | "default"
            theme: "dark",      // "dark" | "light" | "light-outline"
            height: "44px",
          }
        }
      }}
    />
  );
}

export default function WalletPayButton(props: Props) {
  const options = useMemo(() => ({ 
    appearance: { theme: "night" as const }
  }), []);
  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerButton {...props} />
    </Elements>
  );
}