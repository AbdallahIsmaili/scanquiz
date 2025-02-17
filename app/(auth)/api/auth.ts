import axios from "axios";
import {jwtDecode} from "jwt-decode"; 

const userApi = axios.create({
  baseURL: "http://localhost:3001",
});

export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
};

export const setLogoutTimeout = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const decoded: any = jwtDecode(token); 
    if (!decoded.exp) {
      throw new Error("Token expiration is undefined");
    }
    const expirationTime = decoded.exp * 1000;
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
