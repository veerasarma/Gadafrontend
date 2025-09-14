// src/pages/AdsManager.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   createCampaign,
//   myCampaigns,
//   uploadAdImage,
//   setActive,
//   Campaign,
// } from "@/services/adsService";
// import { useAuth } from "@/contexts/AuthContext";
// import { useAuthHeader, useAuthHeaderupload } from "@/hooks/useAuthHeader";
// import { Navbar } from "@/components/layout/Navbar";
// import Sidebar from "@/components/ui/Sidebar1";

// export default function AdsManager() {
//   const { accessToken, isLoading: authLoading } = useAuth();
//   const authHeaders = useAuthHeader(accessToken);              // API headers (JWT etc.)  :contentReference[oaicite:1]{index=1}
//   const uploadHeaders = useAuthHeaderupload(accessToken);      // Upload-safe headers     :contentReference[oaicite:2]{index=2}

//   const [form, setForm] = useState<any>({
//     campaign_title: "",
//     campaign_start_date: "",
//     campaign_end_date: "",
//     campaign_budget: "",
//     campaign_bidding: "click",
//     audience_countries: "",
//     audience_gender: "all",
//     audience_relationship: "all",
//     ads_title: "",
//     ads_description: "",
//     ads_type: "url",
//     ads_url: "",
//     ads_placement: "newsfeed",
//     ads_image: "",
//   });
//   const [uploading, setUploading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [items, setItems] = useState<Campaign[]>([]);
//   const [page, setPage] = useState(1);
//   const [total, setTotal] = useState(0);

//   const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 10)), [total]);

