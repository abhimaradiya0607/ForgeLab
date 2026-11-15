import { Link } from "react-router-dom";
import { Check, Star, UserPlus } from "lucide-react";

// Colors for each kind of badge
const TONES = {
    lime: "border-[#C7F36B]/40 bg-[#C7F36B]/10 text-[#C7F36B]",
    orange: "border-[#F0784B]/40 bg-[#F0784B]/10 text-[#F0784B]",
    sky: "border-[#7DD3FC]/40 bg-[#7DD3FC]/10 text-[#7DD3FC]",
    muted: "border-[#44453B] bg-[#1D201A] text-[#A6A397]",
};

function Badge({ tone = "muted", children }) {
    return (
        <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] tracking-wider ${TONES[tone]}`}>
            {children}
        </span>
    );
}

export default function RepoCard({
    repo,
    ownerName = "unknown",
    ownerId,
    followerCount = 0,
    isOwn = false,
    starred = false,
    starCount = 0,
    following = false,
    starBusy = false,
    followBusy = false,
    onStar,
    onFollow,
    linkTo,
}) {
    const showFollow = Boolean(onFollow) && !isOwn && Boolean(ownerId);

    return (
        <div className="group relative flex flex-col gap-3 border border-[#33342D] bg-[#14160F] p-4 transition-colors hover:border-[#C7F36B]/60">
            {/* Makes the whole card clickable. It sits behind the content. */}
            {linkTo && (
                <Link to={linkTo} aria-label={`Open ${repo.name}`} className="absolute inset-0 z-0" />
            )}

            {/* Text ignores clicks, so they reach the link. Buttons opt back in. */}
            <div className="pointer-events-none relative flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={repo.visibility ? "lime" : "muted"}>
                                {repo.visibility ? "PUBLIC" : "PRIVATE"}
                            </Badge>
                            {isOwn && <Badge tone="orange">YOU</Badge>}
                        </div>
                        <h3 className="mt-2 truncate font-heading text-xl text-[#EDE9DF]">{repo.name}</h3>
                    </div>

                    {onStar ? (
                        <button
                            type="button"
                            onClick={onStar}
                            disabled={starBusy}
                            aria-label={starred ? `Unstar ${repo.name}` : `Star ${repo.name}`}
                            aria-pressed={starred}
                            className={`pointer-events-auto inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] transition-colors disabled:opacity-50 ${
                                starred
                                    ? "border-[#C7F36B] bg-[#C7F36B]/15 text-[#C7F36B]"
                                    : "border-[#44453B] text-[#A6A397] hover:border-[#C7F36B] hover:text-[#C7F36B]"
                            }`}
                        >
                            <Star className={`size-3.5 ${starred ? "fill-[#C7F36B]" : ""}`} />
                            {starCount}
                        </button>
                    ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 border border-[#44453B] px-2.5 py-1 font-mono text-[11px] text-[#A6A397]">
                            <Star className="size-3.5" />
                            {starCount}
                        </span>
                    )}
                </div>

                <p className="line-clamp-2 min-h-10 text-sm leading-5 text-[#A6A397]">
                    {repo.description || "No description"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Owner: a colored avatar and name */}
                    <span className="inline-flex items-center gap-2 border border-[#7DD3FC]/30 bg-[#7DD3FC]/5 py-0.5 pl-0.5 pr-2.5">
                        <span className="flex size-5 items-center justify-center bg-[#7DD3FC]/20 font-mono text-[10px] text-[#7DD3FC]">
                            {ownerName.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-mono text-[11px] text-[#7DD3FC]">{ownerName}</span>
                    </span>

                    {showFollow && (
                        <button
                            type="button"
                            onClick={onFollow}
                            disabled={followBusy}
                            className={`pointer-events-auto inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] tracking-wider transition-colors disabled:opacity-50 ${
                                following
                                    ? "border-[#C7F36B]/40 text-[#C7F36B]"
                                    : "border-[#44453B] text-[#A6A397] hover:border-[#EDE9DF] hover:text-[#EDE9DF]"
                            }`}
                        >
                            {following ? <Check className="size-3" /> : <UserPlus className="size-3" />}
                            {following ? "FOLLOWING" : "FOLLOW"}
                        </button>
                    )}

                    <Badge tone="orange">
                        {followerCount} {followerCount === 1 ? "FOLLOWER" : "FOLLOWERS"}
                    </Badge>
                </div>
            </div>
        </div>
    );
}