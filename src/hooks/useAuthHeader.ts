

export function useAuthHeaderupload(accessToken): Record<string, string> {
  return accessToken
    ? { Authorization: `Bearer ${accessToken}`}
    : { 'Content-Type': 'application/json',};
}

export function useAuthHeader(accessToken): Record<string, string> {
    return accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', }
      : { 'Content-Type': 'application/json',};
  }