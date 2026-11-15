import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ClerkProvider } from "@clerk/react";
import { AuthProvider } from "./authContext.jsx";
import ProjectRoutes from "./Routes.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sileo';

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/auth"
        >
            <Toaster position="top-right"
      theme="dark"
      options={{
        fill: '#18181b',
        roundness: 12,
        styles: {
          title: 'text-zinc-100!',
          description: 'text-zinc-400!',
        },
      }} />
            <AuthProvider>
                <BrowserRouter>
                    <ProjectRoutes />
                </BrowserRouter>
            </AuthProvider>
        </ClerkProvider>
    </StrictMode>
);