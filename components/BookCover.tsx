interface BookCoverProps {
  title: string;
  author: string;
  color: string;
  className?: string;
}

/** Placeholder book cover rendered from title/author until real photos are wired up. */
export default function BookCover({
  title,
  author,
  color,
  className = "",
}: BookCoverProps) {
  return (
    <div
      className={`flex aspect-[2/3] flex-col justify-between rounded-lg p-3 text-white shadow-inner ${className}`}
      style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
    >
      <p className="text-sm font-bold leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
        {title}
      </p>
      <p className="text-xs opacity-80 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
        {author}
      </p>
    </div>
  );
}
