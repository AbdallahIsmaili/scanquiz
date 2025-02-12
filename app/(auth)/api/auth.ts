import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-hot-toast";

const userApi = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true, // ✅ Ensures cookies are sent
});

// Function to log out the user
export const logout = async (): Promise<void> => {
  try {
    await userApi.post("/logout");
    toast.success("Logged out successfully");
    window.location.href = "/"; // Redirect after successful logout
  } catch (error) {
    toast.error("Logout failed");
    console.error("Logout error:", error);
  }
};


export const isAuthenticated = async () => {
  try {
    console.log("hello");
    const res = await fetch("http://localhost:3001/check-auth", {
      credentials: "include", // ✅ Sends cookies
    });

    if (!res.ok) {
      console.error("Authentication failed: Response not OK");
      return null;
    }

    const data = await res.json();
    console.log("Auth Response:", data); // ✅ Debugging
    return data.user || null; // ✅ Ensure user is returned
  } catch (err) {
    console.error("Error checking authentication:", err);
    return null;
  }
};


// Function to log in the user
export const loginUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const res = await userApi.post("/login", { email, password });

    if (res.status === 200) {
      toast.success("Login successful");
      window.location.href = "/";
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    toast.error("Invalid credentials");
    console.error("Login error:", error);
  }
};

// Function to register a new user
export const registerUser = async (userDetails: {
  email: string;
  password: string;
  fullName: string;
}): Promise<void> => {
  try {
    const res = await userApi.post("/register", userDetails);

    if (res.status === 200) {
      toast.success("Registration successful");
      window.location.href = "/";
    } else {
      throw new Error("Registration failed");
    }
  } catch (error) {
    toast.error("Registration error");
    console.error("Registration error:", error);
  }
};

export default userApi;
