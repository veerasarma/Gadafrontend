// src/pages/RepresentativePage.tsx
import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

// Validation
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

export default function RepresentativePage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

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
  });

  const onSubmit = async (values: RepForm) => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/representatives`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to submit application');
      }
      toast({
        title: 'Application submitted',
        description: 'We’ll review and get back to you shortly.',
      });
      form.reset();
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            {/* widened wrapper */}
            <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto">
              <div className="rounded-xl shadow-sm border bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7C3AED] via-[#5B6CFA] to-[#1D4ED8] p-6">
                  <h1 className="text-white text-2xl font-bold">
                    Become a Representative
                  </h1>
                  <p className="text-white/90">
                    Share a few details and the team will reach out if it’s a fit.
                  </p>
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
                                <Input placeholder="Full name" {...field} />
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
                                <Input placeholder="username" {...field} />
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
                                <Input placeholder="+234..." {...field} />
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
                                <Input type="email" placeholder="you@example.com" {...field} />
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
                                <Input placeholder="e.g., Lagos" {...field} />
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
                                <Input placeholder="e.g., Lagos" {...field} />
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
                              <Input placeholder="Street, city, state" {...field} />
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
                                <Input placeholder="City / area" {...field} />
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
                                <Input placeholder="@yourhandle" {...field} />
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-[#1877F2] hover:bg-[#166FE5]"
                        >
                          {submitting ? 'Submitting…' : 'Submit application'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
