import axios from "axios";

const userApi = axios.create({
  baseURL: "http://localhost:3001",
});

// userApi.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default userApi;
