import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { sileo } from "sileo";
import { Globe, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import RepoCard from "@/components/repo/RepoCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function authConfig() {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export default function MyRepositories({
    repositories,
    ownerId,
    ownerName,
    followerCount,
    isOwnProfile,
    onDeleted,
}) {
    const [starredIds, setStarredIds] = useState(new Set());
    const [followingOwner, setFollowingOwner] = useState(false);
    const [counts, setCounts] = useState({});
    const [busy, setBusy] = useState("");
    const [selected, setSelected] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Load which repos and users the logged-in user has starred and followed
    useEffect(() => {
        if (!localStorage.getItem("token")) return;

        axios
            .get(`${API_URL}/me`, authConfig())
            .then(({ data }) => {
                setStarredIds(
                    new Set((data.starredRepositories || []).map((r) => String(r._id || r)))
                );
                setFollowingOwner(
                    (data.followedUsers || []).some((u) => String(u._id || u) === String(ownerId))
                );
            })
            .catch(() => {});
    }, [ownerId]);

    // Star counts come from the repo list
    useEffect(() => {
        setCounts(Object.fromEntries(repositories.map((r) => [r._id, r.starCount || 0])));
    }, [repositories]);

    async function toggleStar(repo) {
        const id = String(repo._id);
        const alreadyStarred = starredIds.has(id);
        setBusy(id);

        try {
            const { data } = alreadyStarred
                ? await axios.delete(`${API_URL}/repo/${id}/star`, authConfig())
                : await axios.post(`${API_URL}/repo/${id}/star`, {}, authConfig());

            setStarredIds((prev) => {
                const next = new Set(prev);
                if (alreadyStarred) next.delete(id);
                else next.add(id);
                return next;
            });

            setCounts((prev) => ({ ...prev, [id]: data.starCount ?? 0 }));
        } catch (err) {
            sileo.error({
                title: "Could not update star",
                description: err.response?.data?.message || "Try again.",
            });
        } finally {
            setBusy("");
        }
    }

    async function toggleFollow() {
        if (isOwnProfile) return;
        const key = `follow-${ownerId}`;
        setBusy(key);

        try {
            if (followingOwner) {
                await axios.delete(`${API_URL}/user/${ownerId}/follow`, authConfig());
            } else {
                await axios.post(`${API_URL}/user/${ownerId}/follow`, {}, authConfig());
            }
            setFollowingOwner(!followingOwner);
        } catch (err) {
            sileo.error({
                title: "Could not update follow",
                description: err.response?.data?.message || "Try again.",
            });
        } finally {
            setBusy("");
        }
    }

    async function confirmDelete() {
        setDeleting(true);

        try {
            await axios.delete(`${API_URL}/repo/delete/${selected._id}`, authConfig());
            sileo.success({ title: "Repository deleted", description: selected.name });
            onDeleted(selected._id);
            setSelected(null);
            setConfirming(false);
        } catch (err) {
            sileo.error({
                title: "Could not delete repository",
                description: err.response?.data?.message || "Try again.",
            });
        } finally {
            setDeleting(false);
        }
    }

    function closeDialog() {
        setSelected(null);
        setConfirming(false);
    }

    if (repositories.length === 0) {
        return <p className="py-10 text-[#A6A397]">No repositories yet.</p>;
    }

    return (
        <section>
            <div className="grid gap-2">
                {repositories.map((repo) => (
                    <button
                        key={repo._id}
                        type="button"
                        onClick={() => {
                            setSelected(repo);
                            setConfirming(false);
                        }}
                        className="flex items-center justify-between gap-4 border border-[#33342D] bg-[#14160F] px-4 py-3 text-left transition-colors hover:border-[#C7F36B]/60"
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            {repo.visibility ? (
                                <Globe size={16} className="shrink-0 text-[#C7F36B]" />
                            ) : (
                                <Lock size={16} className="shrink-0 text-[#A6A397]" />
                            )}
                            <span className="truncate font-medium text-[#EDE9DF]">{repo.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-[#A6A397]">
                            {counts[repo._id] ?? 0} ★
                        </span>
                    </button>
                ))}
            </div>

            <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="bg-[#11120F] text-[#EDE9DF] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">{selected?.name}</DialogTitle>
                        <DialogDescription>Repository details</DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <RepoCard
                            repo={selected}
                            ownerName={ownerName}
                            ownerId={ownerId}
                            followerCount={followerCount}
                            isOwn={isOwnProfile}
                            starred={starredIds.has(String(selected._id))}
                            starCount={counts[selected._id] ?? 0}
                            following={followingOwner}
                            starBusy={busy === String(selected._id)}
                            followBusy={busy === `follow-${ownerId}`}
                            onStar={() => toggleStar(selected)}
                            onFollow={toggleFollow}
                        />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Link
                            to={`/repo/${selected?._id}`}
                            className="border border-[#C7F36B] px-3 py-2 text-sm text-[#C7F36B] hover:bg-[#C7F36B]/10"
                        >
                            Open code
                        </Link>

                        {isOwnProfile &&
                            (confirming ? (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
                                        {deleting ? "Deleting..." : "Yes, delete"}
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
                                    <Trash2 className="mr-2 size-4" />
                                    Delete repository
                                </Button>
                            ))}
                    </div>

                    {isOwnProfile && confirming && (
                        <p className="text-xs text-[#F0784B]">
                            This deletes the repository and its issues. This cannot be undone.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}