//   // --------- handlers
//   const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0];
//     if (!f) return;
//     setUploading(true);
//     const r = await uploadAdImage(f, uploadHeaders);
//     setUploading(false);
//     if (r?.ok) setForm((s: any) => ({ ...s, ads_image: r.path }));
//     else alert(r?.error || "Upload failed");
//   };

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     const payload = {
//       ...form,
//       campaign_budget: Number(form.campaign_budget),
//       campaign_start_date: form.campaign_start_date
//         ? new Date(form.campaign_start_date).toISOString()
//         : null,
//       campaign_end_date: form.campaign_end_date
//         ? new Date(form.campaign_end_date).toISOString()
//         : null,
//       audience_countries: (form.audience_countries || "")
//         .split(",")
//         .map((x: string) => x.trim())
//         .filter(Boolean)
//         .join(","),
//     };
//     const r = await createCampaign(payload, authHeaders);
//     setSubmitting(false);
//     if (!r?.ok) return alert(r?.error || "Failed to create campaign");
//     setForm((s: any) => ({ ...s, campaign_title: "", campaign_budget: "", ads_title: "", ads_description: "", ads_url: "", ads_image: "" }));
//     load(1);
//   };

//   async function load(p = page) {
//     const r = await myCampaigns(p, 10, authHeaders);
//     if (r?.ok) {
//       setItems(r.items || []);
//       setTotal(r.total || 0);
//       setPage(r.page || 1);
//     }
//   }

//   useEffect(() => {
//     if (!accessToken || authLoading) return;
//     load(1);
//   }, [authLoading, accessToken]);

//   return (
//     <div className="flex flex-col min-h-screen bg-cus">
//       {/* Top nav just like Payments page */} {/* :contentReference[oaicite:3]{index=3} */}
//       <Navbar />

//       <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
//         <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
//           {/* LEFT SIDEBAR */} {/* :contentReference[oaicite:4]{index=4} */}
//           <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
//             <Sidebar />
//           </aside>

//           {/* MAIN */}
//           <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
//             {/* Header banner */}
//             <header className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 sm:p-8">
//               <h1 className="text-2xl sm:text-3xl font-bold">Ads Manager</h1>
//               <p className="opacity-90">Manage Ads, Create new Campaign</p>
//             </header>

//             {/* ===== New Campaign ===== */}
//             <section className="rounded-2xl border bg-white shadow p-4 sm:p-6">
//               <h2 className="text-xl font-semibold mb-4">New Campaign</h2>

//               {/* Responsive 12-column layout for perfect alignment */}
//               <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
//                 {/* Left column (md: 6) */}
//                 <div className="md:col-span-6 grid grid-cols-1 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium">Campaign Title</label>
//                     <input
//                       className="w-full border rounded-lg p-2"
//                       value={form.campaign_title}
//                       onChange={(e) => setForm({ ...form, campaign_title: e.target.value })}
//                       placeholder="Set a title for your campaign"
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium">Start</label>
//                       <input
//                         type="datetime-local"
//                         className="w-full border rounded-lg p-2"
//                         value={form.campaign_start_date}
//                         onChange={(e) => setForm({ ...form, campaign_start_date: e.target.value })}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">End</label>
//                       <input
//                         type="datetime-local"
//                         className="w-full border rounded-lg p-2"
//                         value={form.campaign_end_date}
//                         onChange={(e) => setForm({ ...form, campaign_end_date: e.target.value })}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium">Budget (₦)</label>
//                     <input
//                       type="number"
//                       min={0}
//                       className="w-full border rounded-lg p-2"
//                       value={form.campaign_budget}
//                       onChange={(e) => setForm({ ...form, campaign_budget: e.target.value })}
//                       placeholder="E.g., 10000"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium">Bidding</label>
//                     <select
//                       className="w-full border rounded-lg p-2"
//                       value={form.campaign_bidding}
//                       onChange={(e) => setForm({ ...form, campaign_bidding: e.target.value })}
//                     >
//                       <option value="click">Pay Per Click (₦50)</option>
//                       <option value="view">Pay Per View (₦10)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <div className="font-medium text-sm mb-1">Target Audience</div>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs text-gray-500">Audience Country (CSV of IDs)</label>
//                         <textarea
//                           rows={4}
//                           className="w-full border rounded-lg p-2"
//                           placeholder="e.g., 161,230"
//                           value={form.audience_countries}
//                           onChange={(e) => setForm({ ...form, audience_countries: e.target.value })}
//                         />
//                       </div>
//                       <div className="grid gap-4">
//                         <div>
//                           <label className="block text-xs text-gray-500">Gender</label>
//                           <select
//                             className="w-full border rounded-lg p-2"
//                             value={form.audience_gender}
//                             onChange={(e) => setForm({ ...form, audience_gender: e.target.value })}
//                           >
//                             <option value="all">All</option>
//                             <option value="male">Male</option>
//                             <option value="female">Female</option>
//                           </select>
//                         </div>
//                         <div>
//                           <label className="block text-xs text-gray-500">Relationship</label>
//                           <select
//                             className="w-full border rounded-lg p-2"
//                             value={form.audience_relationship}
//                             onChange={(e) => setForm({ ...form, audience_relationship: e.target.value })}
//                           >
//                             <option value="all">All</option>
//                             <option value="single">Single</option>
//                             <option value="married">Married</option>
//                           </select>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Right column (md: 6) */}
//                 <div className="md:col-span-6 grid grid-cols-1 gap-4">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium">Ads Title</label>
//                       <input
//                         className="w-full border rounded-lg p-2"
//                         value={form.ads_title}
//                         onChange={(e) => setForm({ ...form, ads_title: e.target.value })}
//                         placeholder="Set a title for your ads"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Placement</label>
//                       <select
//                         className="w-full border rounded-lg p-2"
//                         value={form.ads_placement}
//                         onChange={(e) => setForm({ ...form, ads_placement: e.target.value })}
//                       >
//                         <option value="newsfeed">Newsfeed</option>
//                         <option value="sidebar">Sidebar</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium">Ads Description (max 200)</label>
//                     <textarea
//                       maxLength={200}
//                       rows={5}
//                       className="w-full border rounded-lg p-2"
//                       value={form.ads_description}
//                       onChange={(e) => setForm({ ...form, ads_description: e.target.value })}
//                       placeholder="Set a description for your ads"
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium">Advertise For</label>
//                       <select
//                         className="w-full border rounded-lg p-2"
//                         value={form.ads_type}
//                         onChange={(e) => setForm({ ...form, ads_type: e.target.value })}
//                       >
//                         <option value="url">URL</option>
//                         <option value="post">Post</option>
//                         <option value="page">Page</option>
//                         <option value="group">Group</option>
//                         <option value="event">Event</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Target URL</label>
//                       <input
//                         className="w-full border rounded-lg p-2"
//                         value={form.ads_url}
//                         onChange={(e) => setForm({ ...form, ads_url: e.target.value })}
//                         placeholder="https://example.com"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium">Ads Image</label>
//                     <div className="flex items-center gap-3">
//                       <input type="file" accept="image/*" onChange={pickFile} />
//                       {uploading && <span className="text-sm">Uploading…</span>}
//                     </div>
//                     {form.ads_image && (
//                       <img src={form.ads_image} className="h-24 mt-2 rounded-lg" />
//                     )}
//                   </div>

//                   <div className="pt-2">
//                     <button
//                       disabled={submitting}
//                       className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
//                     >
//                       {submitting ? "Publishing…" : "Publish"}
//                     </button>
//                   </div>
//                 </div>
//               </form>
//             </section>

//             {/* ===== Campaign list ===== */}
//             <section className="rounded-2xl border bg-white shadow p-4 sm:p-6">
//               <div className="flex items-center justify-between mb-3">
//                 <h2 className="text-xl font-semibold">My Campaigns</h2>
//               </div>

//               {/* Mobile cards */}
//               <div className="grid md:hidden gap-3">
//                 {items.map((c) => (
//                   <div key={c.campaign_id} className="rounded-xl border p-4">
//                     <div className="font-semibold">{c.campaign_title}</div>
//                     <div className="text-xs text-gray-500 mt-1">
//                       {new Date(c.campaign_start_date).toLocaleDateString()} –{" "}
//                       {new Date(c.campaign_end_date).toLocaleDateString()}
//                     </div>
//                     <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
//                       <div>Budget: ₦{c.campaign_budget.toFixed(2)}</div>
//                       <div>Spend: ₦{c.campaign_spend.toFixed(2)}</div>
//                       <div>Bidding: {c.campaign_bidding === "click" ? "Click" : "View"}</div>
//                       <div>Clicks/Views: {c.campaign_clicks} / {c.campaign_views}</div>
//                     </div>
//                     <div className="mt-2">
//                       {c.campaign_is_active === "1" ? (
//                         <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
//                           Active
//                         </span>
//                       ) : (
//                         <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">
//                           Not Active
//                         </span>
//                       )}
//                     </div>
//                     <div className="mt-3 flex gap-2">
//                       {c.campaign_is_active === "1" ? (
//                         <button
//                           onClick={() => setActive(c.campaign_id, false, authHeaders).then(() => load())}
//                           className="text-xs rounded-md border px-3 py-1"
//                         >
//                           Pause
//                         </button>
//                       ) : (
//                         <button
//                           onClick={() => setActive(c.campaign_id, true, authHeaders).then(() => load())}
//                           className="text-xs rounded-md border px-3 py-1"
//                         >
//                           Resume
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//                 {!items.length && (
//                   <div className="text-center text-gray-500 py-6">No campaigns yet.</div>
//                 )}
//               </div>

//               {/* Desktop table */}
//               <div className="hidden md:block overflow-auto">
//                 <table className="min-w-full text-sm">
//                   <thead>
//                     <tr className="[&>th]:text-left [&>th]:py-2">
//                       <th>Title</th>
//                       <th>Start - End</th>
//                       <th>Budget</th>
//                       <th>Spend</th>
//                       <th>Bidding</th>
//                       <th>Clicks/Views</th>
//                       <th>Status</th>
//                       <th>Created</th>
//                       <th></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {items.map((c) => (
//                       <tr key={c.campaign_id} className="[&>td]:py-2 border-t">
//                         <td>{c.campaign_title}</td>
//                         <td>
//                           {new Date(c.campaign_start_date).toLocaleDateString()} -{" "}
//                           {new Date(c.campaign_end_date).toLocaleDateString()}
//                         </td>
//                         <td>₦{c.campaign_budget.toFixed(2)}</td>
//                         <td>₦{c.campaign_spend.toFixed(2)}</td>
//                         <td>{c.campaign_bidding === "click" ? "🖱 Click" : "👁 View"}</td>
//                         <td>{c.campaign_clicks} / {c.campaign_views}</td>
//                         <td>
//                           {c.campaign_is_active === "1" ? (
//                             <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5">
//                               Active
//                             </span>
//                           ) : (
//                             <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
//                               Not Active
//                             </span>
//                           )}
//                         </td>
//                         <td>{new Date(c.campaign_created_date).toLocaleDateString()}</td>
//                         <td className="space-x-2">
//                           {c.campaign_is_active === "1" ? (
//                             <button
//                               onClick={() => setActive(c.campaign_id, false, authHeaders).then(() => load())}
//                               className="text-xs rounded-md border px-2 py-1"
//                             >
//                               Pause
//                             </button>
//                           ) : (
//                             <button
//                               onClick={() => setActive(c.campaign_id, true, authHeaders).then(() => load())}
//                               className="text-xs rounded-md border px-2 py-1"
//                             >
//                               Resume
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                     {!items.length && (
//                       <tr>
//                         <td colSpan={9} className="py-8 text-center text-gray-500">
//                           No campaigns yet.
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* pager */}
//               <div className="flex items-center justify-end gap-2 mt-4">
//                 <button
//                   disabled={page <= 1}
//                   onClick={() => load(page - 1)}
//                   className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
//                 >
//                   Previous
//                 </button>
//                 <div className="text-sm">Page {page} / {totalPages}</div>
//                 <button
//                   disabled={page >= totalPages}
//                   onClick={() => load(page + 1)}
//                   className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </div>
//             </section>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "sonner";

import {
  createCampaign,
  myCampaigns,
  uploadAdImage,
  setActive,
  getCountries,
  updateCampaign,
  deleteCampaign,
  Campaign,
} from "@/services/adsService";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "@/hooks/useAuthHeader";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import { stripUploads } from '@/lib/url';
const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

type Option = { value: number; label: string };

export default function AdsManager() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const authHeaders = useAuthHeader(accessToken);
  const uploadHeaders = useAuthHeaderupload(accessToken);

  const [countries, setCountries] = useState<Option[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const [form, setForm] = useState<any>({
    campaign_title: "",
    campaign_start_date: "",
    campaign_end_date: "",
    campaign_budget: "",
    campaign_bidding: "click",
    audience_countries: [] as Option[],
    audience_gender: "all",
    audience_relationship: "all",
    ads_title: "",
    ads_description: "",
    ads_type: "url",
    ads_url: "",
    ads_placement: "newsfeed",
    ads_image: "",
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 10)), [total]);

  // ====== Edit modal state ======
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    // prepare edit form from item
    if (!editing) return setEditForm(null);
    const selected: Option[] = (editing.audience_countries || "")
      .split(",")
      .map((s: string) => Number(s.trim()))
      .filter(Boolean)
      .map((id: number) => {
        const found = countries.find((c) => c.value === id);
        return found || { value: id, label: String(id) };
      });

    setEditForm({
      campaign_title: editing.campaign_title || "",
      campaign_start_date: editing.campaign_start_date
        ? new Date(editing.campaign_start_date).toISOString().slice(0, 16)
        : "",
      campaign_end_date: editing.campaign_end_date
        ? new Date(editing.campaign_end_date).toISOString().slice(0, 16)
        : "",
      campaign_budget: editing.campaign_budget ?? "",
      campaign_bidding: editing.campaign_bidding || "click",
      audience_countries: selected,
      audience_gender: editing.audience_gender || "all",
      audience_relationship: editing.audience_relationship || "all",
      ads_title: editing.ads_title || "",
      ads_description: editing.ads_description || "",
      ads_type: editing.ads_type || "url",
      ads_url: editing.ads_url || "",
      ads_placement: editing.ads_placement || "newsfeed",
      ads_image: editing.ads_image || "",
    });
  }, [editing, countries]);

  // ---- load countries
  useEffect(() => {
    (async () => {
      try {
        setLoadingCountries(true);
        const r = await getCountries(authHeaders);
        if (!r?.ok) throw new Error(r?.error || "Failed to load countries");
        setCountries(r.items || []);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load countries");
      } finally {
        setLoadingCountries(false);
      }
    })();
  }, [accessToken]);

  // ---- upload
  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const r = await uploadAdImage(f, uploadHeaders);
      if (r?.ok) {
        setForm((s: any) => ({ ...s, ads_image: r.path }));
        toast.success("Image uploaded successfully");
      } else toast.error(r?.error || "Upload failed");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---- validation
  const validate = (f: any) => {
    if (!f.campaign_title?.trim()) return "Campaign title is required";
    if (!f.campaign_start_date || !f.campaign_end_date)
      return "Start and End dates are required";
    const budget = Number(f.campaign_budget);
    if (!budget || isNaN(budget) || budget <= 0)
      return "Budget must be a positive number";
    if (f.ads_type === "url" && !f.ads_url?.trim())
      return "Target URL is required for URL ads";
    return null;
  };

  // ---- create
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate(form);
    if (error) return toast.error(error);

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        campaign_budget: Number(form.campaign_budget),
        campaign_start_date: new Date(form.campaign_start_date).toISOString(),
        campaign_end_date: new Date(form.campaign_end_date).toISOString(),
        audience_countries: (form.audience_countries as Option[])
          .map((c) => c.value)
          .join(","),
      };
      const r = await createCampaign(payload, authHeaders);
      if (!r?.ok) throw new Error(r?.error || "Failed to create campaign");
      toast.success("Campaign created successfully!");
      setForm((s: any) => ({
        ...s,
        campaign_title: "",
        campaign_start_date: "",
        campaign_end_date: "",
        campaign_budget: "",
        audience_countries: [],
        ads_title: "",
        ads_description: "",
        ads_url: "",
        ads_image: "",
      }));
      load(1);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- update
  const saveEdit = async () => {
    if (!editing || !editForm) return;
    const error = validate(editForm);
    if (error) return toast.error(error);
    setSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        campaign_budget: Number(editForm.campaign_budget),
        // editForm dates are from input[type=datetime-local]
        campaign_start_date: new Date(editForm.campaign_start_date).toISOString(),
        campaign_end_date: new Date(editForm.campaign_end_date).toISOString(),
        audience_countries: (editForm.audience_countries as Option[])
          .map((c) => c.value)
          .join(","),
      };
      const r = await updateCampaign(editing.campaign_id, payload, authHeaders);
      if (!r?.ok) throw new Error(r?.error || "Failed to update campaign");
      toast.success("Campaign updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update campaign");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- delete
  const onDelete = async (c: Campaign) => {
    const id = c.campaign_id;
    const confirm = window.confirm(`Delete campaign "${c.campaign_title}"?`);
    if (!confirm) return;
    try {
      const r = await deleteCampaign(id, authHeaders);
      if (!r?.ok) throw new Error(r?.error || "Failed to delete");
      toast.success("Campaign deleted");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  // ---- list loader
  async function load(p = page) {
    try {
      const r = await myCampaigns(p, 10, authHeaders);
      if (!r?.ok) throw new Error(r?.error || "Failed to load campaigns");
      setItems(r.items || []);
      setTotal(r.total || 0);
      setPage(r.page || 1);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load campaigns");
    }
  }

  useEffect(() => {
    if (!accessToken || authLoading) return;
    load(1);
  }, [authLoading, accessToken]);

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
            <Sidebar />
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            <header className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold">Ads Manager</h1>
              <p className="opacity-90">Manage Ads, Create new Campaign</p>
            </header>

            {/* New Campaign */}
            <section className="rounded-2xl border bg-white shadow p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">New Campaign</h2>

              <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left */}
                <div className="md:col-span-6 grid gap-4">
                  <div>
                    <label className="block text-sm font-medium">Campaign Title</label>
                    <input
                      className="w-full border rounded-lg p-2"
                      value={form.campaign_title}
                      onChange={(e) => setForm({ ...form, campaign_title: e.target.value })}
                      placeholder="Set a title for your campaign"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Start</label>
                      <input
                        type="datetime-local"
                        className="w-full border rounded-lg p-2"
                        value={form.campaign_start_date}
                        onChange={(e) =>
                          setForm({ ...form, campaign_start_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">End</label>
                      <input
                        type="datetime-local"
                        className="w-full border rounded-lg p-2"
                        value={form.campaign_end_date}
                        onChange={(e) =>
                          setForm({ ...form, campaign_end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Budget (₦)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded-lg p-2"
                      value={form.campaign_budget}
                      onChange={(e) =>
                        setForm({ ...form, campaign_budget: e.target.value })
                      }
                      placeholder="E.g., 10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Bidding</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={form.campaign_bidding}
                      onChange={(e) =>
                        setForm({ ...form, campaign_bidding: e.target.value })
                      }
                    >
                      <option value="click">Pay Per Click (₦50)</option>
                      <option value="view">Pay Per View (₦10)</option>
                    </select>
                  </div>

                  <div>
                    <div className="font-medium text-sm mb-1">Target Audience</div>
                    <label className="block text-xs text-gray-500 mb-1">Countries</label>
                    <Select
                      isMulti
                      options={countries}
                      isLoading={loadingCountries}
                      value={form.audience_countries}
                      onChange={(val) => setForm({ ...form, audience_countries: val || [] })}
                      classNamePrefix="select"
                      placeholder="Select countries..."
                    />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs text-gray-500">Gender</label>
                        <select
                          className="w-full border rounded-lg p-2"
                          value={form.audience_gender}
                          onChange={(e) =>
                            setForm({ ...form, audience_gender: e.target.value })
                          }
                        >
                          <option value="all">All</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Relationship</label>
                        <select
                          className="w-full border rounded-lg p-2"
                          value={form.audience_relationship}
                          onChange={(e) =>
                            setForm({ ...form, audience_relationship: e.target.value })
                          }
                        >
                          <option value="all">All</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="md:col-span-6 grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Ads Title</label>
                      <input
                        className="w-full border rounded-lg p-2"
                        value={form.ads_title}
                        onChange={(e) => setForm({ ...form, ads_title: e.target.value })}
                        placeholder="Set a title for your ads"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Placement</label>
                      <select
                        className="w-full border rounded-lg p-2"
                        value={form.ads_placement}
                        onChange={(e) => setForm({ ...form, ads_placement: e.target.value })}
                      >
                        <option value="newsfeed">Newsfeed</option>
                        <option value="sidebar">Sidebar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Ads Description (max 200)</label>
                    <textarea
                      maxLength={200}
                      rows={5}
                      className="w-full border rounded-lg p-2"
                      value={form.ads_description}
                      onChange={(e) =>
                        setForm({ ...form, ads_description: e.target.value })
                      }
                      placeholder="Set a description for your ads"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Advertise For</label>
                      <select
                        className="w-full border rounded-lg p-2"
                        value={form.ads_type}
                        onChange={(e) => setForm({ ...form, ads_type: e.target.value })}
                      >
                        <option value="url">URL</option>
                        <option value="post">Post</option>
                        <option value="page">Page</option>
                        <option value="group">Group</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Target URL</label>
                      <input
                        className="w-full border rounded-lg p-2"
                        value={form.ads_url}
                        onChange={(e) => setForm({ ...form, ads_url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Ads Image</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={pickFile} />
                      {uploading && <span className="text-sm">Uploading…</span>}
                    </div>
                    {form.ads_image && (
                      <img src={API_BASE_RAW+'/uploads/'+stripUploads(form.ads_image)} className="h-24 mt-2 rounded-lg" />
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      {submitting ? "Publishing…" : "Publish"}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* My Campaigns */}
            <section className="rounded-2xl border bg-white shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">My Campaigns</h2>
              </div>

              {/* Mobile cards */}
              <div className="grid md:hidden gap-3">
                {items.map((c) => (
                  <div key={c.campaign_id} className="rounded-xl border p-4">
                    <div className="font-semibold">{c.campaign_title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(c.campaign_start_date).toLocaleDateString()} –{" "}
                      {new Date(c.campaign_end_date).toLocaleDateString()}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>Budget: ₦{c.campaign_budget.toFixed(2)}</div>
                      <div>Spend: ₦{c.campaign_spend.toFixed(2)}</div>
                      <div>Bidding: {c.campaign_bidding === "click" ? "Click" : "View"}</div>
                      <div>Clicks/Views: {c.campaign_clicks} / {c.campaign_views}</div>
                    </div>
                    <div className="mt-2">
                      {c.campaign_is_active === "1" ? (
                        <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">
                          Not Active
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.campaign_is_active === "1" ? (
                        <button
                          onClick={async () => {
                            const r = await setActive(c.campaign_id, false, authHeaders);
                            if (r?.ok) { toast.success("Campaign paused"); load(); }
                            else toast.error(r?.error || "Failed to pause");
                          }}
                          className="text-xs rounded-md border px-3 py-1"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const r = await setActive(c.campaign_id, true, authHeaders);
                            if (r?.ok) { toast.success("Campaign resumed"); load(); }
                            else toast.error(r?.error || "Failed to resume");
                          }}
                          className="text-xs rounded-md border px-3 py-1"
                        >
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => setEditing(c)}
                        className="text-xs rounded-md border px-3 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="text-xs rounded-md border px-3 py-1 text-red-600 border-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!items.length && (
                  <div className="text-center text-gray-500 py-6">No campaigns yet.</div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="[&>th]:text-left [&>th]:py-2">
                      <th>Title</th>
                      <th>Start - End</th>
                      <th>Budget</th>
                      <th>Spend</th>
                      <th>Bidding</th>
                      <th>Clicks/Views</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.campaign_id} className="[&>td]:py-2 border-t">
                        <td>{c.campaign_title}</td>
                        <td>
                          {new Date(c.campaign_start_date).toLocaleDateString()} -{" "}
                          {new Date(c.campaign_end_date).toLocaleDateString()}
                        </td>
                        <td>₦{c.campaign_budget.toFixed(2)}</td>
                        <td>₦{c.campaign_spend.toFixed(2)}</td>
                        <td>{c.campaign_bidding === "click" ? "🖱 Click" : "👁 View"}</td>
                        <td>{c.campaign_clicks} / {c.campaign_views}</td>
                        <td>
                          {c.campaign_is_active === "1" ? (
                            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
                              Not Active
                            </span>
                          )}
                        </td>
                        <td>{new Date(c.campaign_created_date).toLocaleDateString()}</td>
                        <td className="space-x-2">
                          {c.campaign_is_active === "1" ? (
                            <button
                              onClick={async () => {
                                const r = await setActive(c.campaign_id, false, authHeaders);
                                if (r?.ok) { toast.success("Campaign paused"); load(); }
                                else toast.error(r?.error || "Failed to pause");
                              }}
                              className="text-xs rounded-md border px-2 py-1"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                const r = await setActive(c.campaign_id, true, authHeaders);
                                if (r?.ok) { toast.success("Campaign resumed"); load(); }
                                else toast.error(r?.error || "Failed to resume");
                              }}
                              className="text-xs rounded-md border px-2 py-1"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => setEditing(c)}
                            className="text-xs rounded-md border px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(c)}
                            className="text-xs rounded-md border px-2 py-1 text-red-600 border-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-500">
                          No campaigns yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                  className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm">Page {page} / {totalPages}</div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1)}
                  className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* ======= Edit Modal ======= */}
      {editing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white w-[95%] max-w-3xl rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Campaign</h3>
              <button onClick={() => setEditing(null)} className="text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Campaign Title</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={editForm.campaign_title}
                  onChange={(e) => setEditForm({ ...editForm, campaign_title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Budget (₦)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded-lg p-2"
                  value={editForm.campaign_budget}
                  onChange={(e) => setEditForm({ ...editForm, campaign_budget: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Start</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2"
                  value={editForm.campaign_start_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, campaign_start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2"
                  value={editForm.campaign_end_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, campaign_end_date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Bidding</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={editForm.campaign_bidding}
                  onChange={(e) =>
                    setEditForm({ ...editForm, campaign_bidding: e.target.value })
                  }
                >
                  <option value="click">Pay Per Click (₦50)</option>
                  <option value="view">Pay Per View (₦10)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Placement</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={editForm.ads_placement}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ads_placement: e.target.value })
                  }
                >
                  <option value="newsfeed">Newsfeed</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Ads Title</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={editForm.ads_title}
                  onChange={(e) => setEditForm({ ...editForm, ads_title: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Ads Description (max 200)</label>
                <textarea
                  maxLength={200}
                  rows={4}
                  className="w-full border rounded-lg p-2"
                  value={editForm.ads_description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ads_description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Advertise For</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={editForm.ads_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ads_type: e.target.value })
                  }
                >
                  <option value="url">URL</option>
                  <option value="post">Post</option>
                  <option value="page">Page</option>
                  <option value="group">Group</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Target URL</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={editForm.ads_url}
                  onChange={(e) => setEditForm({ ...editForm, ads_url: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Countries</label>
                <Select
                  isMulti
                  options={countries}
                  value={editForm.audience_countries}
                  onChange={(val) => setEditForm({ ...editForm, audience_countries: val || [] })}
                  classNamePrefix="select"
                  placeholder="Select countries..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Gender</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={editForm.audience_gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, audience_gender: e.target.value })
                  }
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Relationship</label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={editForm.audience_relationship}
                  onChange={(e) =>
                    setEditForm({ ...editForm, audience_relationship: e.target.value })
                  }
                >
                  <option value="all">All</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


