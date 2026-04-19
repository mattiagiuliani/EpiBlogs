import { useMemo } from "react";

const hashString = (value) => {
  let hash = 0;
  const input = String(value ?? "");
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const toSeedPart = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

const buildFallbackCoverUrl = ({ title, category }) => {
  const seedBase = toSeedPart(`${category || "tech"}-${title || "post"}`) || "epiblogs-post";
  const seedHash = (hashString(`${title}|${category}`) % 900000) + 100000;
  const seed = `${seedBase}-${seedHash}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
};

const PostCover = ({ cover, title, category, style, className = "post-cover" }) => {
  const fallbackUrl = useMemo(
    () => buildFallbackCoverUrl({ title, category }),
    [title, category]
  );

  const currentUrl = cover || fallbackUrl;

  if (!currentUrl) return null;

  return (
    <div className={className} style={style} role="img" aria-label={`Cover image for ${title}`}>
      <img
        src={currentUrl}
        alt=""
        className="post-cover-image"
        loading="lazy"
        decoding="async"
        onError={(event) => {
          if (event.currentTarget.src !== fallbackUrl) {
            event.currentTarget.src = fallbackUrl;
          }
        }}
      />
    </div>
  );
};

export default PostCover;
