import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ChevronRight, File as FileIcon, Folder, GitCommit, Globe, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function authConfig() {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

// Given the full file list and a folder, returns the folders and files directly inside it
function listFolder(files, folder) {
    const prefix = folder ? `${folder}/` : "";
    const folders = new Set();
    const items = [];

    for (const file of files) {
        if (!file.path.startsWith(prefix)) continue;

        const rest = file.path.slice(prefix.length);
        const slash = rest.indexOf("/");

        if (slash === -1) {
            items.push({ type: "file", name: rest, path: file.path });
        } else {
            folders.add(rest.slice(0, slash));
        }
    }

    const folderItems = [...folders]
        .sort()
        .map((name) => ({ type: "folder", name, path: `${prefix}${name}` }));

    items.sort((a, b) => a.name.localeCompare(b.name));

    return [...folderItems, ...items];
}

// A block of terminal commands with a Copy button
function CommandBlock({ lines }) {
    const [copied, setCopied] = useState(false);
    const text = lines.join("\n");

    async function copy() {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="relative border border-[#33342D] bg-[#0B0C09] p-4 pr-20 font-mono text-sm text-[#EDE9DF]">
            <button
                type="button"
                onClick={copy}
                className="absolute right-3 top-3 text-xs text-[#A6A397] hover:text-[#C7F36B]"
            >
                {copied ? "Copied" : "Copy"}
            </button>
            {lines.map((line, index) => (
                <div key={index} className="whitespace-pre">
                    {line || " "}
                </div>
            ))}
        </div>
    );
}

// Shown when the repo has no commits yet, like GitHub's quick setup
function EmptyRepoSetup({ repo }) {
    const name = repo.name;
    const id = repo._id;

    return (
        <div className="space-y-8 p-6">
            <div>
                <h3 className="font-heading text-xl">Quick setup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    This repository is empty. Run these commands in a terminal to add your first commit.
                </p>
            </div>

            <section>
                <p className="mb-2 font-mono text-xs text-[#C7F36B]">NEW REPOSITORY</p>
                <CommandBlock
                    lines={[
                        `mkdir ${name} && cd ${name}`,
                        `forgelab init ${id}`,
                        `echo "# ${name}" > README.md`,
                        `forgelab add README.md`,
                        `forgelab commit "first commit"`,
                        `forgelab push`,
                    ]}
                />
            </section>

            <section>
                <p className="mb-2 font-mono text-xs text-[#C7F36B]">EXISTING PROJECT</p>
                <CommandBlock
                    lines={[
                        `cd your-project`,
                        `forgelab init ${id}`,
                        `forgelab add <file>        # repeat for each file`,
                        `forgelab commit "first commit"`,
                        `forgelab push`,
                    ]}
                />
            </section>
        </div>
    );
}


export default function RepoPage() {
    const { id } = useParams();

    const [repo, setRepo] = useState(null);
    const [files, setFiles] = useState([]);
    const [commits, setCommits] = useState([]);
    const [tab, setTab] = useState("code");
    const [folder, setFolder] = useState("");
    const [openFile, setOpenFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fileCache = useRef(new Map());
const [fileLoading, setFileLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError("");

                const [treeRes, commitRes] = await Promise.all([
                    axios.get(`${API_URL}/repo/${id}/tree`, authConfig()),
                    axios.get(`${API_URL}/repo/${id}/commits`, authConfig()),
                ]);

                if (!cancelled) {
                    setRepo(treeRes.data.repo);
                    setFiles(treeRes.data.files);
                    setCommits(commitRes.data.commits);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not load this repository.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const entries = useMemo(() => listFolder(files, folder), [files, folder]);
    const crumbs = folder ? folder.split("/") : [];

    async function openFileView(path) {
        const cached = fileCache.current.get(path);
        if (cached) {
            setOpenFile(cached);
            return;
        }
    
        try {
            setFileLoading(true);
            const res = await axios.get(`${API_URL}/repo/${id}/file`, {
                ...authConfig(),
                params: { path },
            });
            fileCache.current.set(path, res.data);
            setOpenFile(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Could not open this file.");
        } finally {
            setFileLoading(false);
        }
    }

    function openEntry(entry) {
        if (entry.type === "folder") {
            setOpenFile(null);
            setFolder(entry.path);
        } else {
            openFileView(entry.path);
        }
    }

    function goToFolder(path) {
        setOpenFile(null);
        setFolder(path);
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !repo) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
                <p className="text-muted-foreground">{error || "Repository not found."}</p>
                <Link to="/" className="text-sm underline">Back to workspace</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-6 py-8">
                <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to workspace
                </Link>

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
                    <Badge variant="secondary">
                        {repo.visibility ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                        {repo.visibility ? "Public" : "Private"}
                    </Badge>
                </div>
                {repo.description && <p className="mb-6 text-muted-foreground">{repo.description}</p>}

                <div className="mb-4 flex gap-2 border-b pb-3">
                    <Button variant={tab === "code" ? "default" : "ghost"} size="sm" onClick={() => setTab("code")}>
                        Code
                    </Button>
                    <Button variant={tab === "commits" ? "default" : "ghost"} size="sm" onClick={() => setTab("commits")}>
                        Commits ({commits.length})
                    </Button>
                </div>

                {fileLoading && (
    <p className="mb-3 font-mono text-xs text-muted-foreground">Opening file…</p>
)}

                {tab === "code" && !openFile && (
                    <div className="rounded-lg border">
                        <div className="flex items-center gap-1 border-b bg-muted/40 px-4 py-2 text-sm">
                            <button className="font-medium hover:underline" onClick={() => goToFolder("")}>
                                {repo.name}
                            </button>
                            {crumbs.map((part, index) => {
                                const path = crumbs.slice(0, index + 1).join("/");
                                return (
                                    <span key={path} className="flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        <button className="hover:underline" onClick={() => goToFolder(path)}>
                                            {part}
                                        </button>
                                    </span>
                                );
                            })}
                        </div>

                        {entries.length === 0 ? (
                            <EmptyRepoSetup repo={repo} />
                        ) : (
                            <ul>
                                {entries.map((entry) => (
                                    <li key={entry.path} className="border-b last:border-b-0">
                                        <button
                                            onClick={() => openEntry(entry)}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/50"
                                        >
                                            {entry.type === "folder" ? (
                                                <Folder className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            {entry.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {tab === "code" && openFile && (
                    <div className="rounded-lg border">
                        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-sm">
                            <span className="font-mono">{openFile.path}</span>
                            <Button variant="ghost" size="sm" onClick={() => setOpenFile(null)}>
                                Back
                            </Button>
                        </div>

                        <div className="overflow-x-auto py-2 font-mono text-sm">
                            {openFile.content.split("\n").map((line, index) => (
                                <div key={index} className="flex hover:bg-muted/50">
                                    <span className="w-12 shrink-0 select-none pr-4 text-right text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <span className="whitespace-pre pr-4">{line || " "}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "commits" && (
                    <div className="rounded-lg border">
                        {commits.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">No commits pushed yet.</p>
                        ) : (
                            <ul>
                                {commits.map((commit) => (
                                    <li key={commit.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
                                        <GitCommit className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">{commit.message}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(commit.date).toLocaleString()} · {commit.fileCount} file(s)
                                            </p>
                                        </div>
                                        <code className="text-xs text-muted-foreground">{commit.id.slice(0, 7)}</code>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}