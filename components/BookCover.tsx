import Image from "next/image";

interface BookCoverProps {
  title: string;
  author: string;
  color: string;
  imageUrl?: string;
  className?: string;
}

/**
 * Bokomslag: viser opplastet bilde når det finnes, ellers et generert
 * omslag fra tittel/forfatter og farge.
 */
export default function BookCover({
  title,
  author,
  color,
  imageUrl,
  className = "",
}: BookCoverProps) {
  if (imageUrl) {
    return (
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-border ${className}`}
      >
        <Image
          src={imageUrl}
          alt={`${title} av ${author}`}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 300px"
        />
      </div>
    );
  }

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
