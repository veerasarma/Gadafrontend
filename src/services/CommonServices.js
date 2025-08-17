const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
export const fetchGlobalData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/init`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization headers if required
          // 'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // for cookies/session-based auth
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };