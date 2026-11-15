import { CalendarDays, Clock, ExternalLink, MapPin } from 'lucide-react';

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function AnnouncementPanel({ items, loading = false }) {
    if (loading) {
        return <p className="font-mono text-xs text-[#A6A397]">Loading notes…</p>;
    }

    if (items.length === 0) {
        return (
            <p className="text-sm leading-6 text-[#A6A397]">
                The journal is empty. New notes from the workshop will be published here.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {items.map((item) => (
                <article key={item._id} className="group">
                    <div className="relative overflow-hidden bg-[#252820]">
                        {item.bannerUrl ? (
                            <img
                                src={item.bannerUrl}
                                alt=""
                                loading="lazy"
                                className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] xl:aspect-[4/5]"
                            />
                        ) : (
                            <div className="flex aspect-[3/2] items-end bg-[#1D201A] p-4 xl:aspect-[4/5]">
                                <span className="font-heading text-6xl leading-none text-[#34372D]">FL</span>
                            </div>
                        )}
                        <span className="absolute bottom-3 left-3 bg-[#F0784B] px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-[#11120F] uppercase">
                            {item.type}
                        </span>
                    </div>

                    <h3 className="mt-3 font-heading text-[1.35rem] leading-[1.15] tracking-[-0.02em]">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#A6A397]">{item.description}</p>

                    {item.createdAt && (
                        <time className="mt-3 block font-mono text-[11px] text-[#A6A397]" dateTime={item.createdAt}>
                            {formatDate(item.createdAt)}
                        </time>
                    )}

                    {item.eventDate && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-[#A6A397]">
                            <CalendarDays className="size-3.5" />
                            {new Date(item.eventDate).toLocaleString()}
                        </p>
                    )}
                    {item.location && (
                        <p className="mt-1 flex items-center gap-2 text-xs text-[#A6A397]">
                            <MapPin className="size-3.5" />
                            {item.location}
                        </p>
                    )}
                    {item.deadline && (
                        <p className="mt-1 flex items-center gap-2 text-xs text-[#A6A397]">
                            <Clock className="size-3.5" />
                            Deadline {formatDate(item.deadline)}
                        </p>
                    )}
                    {item.link && (
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm text-[#C7F36B] hover:underline"
                        >
                            Open link <ExternalLink className="size-3.5" />
                        </a>
                    )}
                </article>
            ))}
        </div>
    );
}
