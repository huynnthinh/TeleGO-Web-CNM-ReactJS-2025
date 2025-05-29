import api from "../config";

export const login = (credentials) => {
  return api.post("/auth/login", credentials);
};
