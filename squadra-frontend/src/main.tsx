import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as UrqlProvider } from "urql";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { gqlClient } from "./lib/urql";
import { App } from "./App";
import "./styles/global.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UrqlProvider value={gqlClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </UrqlProvider>
  </React.StrictMode>,
);
