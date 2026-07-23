import { Client, cacheExchange, fetchExchange, mapExchange } from "urql";
import { auth } from "./auth";

const url = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql";

/** Cliente urql con Authorization Bearer y logout automático en 401. */
export const gqlClient = new Client({
  url,
  exchanges: [
    cacheExchange,
    mapExchange({
      onResult(result) {
        const unauth = result.error?.graphQLErrors?.some(
          (e) => e.extensions?.code === "UNAUTHENTICATED",
        );
        if (unauth) {
          auth.clear();
          window.location.href = "/login";
        }
        return result;
      },
    }),
    fetchExchange,
  ],
  fetchOptions: () => {
    const token = auth.getAccess();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return { headers };
  },
});
