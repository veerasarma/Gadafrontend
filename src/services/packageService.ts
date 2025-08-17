const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error((data && (data.error || data.message)) || "Request failed");
  return data as T;
}

export async function fetchPackages(headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/packages`, {
    headers,
    credentials: "include",
  });
  return handle<{ data: any[] }>(res); // Now TS knows 'data' exists
}

export async function buyPackage(
  token: string,
  package_id: string | number,
  package_name: string,
  package_price: number
) {
  const res = await fetch(`${API_BASE_URL}/api/packages/buypackage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ package_id, package_name, package_price }),
  });
  return handle<any>(res);
}

//   export async function fetchPackages(headers: Record<string, string> = {}) {
//     const res = await fetch(`${API_BASE_URL}/api/packages`, {
//       headers,
//       credentials: "include",
//     });
//     return handle<any>(res);
// }

// export async function buyPackage(
//   packageId: string | number,
//   packageName: string,
//   packagePrice: number,
//   headers: Record<string, string> = {}
// ) {
//   const res = await fetch(`${API_BASE_URL}/api/packages/buypackage`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...headers,
//     },
//     credentials: "include", // sends cookies/session
//     body: JSON.stringify({
//       package_id: packageId,
//       package_name: packageName,
//       package_price: packagePrice,
//     }),
//   });
//   return handle<any>(res);
// }
