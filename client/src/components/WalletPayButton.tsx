// src/components/WalletPayButton.tsx
import {loadStripe} from "@stripe/stripe-js";
import type {PaymentRequest} from "@stripe/stripe-js";
import {
  Elements,
  PaymentRequestButtonElement,
  useStripe
} from "@stripe/react-stripe-js";
import {useEffect, useMemo, useState} from "react";
import { apiFetch } from "@/lib/api";

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
  const [canMakePayment, setCanMakePayment] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Détection du type d'appareil
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

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
        setCanMakePayment(result);
      } else {
        setReady(false);
        setCanMakePayment(null);
      }
    });

    // Au clic / validation Apple Pay / Google Pay :
    pr.on("paymentmethod", async (ev) => {
      setIsProcessing(true);
      try {
        // Demande un clientSecret à ton backend
        const r = await apiFetch("/api/create-payment-intent-wallet", {
          method: "POST",
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
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, amountCents, currency, label, onSuccess]);

  // Fonction pour déclencher le paiement
  const handlePayment = async () => {
    if (!paymentRequest) return;
    
    setIsProcessing(true);
    try {
      // Déclenche directement le paiement via le wallet
      await paymentRequest.show();
    } catch (error) {
      console.error("Erreur lors du déclenchement du paiement:", error);
      setIsProcessing(false);
    }
  };

  // Fonction pour ouvrir le fallback carte
  const handleCardPayment = () => {
    // Rediriger vers le formulaire de carte classique
    alert("Redirection vers le paiement par carte - à implémenter");
  };

  // Si les wallets sont disponibles, on affiche un bouton intelligent
  if (ready && paymentRequest && canMakePayment) {
    let buttonText = "Payer";
    let buttonIcon = "💳";
    
    if (isIOS && canMakePayment.applePay) {
      buttonText = "Apple Pay";
      buttonIcon = "🍎";
    } else if (isAndroid && canMakePayment.googlePay) {
      buttonText = "Google Pay";
      buttonIcon = "🇬";
    }

    return (
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`
          w-full rounded-xl px-6 py-4 font-bold text-white transition-all duration-200
          ${isProcessing 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-98'
          }
          flex items-center justify-center gap-3 shadow-lg
        `}
        data-testid="wallet-pay-button"
      >
        <span className="text-xl">{buttonIcon}</span>
        {isProcessing ? "Traitement..." : buttonText}
      </button>
    );
  }

  // Fallback: bouton pour paiement par carte si les wallets ne sont pas disponibles
  return (
    <button
      onClick={handleCardPayment}
      className="w-full rounded-xl px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
      data-testid="card-pay-button"
    >
      <span className="text-xl">💳</span>
      Payer par carte
    </button>
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