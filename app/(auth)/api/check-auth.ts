import { jwtDecode } from "jwt-decode";

// Function to get a cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

// Function to log out
export const logout = (): void => {
  document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  window.location.href = "/";
};

// Function to check if the user is authenticated (client-side only)
export const isAuthenticated = (): any | null => {
  const token = getCookie("token");
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp || decoded.exp < Date.now() / 1000) {
      logout(); // Logout if token is expired
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Function to store token in cookies
export const setToken = (token: string): void => {
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
};
