// src/components/PaystackButton.tsx
import React from 'react';
import { initializePayment } from '@/services/paymentService';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface Props {
  email: string;
  amount: number;           // NGN
  metadata?: Record<string, any>;
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
}

export const PaystackButton: React.FC<Props> = ({
  email, amount, metadata, onSuccess, onClose
}) => {
  const handleClick = async () => {
    try {
      const { authorization_url, reference } = await initializePayment(email, amount, metadata);
      if(authorization_url)
      {
          window.location.assign(authorization_url);
      }

      // open inline
    //   const handler = window.PaystackPop.setup({
    //     key: 'pk_test_27f0239341d89a17e932ead0b1ccbed01bebe0fb',
    //     email,
    //     amount: amount * 100,
    //     reference,
    //     callback: (res: any) => {
    //       onSuccess?.(res.reference);
    //     },
    //     onClose: () => {
    //       onClose?.();
    //     }
    //   });
    //   handler.openIframe();
    } catch (err) {
      console.error(err);
      alert('Could not initialize payment');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      Pay ₦{amount.toLocaleString()}
    </button>
  );
};
