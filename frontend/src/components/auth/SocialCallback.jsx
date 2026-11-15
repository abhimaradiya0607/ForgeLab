import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertCircle } from "lucide-react";

// Clerk's useAuth and our own useAuth have the same name, so we rename Clerk's
import { useAuth as useClerkAuth } from "@clerk/react";
import { useAuth } from "../../authContext";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SocialCallback() {

    const navigate = useNavigate();

    // From Clerk: is the user signed in to Clerk, and a way to get Clerk's token
    const { isLoaded, isSignedIn, getToken } = useClerkAuth();

    // From our own app
    const { setCurrentUser } = useAuth();

    const [error, setError] = useState("");

    // React StrictMode runs effects twice in development.
    // This flag makes sure we only call the backend once.
    const hasRun = useRef(false);


    useEffect(() => {

        // Wait until Clerk has finished loading
        if (!isLoaded) {
            return;
        }

        if (!isSignedIn) {
            navigate("/auth");      // back to the original
            return;
        }

        if (hasRun.current) {
            return;
        }
        hasRun.current = true;

        const exchangeToken = async () => {
            try {
                // 1. Get Clerk's short-lived session token
                const clerkToken = await getToken();

                // 2. Send it to our backend. The backend verifies it with Clerk
                //    and replies with OUR token, exactly like the normal login.
                const response = await axios.post(
                    `${API_URL}/auth/clerk`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${clerkToken}` },
                        timeout: 10000
                    }
                );

                // 3. From here on, it is the same as an email/password login
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userId", response.data.userId);

                setCurrentUser(response.data.userId);
                navigate("/");

            } catch (err) {
                if (err.response) {
                    setError(err.response.data?.message || "Social login failed. Please try again.");
                } else if (err.code === "ECONNABORTED") {
                    setError("The request took too long. Please try again.");
                } else {
                    setError("Cannot reach the server. Check your connection and try again.");
                }
            }
        };

        exchangeToken();

    }, [isLoaded, isSignedIn, getToken, navigate, setCurrentUser]);


    return (
        <div className="flex min-h-screen flex-col bg-[#10110F] text-[#E9E6DC]">
            <div className="m-auto w-full max-w-sm px-5 py-10 text-center">

                <p className="font-heading text-lg tracking-tight">ForgeLab</p>
                <p className="mt-3 font-mono text-[11px] tracking-[0.22em] text-[#A7A398]">
                    FORGELAB / AUTHENTICATION
                </p>

                {error ? (
                    <>
                        <div
                            role="alert"
                            className="mt-8 flex items-start gap-2 bg-[#20231D] p-3 text-left text-sm text-[#F07845]"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>

                        <Link
                            to="/auth"
                            className="mt-6 inline-block text-sm font-medium text-[#C5F36A] hover:text-[#d4f58a]"
                        >
                            Back to login
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="relative mx-auto mt-10 h-28 w-28" aria-hidden="true">
                            <div className="absolute left-1 top-2 h-20 w-20 bg-[#C5F36A]">
                                <span className="absolute bottom-0.5 left-2.5 font-heading text-5xl leading-none text-[#10110F]">
                                    F
                                </span>
                            </div>
                            <div className="forgelab-mark-shift absolute bottom-3 right-1 h-2.5 w-10 bg-[#F07845]" />
                        </div>

                        <h1 className="mt-8 font-heading text-3xl tracking-tight">
                            Preparing your workspace
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-[#A7A398]">
                            Securing your session and connecting your account.
                        </p>

                        <div className="mx-auto mt-8 h-px w-40 overflow-hidden bg-[rgba(233,230,220,0.12)]">
                            <span className="forgelab-progress block h-px w-10 bg-[#C5F36A]" />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
