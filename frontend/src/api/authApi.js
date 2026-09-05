import { apiRequest } from "./client.js";

export const authApi = {
  login: (email, password) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  logout: () =>
    apiRequest("/api/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    apiRequest("/api/auth/me", {
      method: "GET",
    }),
};

export default authApi;
