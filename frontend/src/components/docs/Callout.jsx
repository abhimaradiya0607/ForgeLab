const TONES = {
    info: "border-[#7DD3FC]/40 bg-[#7DD3FC]/5 text-[#7DD3FC]",
    warn: "border-[#F0784B]/40 bg-[#F0784B]/5 text-[#F0784B]",
    tip: "border-[#C7F36B]/40 bg-[#C7F36B]/5 text-[#C7F36B]",
};

export default function Callout({ tone = "info", children }) {
    return (
        <div className={`my-4 border-l-2 px-4 py-3 text-sm leading-6 ${TONES[tone]}`}>
            {children}
        </div>
    );
}