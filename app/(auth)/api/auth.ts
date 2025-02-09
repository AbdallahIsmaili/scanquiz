import axios from "axios";
import {jwtDecode} from "jwt-decode"; // Ensure proper import

const userApi = axios.create({
  baseURL: "http://localhost:3001",
});

export const logout = () => {
  // Remove the token from local storage
  localStorage.removeItem("token");
  // Redirect to the login page
  window.location.href = "/";
};

export const setLogoutTimeout = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const decoded: any = jwtDecode(token); // Specify 'any' type for flexibility
    if (!decoded.exp) {
      throw new Error("Token expiration is undefined");
    }
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    const timeLeft = expirationTime - currentTime;

    if (timeLeft > 0) {
      setTimeout(() => {
        logout();
      }, timeLeft);
    } else {
      logout();
    }
  } catch (err) {
    console.error("Error decoding token:", err);
    logout();
  }
};

export const registerUser = async (userDetails: Record<string, any>) => {
  try {
    const response = await userApi.post("/register", userDetails);
    const token = response.data.token;
    localStorage.setItem("token", token);
    setLogoutTimeout();
  } catch (err) {
    console.error("Registration error:", err);
  }
};

export default userApi;
