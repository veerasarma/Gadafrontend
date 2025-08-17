// src/pages/CheckoutPage.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PaystackButton } from '@/components/payment/PaystackButton';

export default function Checkout() {
  const { user } = useAuth();
  if (!user) return null;

  const handleSuccess = (ref: string) => {
    alert(`Payment successful! Reference: ${ref}`);
    // redirect or update UI
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Complete Your Payment</h1>
      <PaystackButton
        email={user.email}
        amount={5000} // ₦5,000
        metadata={{ userId: user.id }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
