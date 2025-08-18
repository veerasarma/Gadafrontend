// src/pages/RepresentativePage.tsx
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

/* ------------------------------ Validation ------------------------------ */

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9._-]+$/i, 'Only letters, numbers, dot, underscore, dash'),
  phone: z
    .string()
    .min(7, 'Phone is required')
    .max(20)
    .regex(/^[+0-9 ()-]+$/, 'Invalid phone number'),
  email: z.string().email('Invalid email'),
  state: z.string().min(2, 'State is required'),
  residentAddress: z.string().min(5, 'Address is required'),
  residentialState: z.string().min(2, 'Residential state is required'),
  proposedLocation: z.string().min(2, 'Proposed location is required'),
  gadaChatUsername: z
    .string()
    .min(3, 'Gada.chat username is required')
    .regex(/^[a-z0-9._-]+$/i, 'Only letters, numbers, dot, underscore, dash'),
  note: z.string().min(10, 'Please add a short note').max(600, 'Max 600 chars'),
});
type RepForm = z.infer<typeof schema>;

type RepRecord = RepForm & {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
};

export default function RepresentativePage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<RepRecord | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  // guard to avoid duplicate calls within the same token session
  const hasLoadedRef = useRef(false);

  const form = useForm<RepForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      username: '',
      phone: '',
      email: '',
      state: '',
      residentAddress: '',
      residentialState: '',
      proposedLocation: '',
      gadaChatUsername: '',
      note: '',
    },
    mode: 'onBlur',
  });

  /* Reset the one-shot guard whenever the token changes (e.g., re-login) */
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [accessToken]);

  /* ---------------------------- Load if exists ---------------------------- */
  useEffect(() => {
    // wait until we actually have a token
    if (!accessToken) return;
    // already loaded once for this token
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/representatives/me`, {
          headers,
          credentials: 'include',
          signal: ac.signal,
        });

        if (res.status === 404) {
          setExisting(null);
          setIsEditing(true);
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to load application');
        }

        const data: RepRecord = await res.json();

        setExisting(data);
        // hydrate form with existing values
        form.reset({
          name: data.name,
          username: data.username,
          phone: data.phone,
          email: data.email,
          state: data.state,
          residentAddress: data.residentAddress,
          residentialState: data.residentialState,
          proposedLocation: data.proposedLocation,
          gadaChatUsername: data.gadaChatUsername,
          note: data.note,
        });
        setIsEditing(false); // lock inputs until user clicks Edit
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error(err);
        toast.error('Could not load representative application.');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
    // Intentional: depend only on token; `headers` identity can change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const onSubmit = async (values: RepForm) => {
    try {
      setSubmitting(true);
      const isUpdate = !!existing;
      const url = isUpdate
        ? `${API_BASE_URL}/api/representatives/me`
        : `${API_BASE_URL}/api/representatives`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to save application');
      }

      const saved: RepRecord = await res.json();
      setExisting(saved);
      setIsEditing(false);
      toast.success(isUpdate ? 'Your changes have been saved' : 'We’ll review and get back to you shortly');
    } catch (err: any) {
      toast.error(err?.message ?? 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = existing?.status ? (
    <Badge
      variant={
        existing.status === 'approved'
          ? 'default'
          : existing.status === 'rejected'
          ? 'destructive'
          : 'secondary'
      }
      className="capitalize"
    >
      {existing.status}
    </Badge>
  ) : null;

  const disableInputs = loading || submitting || (!isEditing && !!existing);

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          {/* Left app sidebar */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>

          {/* Center (wider) */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto">
              <div className="rounded-xl shadow-sm border bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7C3AED] via-[#5B6CFA] to-[#1D4ED8] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-white text-2xl font-bold">
                        Become a Representative
                      </h1>
                      <p className="text-white/90">
                        Share a few details and the team will reach out if it’s a fit.
                      </p>
                    </div>

                    {/* Status + Edit */}
                    <div className="flex items-center gap-3">
                      {statusBadge}
                      {!!existing && (
                        <Button
                          type="button"
                          variant={isEditing ? 'secondary' : 'outline'}
                          onClick={() => setIsEditing((v) => !v)}
                          disabled={loading || submitting}
                          className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone number</FormLabel>
                              <FormControl>
                                <Input placeholder="+234..." {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Lagos" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="residentialState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Residential state</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Lagos" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="residentAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resident address</FormLabel>
                            <FormControl>
                              <Input placeholder="Street, city, state" {...field} disabled={disableInputs} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="proposedLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proposed location to represent</FormLabel>
                              <FormControl>
                                <Input placeholder="City / area" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gadaChatUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gada.chat username</FormLabel>
                              <FormControl>
                                <Input placeholder="@yourhandle" {...field} disabled={disableInputs} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Little note about yourself</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us briefly about yourself, experience, and why you’d like to represent."
                                className="min-h-[120px] resize-y"
                                {...field}
                                disabled={disableInputs}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-3">
                        {!!existing && isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (existing) {
                                form.reset({
                                  name: existing.name,
                                  username: existing.username,
                                  phone: existing.phone,
                                  email: existing.email,
                                  state: existing.state,
                                  residentAddress: existing.residentAddress,
                                  residentialState: existing.residentialState,
                                  proposedLocation: existing.proposedLocation,
                                  gadaChatUsername: existing.gadaChatUsername,
                                  note: existing.note,
                                });
                              }
                              setIsEditing(false);
                            }}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={submitting || (!isEditing && !!existing)}
                          className="bg-[#1877F2] hover:bg-[#166FE5]"
                        >
                          {submitting
                            ? 'Saving…'
                            : existing
                            ? isEditing
                              ? 'Save Changes'
                              : 'Locked'
                            : 'Submit application'}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  {!!existing && (
                    <p className="mt-4 text-xs text-gray-500">
                      Last updated: {existing.updatedAt ? new Date(existing.updatedAt).toLocaleString() : '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
