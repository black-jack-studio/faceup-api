import React, { useEffect } from "react";
import { apiFetch } from "@/lib/api";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  packType: 'coins' | 'gems';
  packId: number;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: any) => void;
}

export default function PayPalButton({
  amount,
  packType,
  packId,
  onSuccess,
  onCancel,
  onError,
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      packType: packType,
      packId: packId,
    };
    
    const response = await apiFetch("/api/paypal/order", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
    
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await apiFetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
    });
    
    const data = await response.json();
    return data;
  };

  const handleApprove = async (data: any) => {
    console.log("PayPal onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("PayPal Capture result", orderData);
    
    if (orderData.status === 'COMPLETED') {
      onSuccess();
    } else {
      onError(orderData);
    }
  };

  const handleCancel = async (data: any) => {
    console.log("PayPal onCancel", data);
    onCancel();
  };

  const handleError = async (data: any) => {
    console.log("PayPal onError", data);
    onError(data);
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    const initPayPal = async () => {
      try {
        const clientToken: string = await apiFetch("/api/paypal/setup")
          .then((res) => res.json())
          .then((data) => data.clientToken);

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: handleApprove,
          onCancel: handleCancel,
          onError: handleError,
        });

        const onClick = async () => {
          try {
            const checkoutOptionsPromise = createOrder();
            await paypalCheckout.start(
              { paymentFlow: "auto" },
              checkoutOptionsPromise,
            );
          } catch (e) {
            console.error(e);
            onError(e);
          }
        };

        const paypalButton = document.getElementById("paypal-button");
        if (paypalButton) {
          paypalButton.addEventListener("click", onClick);
        }

        return () => {
          if (paypalButton) {
            paypalButton.removeEventListener("click", onClick);
          }
        };
      } catch (e) {
        console.error("PayPal initialization error:", e);
        onError(e);
      }
    };

    loadPayPalSDK();
  }, [amount, packType, packId]);

  return <paypal-button id="paypal-button">Payer avec PayPal</paypal-button>;
}