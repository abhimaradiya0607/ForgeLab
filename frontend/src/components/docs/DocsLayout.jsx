import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DocSection from "./DocSection";
import { DOCS_SECTIONS } from "./docsData";

export default function DocsLayout() {
    const [active, setActive] = useState(DOCS_SECTIONS[0].id);

    // Highlight the sidebar link for the section currently in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: "-30% 0px -60% 0px" }
        );

        DOCS_SECTIONS.forEach((section) => {
            const node = document.getElementById(section.id);
            if (node) observer.observe(node);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-[#11120F] text-[#EDE9DF]">
            <header className="sticky top-0 z-30 border-b border-[#33342D] bg-[#11120F]">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link to="/" className="font-heading text-lg tracking-tight">
                        ForgeLab <span className="font-mono text-xs text-[#A6A397]">/ docs</span>
                    </Link>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-[#A6A397] hover:text-[#EDE9DF]"
                    >
                        <ArrowLeft className="size-4" />
                        Back to workspace
                    </Link>
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <nav className="sticky top-24 space-y-1 py-10">
                        <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-[#A6A397]">
                            ON THIS PAGE
                        </p>
                        {DOCS_SECTIONS.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                                    active === section.id
                                        ? "border-[#C7F36B] text-[#C7F36B]"
                                        : "border-transparent text-[#A6A397] hover:text-[#EDE9DF]"
                                }`}
                            >
                                {section.label}
                            </a>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 pb-24">
                    <div className="border-b border-[#33342D] py-12">
                        <p className="font-mono text-[11px] tracking-[0.2em] text-[#C7F36B]">
                            DEVELOPER DOCS
                        </p>
                        <h1 className="mt-3 font-heading text-5xl tracking-tight">ForgeLab documentation</h1>
                        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#A6A397]">
                            Set up the CLI, push code, and browse it on the website. Follow the sections in order the first time.
                        </p>
                    </div>

                    {DOCS_SECTIONS.map((section) => (
                        <DocSection key={section.id} section={section} />
                    ))}
                </main>
            </div>
        </div>
    );
}