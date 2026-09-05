import { apiRequest } from "./client.js";

export const auditApi = {
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/audit-logs${query ? `?${query}` : ""}`);
  },
};

export default auditApi;
