import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, FolderGit2, Globe, Lock, LogOut, Search, Star, UserPlus } from 'lucide-react';
import { useClerk } from '@clerk/react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/authContext';
import SearchModal from '@/components/SearchModal';
import AnnouncementPanel from '@/components/AnnouncementPanel';
import AnnouncementForm from '@/components/AnnouncementForm';
import RepoCard from '../repo/RepoCard';


const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getJson(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data.message || 'Request failed');
        error.status = res.status;
        throw error;
    }
    return data;
}

// A value might be a MongoDB id or a populated document like { _id, username }.
function idOf(value) {
    if (!value) return '';
    return String(value._id || value);
}

export default function Dashboard() {
    const navigate = useNavigate();
    const clerk = useClerk();
    const { setCurrentUser } = useAuth();

    const [myRepos, setMyRepos] = useState([]);
    const [publicRepos, setPublicRepos] = useState([]);
    const [trendingRepos, setTrendingRepos] = useState([]);
    const [starredRepos, setStarredRepos] = useState([]);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loadingMine, setLoadingMine] = useState(true);
    const [loadingPublic, setLoadingPublic] = useState(true);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [starBusyId, setStarBusyId] = useState('');
    const [followBusyId, setFollowBusyId] = useState('');
    const [publicError, setPublicError] = useState('');
    const [trendingError, setTrendingError] = useState('');

    const [searchOpen, setSearchOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState(null);

    const [repoName, setRepoName] = useState('');
    const [repoDescription, setRepoDescription] = useState('');
    const [repoVisibility, setRepoVisibility] = useState('public');
    const [repoNameError, setRepoNameError] = useState('');
    const [savingRepo, setSavingRepo] = useState(false);

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const shortcut = /Mac|iPhone|iPad/.test(navigator.platform || '') ? 'Cmd+O' : 'Ctrl+O';

    const total = myRepos.length;
    const publicCount = myRepos.filter((repo) => repo.visibility).length;
    const privateCount = total - publicCount;

    useEffect(() => {
        function onKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                setSearchOpen(true);
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const loadMine = useCallback(() => {
        if (!userId || !token) {
            setMyRepos([]);
            setLoadingMine(false);
            return;
        }

        setLoadingMine(true);
        getJson(`${API}/repo/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((data) => setMyRepos(data.repositories || []))
            .catch((err) => {
                setMyRepos([]);
                if (err.status !== 404) {
                    sileo.error({ title: 'Could not load your repositories', description: err.message });
                }
            })
            .finally(() => setLoadingMine(false));
    }, [userId, token]);

    // One fetch for every public repo, and one for the top 10. The public
    // section later hides any id that is already in trending.
    function refreshCommunity() {
        getJson(`${API}/repo/public`)
            .then((data) => {
                setPublicRepos(data.repositories || []);
                setPublicError('');
            })
            .catch((err) => {
                setPublicError(err.message);
                sileo.error({ title: 'Could not load repositories', description: err.message });
            })
            .finally(() => setLoadingPublic(false));

        getJson(`${API}/repo/trending`)
            .then((data) => {
                setTrendingRepos(data.repositories || []);
                setTrendingError('');
            })
            .catch((err) => {
                setTrendingError(err.message);
                sileo.error({ title: 'Could not load trending repositories', description: err.message });
            })
            .finally(() => setLoadingTrending(false));
    }

    useEffect(() => {
        loadMine();
        refreshCommunity();

        getJson(`${API}/announcement`)
            .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
            .catch((err) => sileo.error({ title: 'Could not load announcements', description: err.message }))
            .finally(() => setLoadingAnnouncements(false));

        // Starred repos and followed users come from the logged-in account, not localStorage.
        if (!token) {
            setStarredRepos([]);
            setFollowedUsers([]);
            setLoadingActivity(false);
            return;
        }

        setLoadingActivity(true);
        getJson(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((data) => {
                setStarredRepos(data.starredRepositories || []);
                setFollowedUsers(data.followedUsers || []);
            })
            .catch((err) => {
                setStarredRepos([]);
                setFollowedUsers([]);
                sileo.error({ title: 'Could not load your activity', description: err.message });
            })
            .finally(() => setLoadingActivity(false));
    }, [loadMine, token]);

    function closeCreate() {
        setRepoName('');
        setRepoDescription('');
        setRepoVisibility('public');
        setRepoNameError('');
        setCreateOpen(false);
    }

    async function createRepository(e) {
        e.preventDefault();
        if (!repoName.trim()) {
            setRepoNameError('Repository name is required.');
            return;
        }

        setSavingRepo(true);
        setRepoNameError('');

        try {
            const res = await fetch(`${API}/repo/create`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: repoName.trim(),
                    description: repoDescription.trim(),
                    visibility: repoVisibility === 'public',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not create the repository.');

            sileo.success({ title: 'Repository created', description: repoName.trim() });
            loadMine();
            closeCreate();
        } catch (err) {
            sileo.error({ title: 'Could not create repository', description: err.message });
        } finally {
            setSavingRepo(false);
        }
    }

    function isStarred(repoId) {
        return starredRepos.some((repo) => idOf(repo) === String(repoId));
    }

    function isFollowing(ownerId) {
        return followedUsers.some((user) => idOf(user) === String(ownerId));
    }

    async function toggleStar(repo) {
        const repoId = idOf(repo);
        if (!repoId || starBusyId === repoId) return;

        const alreadyStarred = isStarred(repoId);
        setStarBusyId(repoId);

        try {
            const data = await getJson(`${API}/repo/${repoId}/star`, {
                method: alreadyStarred ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.starred && data.repository) {
                setStarredRepos((current) => {
                    if (current.some((item) => idOf(item) === idOf(data.repository))) return current;
                    return [data.repository, ...current];
                });
            } else {
                setStarredRepos((current) => current.filter((item) => idOf(item) !== repoId));
            }

            // Star totals can move a repository into or out of the top 10.
            refreshCommunity();
        } catch (err) {
            sileo.error({
                title: alreadyStarred ? 'Could not unstar repository' : 'Could not star repository',
                description: err.message,
            });
        } finally {
            setStarBusyId('');
        }
    }

    async function toggleFollow(owner) {
        const ownerId = idOf(owner);
        if (!ownerId || ownerId === String(userId) || followBusyId === ownerId) return;

        const alreadyFollowing = isFollowing(ownerId);
        setFollowBusyId(ownerId);

        try {
            const data = await getJson(`${API}/user/${ownerId}/follow`, {
                method: alreadyFollowing ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.following && data.user) {
                setFollowedUsers((current) => {
                    if (current.some((item) => idOf(item) === idOf(data.user))) return current;
                    return [data.user, ...current];
                });
            } else {
                setFollowedUsers((current) => current.filter((item) => idOf(item) !== ownerId));
            }

            if (typeof data.followerCount === 'number') {
                const withFollowers = (item) => (
                    idOf(item.owner) === ownerId
                        ? { ...item, owner: { ...item.owner, followerCount: data.followerCount } }
                        : item
                );
                setPublicRepos((current) => current.map(withFollowers));
                setTrendingRepos((current) => current.map(withFollowers));
            }
        } catch (err) {
            sileo.error({
                title: alreadyFollowing ? 'Could not unfollow' : 'Could not follow',
                description: err.message,
            });
        } finally {
            setFollowBusyId('');
        }
    }

    async function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAdmin');
        setCurrentUser(null);
        try {
            await clerk.signOut();
        } catch {
            // Email accounts are not Clerk sessions.
        }
        navigate('/auth');
    }

    // Hide a public repository when that same _id is already in trending.
    const trendingIds = new Set(trendingRepos.map((repo) => idOf(repo)));
    const otherPublicRepos = publicRepos.filter((repo) => !trendingIds.has(idOf(repo)));

    function renderRepoCard(repo) {
        const ownerId = idOf(repo.owner);
    
        return (
            <RepoCard
                key={repo._id}
                repo={repo}
                ownerName={repo.owner?.username || 'unknown'}
                ownerId={ownerId}
                followerCount={repo.owner?.followerCount || 0}
                isOwn={ownerId === String(userId)}
                starred={isStarred(repo._id)}
                starCount={repo.starCount || 0}
                following={isFollowing(ownerId)}
                starBusy={starBusyId === idOf(repo)}
                followBusy={followBusyId === ownerId}
                onStar={() => toggleStar(repo)}
                onFollow={() => toggleFollow(repo.owner)}
                linkTo={`/repo/${repo._id}`}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#11120F] text-[#EDE9DF]">
            <header className="sticky top-0 z-30 bg-[#11120F]">
                <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
                    <Link to="/" className="font-heading text-lg tracking-tight">
                        ForgeLab
                    </Link>

                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="ml-auto flex h-10 min-w-0 items-center gap-2 bg-[#1D201A] px-3 text-sm text-[#A6A397] transition-colors hover:text-[#EDE9DF] sm:ml-8 sm:h-9 sm:max-w-xs sm:flex-1"
                    >
                        <Search className="size-4 shrink-0" />
                        <span className="truncate">Search the workshop</span>
                        <kbd className="ml-auto hidden font-mono text-[11px] sm:inline">{shortcut}</kbd>
                    </button>

                    <Link to="/profile" className="text-sm text-[#A6A397] hover:text-[#EDE9DF]">
                        Profile
                    </Link>
                    <button type="button" onClick={logout} className="text-[#A6A397] hover:text-[#EDE9DF]" aria-label="Log out">
                        <LogOut className="size-4" />
                    </button>
                </div>
            </header>

            <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
                <aside className="order-2 px-4 py-6 lg:order-none lg:col-start-1 lg:row-start-1 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-5">
                    <div>
                        <p className="font-mono text-[11px] tracking-[0.14em] text-[#A6A397]">STARRED REPOSITORIES</p>
                        <div className="mt-2 max-h-36 space-y-0.5 overflow-y-auto">
                            {loadingActivity && <p className="py-3 font-mono text-xs text-[#A6A397]">Loading…</p>}
                            {!loadingActivity && starredRepos.length === 0 && (
                                <p className="py-3 text-sm text-[#A6A397]">No starred repositories.</p>
                            )}
                            {!loadingActivity &&
                                starredRepos.map((repo) => (
                                    <button
                                        key={idOf(repo)}
                                        type="button"
                                        onClick={() => setSelectedRepo(repo)}
                                        className="flex w-full min-w-0 items-center gap-2.5 px-1 py-2 text-left transition-colors hover:bg-[#1D201A]"
                                    >
                                        <Star className="size-3.5 shrink-0 fill-[#C7F36B] text-[#C7F36B]" />
                                        <span className="truncate text-sm">{repo.name}</span>
                                    </button>
                                ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="font-mono text-[11px] tracking-[0.16em] text-[#A6A397]">FOLLOWING</p>
                        <div className="mt-2 max-h-36 space-y-0.5 overflow-y-auto">
                            {loadingActivity && <p className="py-3 font-mono text-xs text-[#A6A397]">Loading…</p>}
                            {!loadingActivity && followedUsers.length === 0 && (
                                <p className="py-3 text-sm text-[#A6A397]">Not following anyone yet.</p>
                            )}
                            {!loadingActivity &&
                                followedUsers.map((user) => (
                                    <div key={idOf(user)} className="flex min-w-0 items-center gap-2.5 px-1 py-2">
                                        <span className="flex size-6 shrink-0 items-center justify-center bg-[#1D201A] font-mono text-[10px] text-[#C7F36B]">
                                            {(user.username || '?').slice(0, 2).toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm">{user.username}</span>
                                            <span className="block font-mono text-[10px] tracking-wide text-[#A6A397]">
                                                {user.repositoryCount || 0} REPOS
                                            </span>
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="mt-6 flex items-baseline justify-between gap-3">
                        <p className="font-mono text-[11px] tracking-[0.16em] text-[#A6A397]">MY WORK</p>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="bg-[#C7F36B] px-2.5 py-1 font-mono text-[11px] tracking-wide text-[#11120F] transition-colors hover:bg-[#d6f78d]"
                        >
                            NEW
                        </button>
                    </div>

                    <div className="mt-4 max-h-64 space-y-0.5 overflow-y-auto lg:max-h-none">
                        {loadingMine && <p className="py-6 font-mono text-xs text-[#A6A397]">Loading…</p>}

                        {!loadingMine && myRepos.length === 0 && (
                            <div className="py-8">
                                <p className="font-heading text-lg leading-tight">Nothing on the bench yet.</p>
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(true)}
                                    className="mt-4 bg-[#C7F36B] px-3 py-2 text-sm text-[#11120F] hover:bg-[#d6f78d]"
                                >
                                    Create repository
                                </button>
                            </div>
                        )}

{!loadingMine &&
    myRepos.map((repo) => (
        <Link
            key={repo._id}
            to={`/repo/${repo._id}`}
            className="flex items-center gap-2.5 px-1 py-2.5 transition-colors hover:bg-[#1D201A]"
        >
            {repo.visibility ? (
                <Globe className="size-3.5 shrink-0 text-[#A6A397]" />
            ) : (
                <Lock className="size-3.5 shrink-0 text-[#A6A397]" />
            )}
            <div className="min-w-0">
                <p className="truncate text-sm">{repo.name}</p>
                <p className="font-mono text-[10px] tracking-wide text-[#A6A397]">
                    {repo.visibility ? 'PUBLIC' : 'PRIVATE'}
                </p>
            </div>
        </Link>
    ))}
                    </div>
                </aside>

                <main className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
                    <section className="grid items-start gap-6 px-4 pt-4 pb-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-12 lg:pt-6">
                        <div>
                            <p className="flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-[#A6A397]">
                                <span className="h-px w-7 bg-[#C7F36B]" />
                                FORGELAB / COMMUNITY WORKSPACE / 2026
                            </p>
                            <h1 className="mt-4 font-heading text-[2.7rem] leading-[0.86] tracking-[-0.035em] text-[#EDE9DF] sm:text-[3.35rem]">
                                MAKE SOMETHING
                                <br />
                                WORTH SHARING.
                            </h1>
                            <p className="mt-4 max-w-[28rem] text-[15px] leading-6 text-[#A6A397]">
                                Your space to build, discover and share what you're creating with the developer community.
                            </p>
                            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(true)}
                                    className="h-11 bg-[#C7F36B] px-4 text-sm text-[#11120F] transition-colors hover:bg-[#d6f78d] sm:h-10"
                                >
                                    Create repository
                                </button>
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('public-repos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                    className="h-11 px-4 text-sm text-[#EDE9DF] transition-colors hover:bg-[#1D201A] sm:h-10"
                                >
                                    Explore community
                                </button>
                            </div>

                            <dl className="mt-7 flex max-w-sm font-mono text-[11px] tracking-[0.14em] text-[#A6A397]">
                                <div className="pr-5">
                                    <dd className="font-heading text-[1.65rem] tracking-normal text-[#EDE9DF]">{loadingMine ? '—' : total}</dd>
                                    <dt className="mt-1">TOTAL</dt>
                                </div>
                                <div className="border-l border-[#34372D] px-5">
                                    <dd className="font-heading text-[1.65rem] tracking-normal text-[#EDE9DF]">{loadingMine ? '—' : publicCount}</dd>
                                    <dt className="mt-1">PUBLIC</dt>
                                </div>
                                <div className="border-l border-[#34372D] pl-5">
                                    <dd className="font-heading text-[1.65rem] tracking-normal text-[#EDE9DF]">{loadingMine ? '—' : privateCount}</dd>
                                    <dt className="mt-1">PRIVATE</dt>
                                </div>
                            </dl>
                        </div>

                        <div className="hidden pt-1 sm:block" aria-hidden="true">
                            <svg viewBox="0 0 232 248" className="h-auto w-full">
                                <path d="M16 20 H216 M16 216 H140 M20 16 V232" stroke="#34372D" fill="none" />
                                <rect x="28" y="28" width="168" height="168" fill="#C7F36B" />
                                <text
                                    x="81"
                                    y="148"
                                    fill="#11120F"
                                    fontFamily="Space Grotesk, sans-serif"
                                    fontSize="118"
                                    fontWeight="600"
                                >
                                    F
                                </text>
                                <rect x="156" y="184" width="60" height="12" fill="#F0784B" />
                                <text x="28" y="240" fill="#A6A397" fontFamily="IBM Plex Mono, monospace" fontSize="11">
                                    01 / MARK
                                </text>
                            </svg>
                        </div>
                    </section>

                    <section className="scroll-mt-16 border-t border-[#34372D] px-4 pt-8 sm:px-6">
                        <div className="mb-5 flex items-end justify-between gap-4">
                            <div>
                                <p className="font-mono text-[11px] tracking-[0.16em] text-[#C7F36B]">TOP 10</p>
                                <h2 className="mt-1 font-heading text-2xl tracking-tight">Trending repositories</h2>
                            </div>
                        </div>

                        {loadingTrending && <p className="font-mono text-xs text-[#A6A397]">Loading trending…</p>}
                        {!loadingTrending && trendingError && <p className="text-sm text-[#F0784B]">{trendingError}</p>}
                        {!loadingTrending && !trendingError && trendingRepos.length === 0 && (
                            <p className="max-w-sm text-sm text-[#A6A397]">No public repositories yet.</p>
                        )}
                        {!loadingTrending && trendingRepos.length > 0 && (
                            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                {trendingRepos.map((repo, index) => (
                                    <div key={repo._id}>
                                        <p className="px-1 font-mono text-[10px] tracking-[0.14em] text-[#C7F36B]">
                                            {String(index + 1).padStart(2, '0')}
                                        </p>
                                        {renderRepoCard(repo)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section id="public-repos" className="scroll-mt-16 px-4 pt-10 pb-10 sm:px-6">
                        <div className="mb-5 flex items-end justify-between gap-4">
                            <h2 className="font-heading text-2xl tracking-tight">From the community</h2>
                            <p className="font-mono text-[11px] tracking-[0.14em] text-[#A6A397]">PUBLIC</p>
                        </div>

                        {(loadingPublic || loadingTrending) && <p className="font-mono text-xs text-[#A6A397]">Loading repositories…</p>}

                        {!loadingPublic && !loadingTrending && publicError && (
                            <p className="text-sm text-[#F0784B]">{publicError}</p>
                        )}

                        {!loadingPublic && !loadingTrending && !publicError && otherPublicRepos.length === 0 && (
                            <p className="max-w-sm text-sm text-[#A6A397]">
                                {publicRepos.length === 0
                                    ? 'No public repositories yet. The first one published will show up here.'
                                    : 'Every public repository is already listed in trending.'}
                            </p>
                        )}

                        {!loadingPublic && !loadingTrending && !publicError && otherPublicRepos.length > 0 && (
                            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                {otherPublicRepos.map((repo) => renderRepoCard(repo))}
                            </div>
                        )}
                    </section>
                </main>

                <aside className="order-3 px-4 py-6 sm:px-6 lg:order-none lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-16 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:px-5">
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                        <div>
                            <p className="font-mono text-[11px] tracking-[0.16em] text-[#F0784B]">JOURNAL</p>
                            <h2 className="mt-1 font-heading text-2xl tracking-tight">Notes</h2>
                        </div>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setFormOpen(true)}
                                className="bg-[#C7F36B] px-2.5 py-1 font-mono text-[11px] tracking-wide text-[#11120F] hover:bg-[#d6f78d]"
                            >
                                NEW
                            </button>
                        )}
                    </div>
                    <AnnouncementPanel items={announcements} loading={loadingAnnouncements} />
                </aside>
            </div>

            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreate()}>
                <DialogContent className="bg-[#1D201A] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">Create repository</DialogTitle>
                        <DialogDescription>Add a project to your bench.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createRepository} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="repo-name">Name</Label>
                            <Input
                                id="repo-name"
                                value={repoName}
                                onChange={(e) => setRepoName(e.target.value)}
                                placeholder="forgelab-api"
                                aria-invalid={Boolean(repoNameError)}
                                className="h-9"
                            />
                            {repoNameError && <p className="text-xs text-destructive">{repoNameError}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="repo-description">Description</Label>
                            <Textarea
                                id="repo-description"
                                rows={3}
                                value={repoDescription}
                                onChange={(e) => setRepoDescription(e.target.value)}
                                placeholder="What are you building?"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="repo-visibility">Visibility</Label>
                            <select
                                id="repo-visibility"
                                value={repoVisibility}
                                onChange={(e) => setRepoVisibility(e.target.value)}
                                className="h-9 w-full bg-[#252820] px-2.5 text-sm outline-none"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeCreate} disabled={savingRepo}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={savingRepo}>
                                {savingRepo ? 'Creating...' : 'Create repository'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(selectedRepo)} onOpenChange={(open) => !open && setSelectedRepo(null)}>
                <DialogContent className="bg-[#1D201A] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">{selectedRepo?.name}</DialogTitle>
                        <DialogDescription>
                            {selectedRepo?.owner?.username || 'unknown'} · Public
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm leading-6 text-[#A6A397]">
                        {selectedRepo?.description || 'No description'}
                    </p>
                </DialogContent>
            </Dialog>

            {isAdmin && (
                <AnnouncementForm
                    isOpen={formOpen}
                    onClose={() => setFormOpen(false)}
                    onCreated={(newItem) => setAnnouncements((prev) => [newItem, ...prev])}
                />
            )}
        </div>
    );
}
