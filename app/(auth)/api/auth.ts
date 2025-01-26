import axios from "axios";

const userApi = axios.create({
  baseURL: "http://localhost:3001",
});

export const logout = () => {
  // Remove the token from local storage
  localStorage.removeItem("token");
  // Redirect to the login page
  window.location.href = "/";
};


export default userApi;
