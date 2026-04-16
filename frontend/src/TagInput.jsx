import { useState } from "react";

// Mirrors the backend normalizeTag logic so chips display exactly
// what will be stored in the database.
const normalizeTag = (tag) =>
  String(tag)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

const TagInput = ({ tags = [], onChange }) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const normalized = normalizeTag(inputValue);
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInputValue("");
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="tag-input-wrapper">
      {tags.length > 0 ? (
        <div className="tag-chips" role="list" aria-label="Added tags">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip" role="listitem">
              <span className="tag-chip-label">#{tag}</span>
              <button
                type="button"
                className="tag-chip-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        className="form-control"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a tag and press Enter…"
        aria-label="Add tag"
      />
      <span className="form-text">
        Press Enter to add. Tags are normalized to lowercase slugs.
      </span>
    </div>
  );
};

export default TagInput;
