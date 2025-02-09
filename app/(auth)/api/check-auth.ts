import {jwtDecode} from "jwt-decode"; // Ensure proper import
import { setLogoutTimeout } from "./auth"; // Import the new function

export const logout = () => {
  // Remove the token from local storage
  localStorage.removeItem("token");
  // Redirect to the login page
  window.location.href = "/";
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token); // Specify 'any' type for flexibility

    // Check if token expiration exists and if the token is expired
    const currentTime = Date.now() / 1000;
    if (!decoded.exp || decoded.exp < currentTime) {
      logout(); // Log out if the token is expired
      return null;
    }

    return decoded;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
};

// Call setLogoutTimeout after login or registration
export const loginUser = (token: string) => {
  // Properly type the token parameter
  localStorage.setItem("token", token);
  setLogoutTimeout(); // Set the timeout for automatic logout
};
