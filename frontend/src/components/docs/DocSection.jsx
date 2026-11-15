import Callout from "./Callout";
import CodeBlock from "./CodeBlock";

// Renders one section from the docs data
export default function DocSection({ section }) {
    return (
        <section id={section.id} className="scroll-mt-24 border-b border-[#33342D] py-10">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#C7F36B]">
                {section.eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-3xl tracking-tight text-[#EDE9DF]">
                {section.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#A6A397]">
                {section.intro}
            </p>

            <div className="mt-6 space-y-8">
                {section.steps.map((step, index) => (
                    <div key={step.title} className="grid gap-3 md:grid-cols-[48px_1fr]">
                        <div className="font-mono text-sm text-[#C7F36B]">
                            {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-[#EDE9DF]">{step.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-[#A6A397]">{step.body}</p>

                            {step.code && <CodeBlock code={step.code} language={step.language} />}
                            {step.note && <Callout tone={step.noteTone}>{step.note}</Callout>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}