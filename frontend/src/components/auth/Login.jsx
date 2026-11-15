import { sileo } from 'sileo';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Users,
    Loader2,
    AlertCircle
} from "lucide-react";

import { useAuth } from "../../authContext";
import axios from "axios";
import { useClerk } from "@clerk/react";

export default function Login() {

    const { setCurrentUser } = useAuth();
    const navigate = useNavigate();
    const clerk = useClerk(); 

    // Input states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Error states
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [serverError, setServerError] = useState("");

    // Other states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSocialLogin = () => {
      const callbackUrl = `${window.location.origin}/social-callback`;

      clerk.redirectToSignIn({
          signInForceRedirectUrl: callbackUrl,
          signUpForceRedirectUrl: callbackUrl
      });
  };


    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();
    
        // Clear previous errors
        setEmailError("");
        setPasswordError("");
        setServerError("");
    
        // Check email
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setEmailError("Enter a valid email address.");
            sileo.warning({
                title: "Invalid email",
                description: "Enter a valid email address.",
            });
            return;
        }
    
        // Check password
        if (password.length === 0) {
            setPasswordError("Enter your password.");
            sileo.warning({
                title: "Password missing",
                description: "Enter your password to continue.",
            });
            return;
        }
    
        try {
            setLoading(true);
    
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/login`,
                { email: email.trim().toLowerCase(), password },
                { timeout: 10000 }
            );
    
            // Save login details
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("userId", res.data.userId);
            localStorage.setItem("isAdmin", res.data.isAdmin);
    
            setCurrentUser(res.data.userId);
    
            sileo.success({
                title: "Welcome back",
                description: "You are now logged in.",
            });
    
            navigate("/");
        } catch (error) {
            let message = "Cannot reach the server. Check your connection and try again.";
    
            if (error.response) {
                message = error.response.data?.message || "Login failed. Please try again.";
            } else if (error.code === "ECONNABORTED") {
                message = "The request took too long. Please try again.";
            }
    
            setServerError(message);
            sileo.error({
                title: "Login failed",
                description: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const fieldClass = (hasError) =>
        `h-11 w-full bg-[#20231D] pl-10 pr-10 text-base text-[#E9E6DC] placeholder:text-[#77786E] outline-none transition-colors focus:bg-[#191B17] sm:h-10 sm:text-sm ${
            hasError ? "ring-1 ring-[#F07845]" : "focus:ring-1 focus:ring-[#C5F36A]"
        }`;

    return (
        <div className="min-h-screen bg-[#10110F] text-[#E9E6DC] lg:grid lg:grid-cols-2">

            {/* Editorial panel. Hidden on small screens so the form can stay centered. */}
            <section className="hidden min-h-screen flex-col justify-between px-12 py-10 lg:flex xl:px-16">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center bg-[#C5F36A] font-heading text-sm text-[#10110F]">
                        F
                    </span>
                    <span className="font-heading text-lg tracking-tight">ForgeLab</span>
                </div>

                <div>
                    <p className="flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-[#A7A398]">
                        <span className="h-px w-7 bg-[#C5F36A]" />
                        FORGELAB / COMMUNITY WORKSPACE / 2026
                    </p>
                    <h1 className="mt-5 max-w-md font-heading text-5xl leading-[0.88] tracking-[-0.035em] xl:text-6xl">
                        YOUR NEXT IDEA STARTS HERE.
                    </h1>
                    <p className="mt-5 max-w-sm text-[15px] leading-6 text-[#A7A398]">
                        Build a repository, explore what the community is making, and share the work when it is ready.
                    </p>

                    <div className="relative mt-12 h-56 max-w-sm" aria-hidden="true">
                        <div className="absolute left-0 top-8 h-px w-full bg-[rgba(233,230,220,0.12)]" />
                        <div className="absolute bottom-8 left-0 h-px w-2/3 bg-[rgba(233,230,220,0.12)]" />
                        <div className="absolute left-6 top-0 h-full w-px bg-[rgba(233,230,220,0.12)]" />
                        <div className="absolute left-6 top-12 h-36 w-36 bg-[#C5F36A]">
                            <span className="absolute bottom-1 left-3 font-heading text-7xl leading-none text-[#10110F]">
                                F
                            </span>
                        </div>
                        <div className="absolute left-32 top-40 h-3 w-16 bg-[#F07845]" />
                        <p className="absolute bottom-0 left-6 font-mono text-[11px] tracking-[0.16em] text-[#77786E]">
                            01 / MARK
                        </p>
                    </div>
                </div>

                <p className="font-mono text-[11px] tracking-[0.16em] text-[#77786E]">
                    WORKSHOP / SIGN IN
                </p>
            </section>

            <section className="flex min-h-screen flex-col">
                <div className="m-auto w-full max-w-sm px-5 py-10">

                    <p className="font-heading text-lg tracking-tight lg:hidden">ForgeLab</p>

                    <h2 className="mt-8 font-heading text-3xl tracking-tight lg:mt-0">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#A7A398]">
                        Log in to continue to your workspace.
                    </p>

                    {/* Social login */}
                    <button
                        type="button"
                        onClick={handleSocialLogin}
                        className="mt-8 flex h-11 w-full items-center justify-center gap-2.5 border border-[rgba(233,230,220,0.12)] text-sm text-[#E9E6DC] transition-colors hover:bg-[#20231D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5F36A] sm:h-10"
                    >
                        <Users className="h-4 w-4" />
                        Continue with a social account
                    </button>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-[#77786E]">
                        <span className="h-px flex-1 bg-[rgba(233,230,220,0.12)]" />
                        OR LOG IN WITH EMAIL
                        <span className="h-px flex-1 bg-[rgba(233,230,220,0.12)]" />
                    </div>

                    <form
                        onSubmit={handleLogin}
                        className="space-y-4"
                        noValidate
                    >

                        {/* Server error */}
                        {serverError && (
                            <div
                                role="alert"
                                className="flex items-start gap-2 bg-[#20231D] p-3 text-sm text-[#F07845]"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                {serverError}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="font-mono text-[11px] tracking-[0.16em] text-[#A7A398]"
                            >
                                EMAIL
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77786E]" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    aria-invalid={Boolean(emailError)}
                                    className={fieldClass(Boolean(emailError))}
                                />
                            </div>
                            {emailError && (
                                <p className="text-xs text-[#F07845]">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="font-mono text-[11px] tracking-[0.16em] text-[#A7A398]"
                            >
                                PASSWORD
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77786E]" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={Boolean(passwordError)}
                                    className={fieldClass(Boolean(passwordError))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#77786E] transition-colors hover:text-[#E9E6DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5F36A]"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-xs text-[#F07845]">
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center gap-2 bg-[#C5F36A] text-sm font-medium text-[#10110F] transition-colors hover:bg-[#d4f58a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5F36A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10110F] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10"
                        >
                            {loading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {loading ? "Logging in..." : "Log in"}
                        </button>

                    </form>

                    {/* Signup link */}
                    <p className="mt-8 text-sm text-[#A7A398]">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-[#C5F36A] hover:text-[#d4f58a]"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}
