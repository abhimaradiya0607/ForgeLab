import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderGit2, Search } from 'lucide-react';
import { sileo } from 'sileo';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import useDebounce from '../hooks/useDebounce';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Highlight({ text, query }) {
    const value = text || '';
    const needle = query.trim();
    if (!needle) return value;

    const index = value.toLowerCase().indexOf(needle.toLowerCase());
    if (index === -1) return value;

    return (
        <>
            {value.slice(0, index)}
            <mark className="bg-[#C7F36B]/25 text-[#EDE9DF]">{value.slice(index, index + needle.length)}</mark>
            {value.slice(index + needle.length)}
        </>
    );
}

export default function SearchModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef(null);

    const debouncedQuery = useDebounce(query, 300);
    const shortcut = /Mac|iPhone|iPad/.test(navigator.platform || '') ? 'Cmd+O' : 'Ctrl+O';

    // Reset everything when the modal closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setError('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    // Highlight the first result whenever the list changes
    useEffect(() => {
        setActiveIndex(0);
    }, [results]);

    // Fetch matches for the debounced text
    useEffect(() => {
        const q = debouncedQuery.trim();

        if (!q) {
            setResults([]);
            setLoading(false);
            setError('');
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError('');

        fetch(`${API}/repo/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error('Search request failed');
                return res.json();
            })
            .then((data) => setResults(Array.isArray(data) ? data : []))
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setResults([]);
                setError('Search failed. Please try again in a moment.');
                sileo.error({ title: 'Search failed', description: 'Please try again in a moment.' });
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [debouncedQuery]);

    // Keep the highlighted row visible while using arrow keys
    useEffect(() => {
        const current = listRef.current?.querySelector('[data-active="true"]');
        current?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // Open a repo: close the modal, then go to its page
    function openRepo(repo) {
        onClose();
        navigate(`/repo/${repo._id}`);
    }

    function onKeyDown(e) {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const repo = results[activeIndex];
            if (repo) openRepo(repo);
        }
    }

    const trimmed = query.trim();
    const pending = Boolean(trimmed) && (loading || trimmed !== debouncedQuery.trim());

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="gap-0 overflow-hidden bg-[#1D201A] p-0 sm:max-w-xl">
                <DialogTitle className="sr-only">Search public repositories</DialogTitle>

                <div className="flex items-center gap-2 pr-10 pl-4">
                    <Search className="size-4 shrink-0 text-[#A6A397]" />
                    <input
                        autoFocus
                        placeholder="Search public repositories"
                        className="h-14 w-full bg-transparent font-heading text-lg text-[#EDE9DF] outline-none placeholder:text-[#A6A397]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
                        aria-controls="search-results"
                    />
                    <kbd className="hidden font-mono text-[11px] text-[#A6A397] sm:inline">{shortcut}</kbd>
                </div>

                <div id="search-results" ref={listRef} className="max-h-80 overflow-y-auto px-2 pb-2" role="listbox">
                    {pending && (
                        <p className="px-3 py-8 text-center font-mono text-xs text-[#A6A397]">Searching…</p>
                    )}

                    {error && !pending && (
                        <p className="px-3 py-8 text-center text-sm text-[#F0784B]" role="alert">
                            {error}
                        </p>
                    )}

                    {!pending && !error && trimmed && results.length === 0 && (
                        <p className="px-3 py-8 text-center text-sm text-[#A6A397]">No repositories found.</p>
                    )}

                    {!pending && !error && !trimmed && (
                        <p className="px-3 py-8 text-center text-sm text-[#A6A397]">Type a repository name.</p>
                    )}

                    {!error && !pending && results.length > 0 && (
                        <ul className="flex flex-col">
                            {results.map((repo, index) => (
                                <li key={repo._id || `${repo.name}-${index}`}>
                                    <Link
                                        to={`/repo/${repo._id}`}
                                        id={`search-result-${index}`}
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        data-active={index === activeIndex}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            openRepo(repo);
                                        }}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`flex items-start gap-3 px-3 py-3 transition-colors ${
                                            index === activeIndex ? 'bg-[#252820]' : ''
                                        }`}
                                    >
                                        <span
                                            className={`mt-1 h-4 w-0.5 shrink-0 ${
                                                index === activeIndex ? 'bg-[#C7F36B]' : 'bg-transparent'
                                            }`}
                                        />
                                        <FolderGit2 className="mt-0.5 size-4 shrink-0 text-[#A6A397]" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-[#EDE9DF]">
                                                <Highlight text={repo.name} query={debouncedQuery} />
                                            </p>
                                            <p className="line-clamp-1 text-sm text-[#A6A397]">
                                                <Highlight
                                                    text={repo.description || 'No description'}
                                                    query={debouncedQuery}
                                                />
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex gap-4 px-4 py-2 font-mono text-[11px] text-[#A6A397]">
                    <span>↑↓ navigate</span>
                    <span>enter open</span>
                    <span>esc close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}