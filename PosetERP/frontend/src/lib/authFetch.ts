export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const options: RequestInit = {
    ...init,
    headers,
  };

  try {
    const response = await fetch(input, options);

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
}
