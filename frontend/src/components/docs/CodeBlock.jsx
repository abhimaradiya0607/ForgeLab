import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ code, language = "bash" }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="group relative my-4 border border-[#33342D] bg-[#0B0C09]">
            <div className="flex items-center justify-between border-b border-[#33342D] px-4 py-2">
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#A6A397]">
                    {language.toUpperCase()}
                </span>
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#A6A397] transition-colors hover:text-[#C7F36B]"
                >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-sm leading-6 text-[#EDE9DF]">
                <code>{code}</code>
            </pre>
        </div>
    );
}