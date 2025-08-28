// src/pages/admin/PaymentSettings.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import {
  getPaymentSettings,
  saveFees,
  saveVat,
  saveBank,
  savePaystack,
  type PaymentSettings,
} from "@/services/adminPaymentSettings";

export default function PaymentSettings() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  // shared state
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<PaymentSettings>>({});

  // local form states (so each tab submits independently)
  const [feesEnabled, setFeesEnabled] = useState(false);
  const [feesPct, setFeesPct] = useState(0);

  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatByCountry, setVatByCountry] = useState(false);
  const [vatPct, setVatPct] = useState(0);

  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankAccName, setBankAccName] = useState("");
  const [bankCountry, setBankCountry] = useState("");
  const [bankNote, setBankNote] = useState("");

  const [paystackEnabled, setPaystackEnabled] = useState(false);
  const [paystackSecret, setPaystackSecret] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getPaymentSettings(headers);
        setSettings(data);

        // hydrate forms
        setFeesEnabled(!!data.payment_fees_enabled);
        setFeesPct(Number(data.payment_fees_percentage || 0));

        setVatEnabled(!!data.payment_vat_enabled);
        setVatByCountry(!!data.payment_country_vat_enabled);
        setVatPct(Number(data.payment_vat_percentage || 0));

        setBankEnabled(!!data.bank_transfers_enabled);
        setBankName(data.bank_name || "");
        setBankAccNumber(data.bank_account_number || "");
        setBankAccName(data.bank_account_name || "");
        setBankCountry(data.bank_account_country || "");
        setBankNote(data.bank_transfer_note || "");

        setPaystackEnabled(!!data.paystack_enabled);
        setPaystackSecret(data.paystack_secret || "");
      } catch (e) {
        console.error(e);
        toast.error("Failed to load payment settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaveFees = async () => {
    try {
      await saveFees(headers, {
        payment_fees_enabled: feesEnabled,
        payment_fees_percentage: Number(feesPct || 0),
      });
      toast.success("Fees settings saved");
    } catch (e: any) {
      toast.error("Failed to save fees", { description: e?.message });
    }
  };

  const onSaveVat = async () => {
    try {
      await saveVat(headers, {
        payment_vat_enabled: vatEnabled,
        payment_country_vat_enabled: vatByCountry,
        payment_vat_percentage: Number(vatPct || 0),
      });
      toast.success("VAT settings saved");
    } catch (e: any) {
      toast.error("Failed to save VAT", { description: e?.message });
    }
  };

  const onSaveBank = async () => {
    try {
      await saveBank(headers, {
        bank_transfers_enabled: bankEnabled,
        bank_name: bankName,
        bank_account_number: bankAccNumber,
        bank_account_name: bankAccName,
        bank_account_country: bankCountry,
        bank_transfer_note: bankNote,
      });
      toast.success("Bank transfer settings saved");
    } catch (e: any) {
      toast.error("Failed to save bank transfer settings", { description: e?.message });
    }
  };

  const onSavePaystack = async () => {
    try {
      await savePaystack(headers, {
        paystack_enabled: paystackEnabled,
        paystack_secret: paystackSecret,
      });
      toast.success("Online payment settings saved");
    } catch (e: any) {
      toast.error("Failed to save online payment settings", { description: e?.message });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 flex justify-center">
        <svg className="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Settings › Payments</h2>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-[560px]">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="online">Online Payments</TabsTrigger>
          <TabsTrigger value="bank">Bank Transfers</TabsTrigger>
        </TabsList>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="mt-6 space-y-8">
          {/* Fees */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">Payment Fees</div>
                <div className="text-sm text-gray-500">Enable/Disable Payment Fees</div>
              </div>
              <Switch checked={feesEnabled} onCheckedChange={setFeesEnabled}/>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Fees Percentage (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={feesPct}
                onChange={(e) => setFeesPct(Number(e.target.value))}
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of fees to be added to the payment amount
              </p>
            </div>

            <div className="mt-4">
              <Button onClick={onSaveFees}>Save Fees</Button>
            </div>
          </section>

          <hr className="my-6" />

          {/* VAT */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">VAT Enabled</div>
                <div className="text-sm text-gray-500">Enable/Disable VAT</div>
              </div>
              <Switch checked={vatEnabled} onCheckedChange={setVatEnabled}/>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">VAT By User Country</div>
                <div className="text-sm text-gray-500">
                  Enable/Disable VAT by user country (Manage Countries VAT)
                </div>
              </div>
              <Switch checked={vatByCountry} onCheckedChange={setVatByCountry}/>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Default VAT Percentage (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used when country VAT is not set or user has no country.
              </p>
            </div>

            <div className="mt-4">
              <Button onClick={onSaveVat}>Save VAT</Button>
            </div>
          </section>
        </TabsContent>

        {/* ONLINE PAYMENTS (Paystack) */}
        <TabsContent value="online" className="mt-6 space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">Paystack Enabled</div>
                <div className="text-sm text-gray-500">Enable payments via Paystack</div>
              </div>
              <Switch checked={paystackEnabled} onCheckedChange={setPaystackEnabled}/>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Secret Key</label>
              <Input
                type="text"
                value={paystackSecret}
                onChange={(e) => setPaystackSecret(e.target.value)}
                placeholder="sk_live_xxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paystack secret key that starts with <code>sk_</code>
              </p>
            </div>

            <div className="mt-4">
              <Button onClick={onSavePaystack}>Save Online Payments</Button>
            </div>
          </section>
        </TabsContent>

        {/* BANK TRANSFERS */}
        <TabsContent value="bank" className="mt-6 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">Bank Transfers Enabled</div>
                <div className="text-sm text-gray-500">Enable payments via Bank Transfers</div>
              </div>
              <Switch checked={bankEnabled} onCheckedChange={setBankEnabled}/>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Your Bank Name" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
              <Input value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} placeholder="Your Bank Account Number" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bank Account Name</label>
              <Input value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} placeholder="Your Bank Account Name" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bank Account Country</label>
              <Input value={bankCountry} onChange={(e) => setBankCountry(e.target.value)} placeholder="Your Bank Account Country" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Transfer Note</label>
              <Textarea rows={5} value={bankNote} onChange={(e) => setBankNote(e.target.value)}
                placeholder="In order to confirm the bank transfer, you will need to upload a receipt..." />
            </div>

            <div className="pt-2">
              <Button onClick={onSaveBank}>Save Bank Transfers</Button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
