import {jwtDecode} from "jwt-decode"; 
import { setLogoutTimeout } from "./auth"; 

export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token); 

    const currentTime = Date.now() / 1000;
    if (!decoded.exp || decoded.exp < currentTime) {
      logout(); 
      return null;
    }

    return decoded;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
};

export const loginUser = (token: string) => {
  localStorage.setItem("token", token);
  setLogoutTimeout(); 
};
