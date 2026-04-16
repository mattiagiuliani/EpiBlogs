import { useState } from 'react';

// Mirrors backend normalizeTag so the slugs we send match what is stored.
const normalizeTag = (tag) =>
  String(tag)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Multi-tag filter input.
 * Renders selected tags as removable chips inside an inline text box.
 * Press Enter or comma to add the current input as a tag.
 * Press Backspace on an empty input to remove the last tag.
 *
 * Props:
 *   tags    string[]   current active tag filters
 *   onChange  fn(string[])  called with the new tags array
 */
const TagFilter = ({ tags, onChange }) => {
  const [input, setInput] = useState('');

  const addTag = (raw) => {
    const normalized = normalizeTag(raw);
    if (!normalized || tags.includes(normalized)) {
      setInput('');
      return;
    }
    onChange([...tags, normalized]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
      return;
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="tag-filter">
      {/* Chip box + inline input */}
      <div
        className="tag-filter__inner"
        onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="tag-chip tag-chip--active">
            #{tag}
            <button
              type="button"
              className="tag-chip__remove"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-filter__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Filter by tag…' : 'Add tag…'}
          aria-label="Add tag filter"
        />
      </div>

      {tags.length > 0 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default TagFilter;
