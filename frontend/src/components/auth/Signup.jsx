import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Users,
    Loader2,
    AlertCircle
} from "lucide-react";

import { useAuth } from "../../authContext";
import { useClerk } from "@clerk/react";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


export default function Signup() {

    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();
    const clerk = useClerk(); 


    // Input states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    // Error states
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [serverError, setServerError] = useState("");


    // Other states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);


    // Password strength
    const [passwordStrength, setPasswordStrength] = useState(0);


    // Check password strength
    const checkPasswordStrength = (value) => {
        let score = 0;
        if (value.length >= 8) {
            score++;
        }
        if (/[A-Z]/.test(value) && /[a-z]/.test(value)) {
            score++;
        }
        if (/[0-9]/.test(value)) {
            score++;
        }
        if (/[^A-Za-z0-9]/.test(value)) {
            score++;
        }
        setPasswordStrength(score);
    };
    // Password strength labels
    let strengthText = "Too short";
    if (passwordStrength === 1) {
        strengthText = "Weak";
    } else if (passwordStrength === 2) {
        strengthText = "Fair";
    } else if (passwordStrength === 3) {
        strengthText = "Good";
    } else if (passwordStrength === 4) {
        strengthText = "Strong";
    }

    // Password strength colors. Score and labels stay the same; only the paint changes.
    let strengthColor = "bg-[rgba(233,230,220,0.2)]";
    if (passwordStrength === 1) {
        strengthColor = "bg-[#F07845]";
    } else if (passwordStrength === 2) {
        strengthColor = "bg-[#C5F36A]/50";
    } else if (passwordStrength === 3) {
        strengthColor = "bg-[#C5F36A]/75";
    } else if (passwordStrength === 4) {
        strengthColor = "bg-[#C5F36A]";
    }

        // Send the user to Clerk's login page, then back to /social-callback
        const handleSocialLogin = () => {
            const callbackUrl = `${window.location.origin}/social-callback`;
    
            clerk.redirectToSignIn({
                signInForceRedirectUrl: callbackUrl,
                signUpForceRedirectUrl: callbackUrl
            });
        };

    // Handle signup
    const handleSignup = async (e) => {
        e.preventDefault();
        // Clear previous errors
        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setServerError("");
        // Check username
        if (username.trim().length < 3) {
            setUsernameError("Username must be at least 3 characters.");
            return;
        }
        // Check email
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setEmailError("Enter a valid email address.");
            return;
        }
        // Check password
        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            return;
        }
        // Send signup request
        try {

            setLoading(true);
            const response = await axios.post(
                `${API_URL}/signup`,
                {
                    username: username.trim(),
                    email: email.trim().toLowerCase(),
                    password: password
                },
                {
                    timeout: 10000
                }
            );
            // Save user information
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("userId", response.data.userId);

            setCurrentUser(response.data.userId);

            // Navigate to dashboard
            navigate("/");
        } catch (error) {
            if (error.response) {
                setServerError(
                    error.response.data?.message || "Signup failed. Please try again."
                );
            } else if (error.code === "ECONNABORTED") {
                setServerError("The request took too long. Please try again.");
            } else {
                setServerError("Cannot reach the server. Check your connection and try again.");
            }
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
                        OPEN A BENCH AND START BUILDING.
                    </h1>
                    <p className="mt-5 max-w-sm text-[15px] leading-6 text-[#A7A398]">
                        Create an account to publish repositories, follow the community, and keep your work in one place.
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
                            02 / JOIN
                        </p>
                    </div>
                </div>

                <p className="font-mono text-[11px] tracking-[0.16em] text-[#77786E]">
                    WORKSHOP / SIGN UP
                </p>
            </section>

            <section className="flex min-h-screen flex-col">
                <div className="m-auto w-full max-w-sm px-5 py-10">
                    <p className="font-heading text-lg tracking-tight lg:hidden">ForgeLab</p>

                    <h2 className="mt-8 font-heading text-3xl tracking-tight lg:mt-0">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#A7A398]">
                        Start managing issues and pull requests with less noise.
                    </p>

                    {/* Social signup */}
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
                        OR SIGN UP WITH EMAIL
                        <span className="h-px flex-1 bg-[rgba(233,230,220,0.12)]" />
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4" noValidate>
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

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="username"
                                className="font-mono text-[11px] tracking-[0.16em] text-[#A7A398]"
                            >
                                USERNAME
                            </label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77786E]" />
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    placeholder="adalovelace"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    aria-invalid={Boolean(usernameError)}
                                    className={fieldClass(Boolean(usernameError))}
                                />
                            </div>
                            {usernameError && (
                                <p className="text-xs text-[#F07845]">
                                    {usernameError}
                                </p>
                            )}
                        </div>

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
                        <div>
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
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            checkPasswordStrength(e.target.value);
                                        }}
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

                            {/* Password strength */}
                            {password && (
                                <div className="mt-2.5" aria-live="polite">
                                    <div className="flex gap-1.5">
                                        <span className={`h-1 flex-1 transition-colors ${
                                            passwordStrength >= 1 ? strengthColor : "bg-[rgba(233,230,220,0.12)]"
                                        }`} />
                                        <span className={`h-1 flex-1 transition-colors ${
                                            passwordStrength >= 2 ? strengthColor : "bg-[rgba(233,230,220,0.12)]"
                                        }`} />
                                        <span className={`h-1 flex-1 transition-colors ${
                                            passwordStrength >= 3 ? strengthColor : "bg-[rgba(233,230,220,0.12)]"
                                        }`} />
                                        <span className={`h-1 flex-1 transition-colors ${
                                            passwordStrength >= 4 ? strengthColor : "bg-[rgba(233,230,220,0.12)]"
                                        }`} />
                                    </div>
                                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.12em] text-[#77786E]">
                                        {strengthText}
                                    </p>
                                </div>
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
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    {/* Terms and privacy */}
                    <p className="mt-6 text-xs leading-relaxed text-[#77786E]">
                        By creating an account you agree to our{" "}
                        <a
                            href="#"
                            className="text-[#A7A398] underline-offset-2 hover:underline"
                        >
                            Terms
                        </a>
                        {" "}and{" "}
                        <a
                            href="#"
                            className="text-[#A7A398] underline-offset-2 hover:underline"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>

                    {/* Login link */}
                    <p className="mt-8 text-sm text-[#A7A398]">
                        Already have an account?{" "}
                        <Link
                            to="/auth"
                            className="font-medium text-[#C5F36A] hover:text-[#d4f58a]"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}
