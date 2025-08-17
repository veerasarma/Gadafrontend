// src/services/userServices.ts

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

//
// Types
//

/** Generic shape for API error payload */
interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

/** Wraps a successful API response */
export interface ApiResponse<T> {
  data: T;
  [key: string]: any;
}

/** Credentials for sign‑in */
export interface SignInCredentials {
  email: string;
  password: string;
}
export interface Activationdetails {
  token: string;
}

/** Data for sign‑up */
export interface SignUpData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
}

/** Shape of the auth response (adjust fields to your API) */
export interface AuthPayload {
  token: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    profileImage?: string;
    coverImage?: string;
    bio?: string;
    friends?: any[];
    createdAt?: string;
    [key: string]: any;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
  createdAt: string;
}

//
// Helpers
//

/** Handle fetch response, throwing on HTTP errors */
async function handleResponse<T>(response: Response): Promise<T> {
  const payload: T | ErrorResponse = await response.json();
  if (!response.ok) {
    const errMsg =
      (payload as ErrorResponse).message ?? 'Something went wrong';
    throw new Error(errMsg);
  }
  return payload as T;
}



//
// API Methods
//

/**
 * Sign in an existing user.
 * @param credentials { email, password }
 * @returns AuthPayload
 */
export async function signInUser(
  credentials: SignInCredentials,headers
): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/api/signin`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthPayload>(response);
}

export async function requestPasswordReset(data: { email: string; otp: string }) {
  const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function resendforgototp(data: { email: string }) {
  const response = await fetch(`${API_BASE_URL}/api/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function sendForgot(data: { email: string }) {
  const response = await fetch(`${API_BASE_URL}/api/sendForgotOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function updatePassword(data: {
  email: string;
  otp: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ status: boolean; message: string }>(response);
}

export async function activateaccount(
  credentials: Activationdetails,headers: Record<string,string>
): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/api/activation`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthPayload>(response);
}

/**
 * Register a new user.
 * @param inputData { firstname, lastname, username, email, password }
 * @returns AuthPayload
 */
export async function signUpUser(
  inputData: SignUpData,headers: Record<string,string>
): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/api/signUp`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(inputData),
  });

  return handleResponse<AuthPayload>(response);
}


export async function uploadAvatar(userHash: string, file: File, headers: Record<string,string>,type:string): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);
  if(type=='cover')
  {
    const res = await fetch(`${API_BASE_URL}/api/users/${userHash}/cover`, {
      method: 'PUT',
      credentials: 'include',
      headers: headers,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    const { avatarUrl } = await res.json();
    return avatarUrl;
  }
  else
  {
    const res = await fetch(`${API_BASE_URL}/api/users/${userHash}/avatar`, {
      method: 'PUT',
      credentials: 'include',
      headers: headers,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    const { avatarUrl } = await res.json();
    return avatarUrl;
  }
}


export async function fetchUserProfile(id: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch user profile');
    }
    return res.json();
  }
