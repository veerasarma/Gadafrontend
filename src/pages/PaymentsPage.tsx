// src/pages/PaymentsPage.tsx
// src/pages/PaymentsPage.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import {
  fetchTransactions,
  Transaction,
  initializePayment,
  fetchBalance
} from "@/services/paymentService";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, CreditCard } from "lucide-react";
import { PaystackButton } from "@/components/payment/PaystackButton";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentsPage() {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [balance, setBalance] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [amount, setAmount] = useState<number | "">("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingTx(true);
    fetchTransactions(headers, startDate || undefined, endDate || undefined)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoadingTx(false));

      fetchBalance(headers)
      .then(setBalance)
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [accessToken, startDate, endDate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!user?.email || !amt || amt <= 0) return;

    setPayLoading(true);
    try {
      const { authorization_url, reference } = await initializePayment(
        user.email,
        amt,
        { userId: user.id }
      );

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: amt * 100,
        reference,
        callback: () => {
          // refresh filters to reload
          setStartDate("");
          setEndDate("");
        },
        onClose: () => {},
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert("Could not initiate payment");
    } finally {
      setPayLoading(false);
    }
  };

  const handleSuccess = (ref: string) => {
    // alert(`Payment successful! Reference: ${ref}`);
    console.log(ref, "refrefrefref");
    // redirect or update UI
  };

  // const balance = user?.walletBalance ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            {/* Banner & Tabs */}
            <div className="rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 flex items-center">
                <Wallet className="h-8 w-8 text-white mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Wallet</h1>
                  <p className="text-white/90">Send and transfer money</p>
                </div>
              </div>
              <div className="bg-white">
                <nav className="flex gap-8 px-6">
                  <button className="py-4 text-blue-600 border-b-2 border-blue-600 font-medium">
                    Wallet
                  </button>
                  <button
                    className="py-4 text-gray-600 hover:text-gray-900"
                    onClick={() => (window.location.href = "/payments")}
                  >
                    Payments
                  </button>
                </nav>
              </div>
            </div>

            {/* Balance + Checkout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Credit</p>
                  <p className="text-2xl font-semibold">
                    ₦{balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <form
                  onSubmit={handleCheckout}
                  className="flex flex-col sm:flex-row gap-3 sm:items-end"
                >
                  <div className="flex-1">
                    <label
                      htmlFor="amount"
                      className="block text-sm text-gray-600 mb-1"
                    >
                      Amount (₦)
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) =>
                        setAmount(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Enter amount"
                      className="h-11"
                    />
                  </div>
                  {user && user.email && (
                    <PaystackButton
                      email={user.email}
                      amount={amount} // ₦5,000
                      metadata={{ userId: user.id }}
                      //   onSuccess={handleSuccess}
                    />
                  )}
                  {/* <Button
                    type="submit"
                    disabled={payLoading || !amount || Number(amount) <= 0}
                    className="h-11 px-6 w-full sm:w-auto"
                  >
                    {payLoading ? 'Processing…' : 'Checkout'}
                  </Button> */}
                </form>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:items-end">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="h-11"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="h-11"
                  />
                </div>
                <div className="flex sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="h-11 w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Transactions (UPDATED TABLE API) */}
            <div className="bg-white rounded-lg shadow p-6">
              {loadingTx ? (
                <div className="flex justify-center py-10">
                  <svg
                    className="animate-spin h-6 w-6 text-gray-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                      <TableHead className="text-right">Amount (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {format(new Date(tx.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        {/* <TableCell
                          className={`capitalize ${
                            tx.status === "success"
                              ? "text-green-600"
                              : tx.status === "pending"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.status}
                        </TableCell> */}
                        <TableCell className="text-right">
                          {tx.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}

                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-500 py-10"
                        >
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import { format } from 'date-fns';
// import { useAuth } from '@/contexts/AuthContext';
// import { useAuthHeader } from '@/hooks/useAuthHeader';
// import { fetchTransactions, Transaction } from '@/services/paymentService';
// import { Navbar } from '@/components/layout/Navbar';
// import Sidebar from '@/components/ui/Sidebar1';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Wallet, CreditCard } from 'lucide-react';

// export default function PaymentsPage() {
//   const { user, accessToken } = useAuth();
//   const headers = useAuthHeader(accessToken);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [startDate, setStartDate] = useState<string>('');
//   const [endDate, setEndDate]   = useState<string>('');

//   // Load on mount or date changes
//   useEffect(() => {
//     if (!accessToken) return;
//     setLoading(true);
//     fetchTransactions(headers, startDate, endDate)
//       .then(setTransactions)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [accessToken, startDate, endDate]);

//   // Dummy balance—replace with real fetch
//   const balance =  user?.walletBalance ?? 0;

//   return (
//     <div className="flex flex-col min-h-screen bg-gray-100">
//       <Navbar />

//       <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
//         <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">

//           {/* Sidebar */}
//           <aside className="hidden lg:block lg:w-1/5">
//             <div className="sticky top-16">
//               <Sidebar />
//             </div>
//           </aside>

//           {/* Main content */}
//           <main className="flex-1 flex flex-col overflow-y-auto">
//             <div className="space-y-6 py-6">

//               {/* Banner & Tabs */}
//               <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg overflow-hidden">
//                 <div className="px-6 py-8 flex items-center">
//                   <Wallet className="h-8 w-8 text-white mr-4" />
//                   <div>
//                     <h1 className="text-2xl font-bold text-white">Wallet</h1>
//                     <p className="text-white">Send and transfer money</p>
//                   </div>
//                 </div>
//                 <div className="bg-white">
//                   <nav className="flex space-x-8 px-6">
//                     <button className="py-4 text-blue-600 border-b-2 border-blue-600 font-medium">
//                       Wallet
//                     </button>
//                     <button
//                       className="py-4 text-gray-600 hover:text-gray-900"
//                       onClick={() => window.location.href = '/payments'}
//                     >
//                       Payments
//                     </button>
//                   </nav>
//                 </div>
//               </div>

//               {/* Summary */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
//                   <CreditCard className="h-6 w-6 text-gray-500" />
//                   <div>
//                     <p className="text-sm text-gray-500">Your Credit</p>
//                     <p className="text-2xl font-semibold">₦{balance.toLocaleString()}</p>
//                   </div>
//                 </div>
//                 {/* You could add quick actions here */}
//               </div>

//               {/* Filters */}
//               <div className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row items-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Start Date</p>
//                   <Input
//                     type="date"
//                     value={startDate}
//                     onChange={e => setStartDate(e.target.value)}
//                     max={format(new Date(), 'yyyy-MM-dd')}
//                   />
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">End Date</p>
//                   <Input
//                     type="date"
//                     value={endDate}
//                     onChange={e => setEndDate(e.target.value)}
//                     max={format(new Date(), 'yyyy-MM-dd')}
//                   />
//                 </div>
//                 <Button onClick={() => { setStartDate(''); setEndDate(''); }}>
//                   Clear
//                 </Button>
//               </div>

//               {/* Transactions Table */}
//               <div className="bg-white rounded-lg shadow p-6">
//                 {loading ? (
//                   <div className="flex justify-center py-10">
//                     {/* <Loader className="h-6 w-6 animate-spin text-gray-500" /> */}
//                   </div>
//                 ) : (
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Date</TableHead>
//                         <TableHead>Type</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Amount (₦)</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {transactions.map(tx => (
//                         <TableRow key={tx.id}>
//                           <TableCell>{format(new Date(tx.createdAt), 'MMM d, yyyy')}</TableCell>
//                           <TableCell className="capitalize">{tx.type}</TableCell>
//                           <TableCell className={`capitalize ${tx.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
//                             {tx.status}
//                           </TableCell>
//                           <TableCell className="text-right">
//                             {tx.amount.toLocaleString()}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                       {transactions.length === 0 && (
//                         <TableRow>
//                           <TableCell colSpan={4} className="text-center text-gray-500 py-10">
//                             No transactions found.
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 )}
//               </div>
//             </div>
//           </main>

//         </div>
//       </div>
//     </div>
//   );
// }
