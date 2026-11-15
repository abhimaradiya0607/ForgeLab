
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useClerk } from "@clerk/react";
import { useAuth } from "@/authContext";
import {
    ArrowLeft,
    Globe,
    Lock,
    Star,
    Users,
    FolderGit2,
    Activity,
    Loader2,
    UserPlus,
    UserCheck,
    Boxes,
} from "lucide-react";
import ActivitySection from "../profile/ActivitySection";
import MyRepositories from "../profile/MyRepositories";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Profile() {
    const navigate = useNavigate();
    const clerk = useClerk();
    const { setCurrentUser } = useAuth();
    const { id } = useParams();

    const currentUserId = localStorage.getItem("userId");
    const profileId = id || currentUserId;
    const isOwnProfile = currentUserId === profileId;

    const [user, setUser] = useState(null);
    const [repositories, setRepositories] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        fetchProfile();
    }, [profileId]);

    
async function fetchProfile() {
    try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            setError("You are not logged in. Please log in again.");
            return;
        }

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        const [userResponse, repoResponse] = await Promise.all([
            axios.get(`${API_URL}/userProfile/${profileId}`, config),

            axios.get(`${API_URL}/repo/user/${profileId}`, config)
        ]);

        const userData =
            userResponse.data.user ||
            userResponse.data.profile ||
            userResponse.data;

        const repoData =
            repoResponse.data.repositories ||
            repoResponse.data;

        setUser(userData);
        setRepositories(Array.isArray(repoData) ? repoData : []);

        const followers = userData.followers || [];

        setIsFollowing(
            followers.some(follower =>
                String(follower._id || follower) === String(currentUserId)
            )
        );

    } catch (error) {
        console.error("Profile loading failed:", error);
        console.log("Failed URL:", error.config?.url);
        console.log("Status:", error.response?.status);
        console.log("Response:", error.response?.data);

        setError(
            error.response?.data?.message ||
            "Unable to load this profile."
        );
    } finally {
        setLoading(false);
    }
}


    async function handleFollow() {
        try {
            setFollowLoading(true);

            const token = localStorage.getItem("token");

            if (isFollowing) {
                await axios.delete(`${API_URL}/user/${profileId}/follow`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                await axios.post(
                    `${API_URL}/user/${profileId}/follow`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            }

            setIsFollowing(!isFollowing);

            setUser(previous => ({
                ...previous,
                followers: isFollowing
                    ? previous.followers.filter(follower =>
                        String(follower._id || follower) !== String(currentUserId)
                    )
                    : [...(previous.followers || []), currentUserId]
            }));

        } catch (error) {
            console.error("Follow error:", error);
        } finally {
            setFollowLoading(false);
        }
    }

    async function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("isAdmin");

        setCurrentUser(null);

        try {
            await clerk.signOut();
        } catch {
            // Email accounts are not Clerk sessions.
        }

        navigate("/auth");
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#11120F] flex items-center justify-center text-[#C7F36B]">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-[#11120F] text-[#EDE9DF] flex flex-col items-center justify-center">
                <p>{error || "User not found."}</p>
                <Link to="/" className="mt-4 text-[#C7F36B]">
                    Back to workspace
                </Link>
            </div>
        );
    }

    

    const followers = user.followers || [];
    const following = user.following || [];

    return (
        <div className="min-h-screen bg-[#11120F] text-[#EDE9DF]">

            {/* Navbar */}
            <nav className="h-16 border-b border-[#33342D] flex items-center justify-between px-6 md:px-10">
                <Link to="/" className="font-heading text-xl">
                    ForgeLab
                </Link>

                <div className="flex items-center gap-5 text-sm">
                    <Link to="/" className="text-[#A6A397] hover:text-[#C7F36B]">
                        Workspace
                    </Link>

                    <button
                        onClick={logout}
                        className="text-[#A6A397] hover:text-red-400"
                    >
                        Log out
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-10">

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-[#A6A397] hover:text-[#C7F36B] mb-10"
                >
                    <ArrowLeft size={16} />
                    Back to workspace
                </Link>

                {/* Profile information */}
                <section className="flex flex-col md:flex-row md:items-center gap-7 border-b border-[#33342D] pb-10">

                    <div className="h-28 w-28 rounded-full bg-[#C7F36B] text-[#11120F] flex items-center justify-center text-4xl font-bold">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="flex-1">
                        <p className="font-mono text-xs tracking-[0.2em] text-[#A6A397]">
                            COMMUNITY MEMBER
                        </p>

                        <h1 className="font-heading text-4xl mt-2">
                            {user.username}
                        </h1>

                        <p className="text-sm text-[#A6A397] mt-2">
                            {user.email}
                        </p>

                        {user.bio && (
                            <p className="text-[#C5C1B5] mt-4 max-w-xl">
                                {user.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-6 mt-5 text-sm text-[#A6A397]">
                            <span>
                                <strong className="text-[#EDE9DF]">
                                    {followers.length}
                                </strong> Followers
                            </span>

                            <span>
                                <strong className="text-[#EDE9DF]">
                                    {following.length}
                                </strong> Following
                            </span>

                            <span>
                                <strong className="text-[#EDE9DF]">
                                    {repositories.length}
                                </strong> Repositories
                            </span>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C7F36B] text-[#11120F] font-medium hover:bg-[#d6ff82] disabled:opacity-50"
                        >
                            {followLoading ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : isFollowing ? (
                                <UserCheck size={17} />
                            ) : (
                                <UserPlus size={17} />
                            )}

                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    )}
                </section>

                {/* Profile tabs */}
                <div className="flex gap-8 border-b border-[#33342D] mt-8 overflow-x-auto">

                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`py-4 flex items-center gap-2 text-sm whitespace-nowrap ${
                            activeTab === "overview"
                                ? "text-[#C7F36B] border-b-2 border-[#C7F36B]"
                                : "text-[#A6A397]"
                        }`}
                    >
                        <FolderGit2 size={17} />
                        Overview
                    </button>

                    <button
    onClick={() => setActiveTab("repos")}
    className={`py-4 flex items-center gap-2 text-sm whitespace-nowrap ${
        activeTab === "repos"
            ? "text-[#C7F36B] border-b-2 border-[#C7F36B]"
            : "text-[#A6A397]"
    }`}
>
    <Boxes size={17} />
    My Repositories
</button>

                    <button
                        onClick={() => setActiveTab("activity")}
                        className={`py-4 flex items-center gap-2 text-sm whitespace-nowrap ${
                            activeTab === "activity"
                                ? "text-[#C7F36B] border-b-2 border-[#C7F36B]"
                                : "text-[#A6A397]"
                        }`}
                    >
                        <Activity size={17} />
                        Activity
                    </button>
                </div>

                {/* Overview */}
                {/* Overview */}
{activeTab === "overview" && (
    <section className="mt-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading text-2xl">
                Repositories
            </h2>

            <span className="text-xs font-mono text-[#A6A397]">
                {repositories.length} TOTAL
            </span>
        </div>

        {repositories.length === 0 ? (
            <p className="text-[#A6A397] py-10">
                No repositories available yet.
            </p>
        ) : (
            <div className="grid md:grid-cols-2 gap-5">
                {repositories.map(repo => (
                    <Link
                        key={repo._id}
                        to={`/repo/${repo._id}`}
                        className="block border border-[#33342D] p-5 hover:border-[#C7F36B] transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">
                                {repo.name}
                            </h3>

                            {repo.visibility ? (
                                <Globe size={17} className="text-[#C7F36B]" />
                            ) : (
                                <Lock size={17} className="text-[#A6A397]" />
                            )}
                        </div>

                        <p className="text-sm text-[#A6A397] mt-3">
                            {repo.description || "No description provided."}
                        </p>

                        <div className="flex items-center gap-2 mt-6 text-xs text-[#A6A397]">
                            <Star size={14} />
                            {repo.stars?.length || repo.starsCount || 0} Stars

                            <span className="ml-auto">
                                {repo.visibility ? "PUBLIC" : "PRIVATE"}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        )}
    </section>
)}

                {/* Starred repositories */}
                {/* My repositories */}
{activeTab === "repos" && (
    <section className="mt-8">
        <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl">My Repositories</h2>
            <span className="font-mono text-xs text-[#A6A397]">
                {repositories.length} TOTAL
            </span>
        </div>

        <MyRepositories
            repositories={repositories}
            ownerId={profileId}
            ownerName={user.username}
            followerCount={followers.length}
            isOwnProfile={isOwnProfile}
            onDeleted={(deletedId) =>
                setRepositories((prev) => prev.filter((repo) => repo._id !== deletedId))
            }
        />
    </section>
)}

                {/* Future activity section */}
                {activeTab === "activity" && <ActivitySection userId={profileId} />}

            </main>
        </div>
    );
}
