import { useState, useEffect, useRef, useCallback } from 'react';
import { PREDEFINED_TAGS, AUTOCOMPLETE_DEBOUNCE_MS, MAX_POPULAR_TAGS } from './constants/tags.js';

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
 * Multi-tag filter with autocomplete suggestions.
 * Features:
 *   - Selected tags as removable chips inside an inline text box
 *   - Press Enter or comma to add a tag; Backspace on empty input to remove last tag
 *   - Autocomplete dropdown showing suggestions while typing
 *   - "Most Popular" preset chips from backend data (top N by count)
 *   - Predefined tags as fallback suggestions
 *
 * Props:
 *   tags    string[]   current active tag filters
 *   presets  {tag, count}[]  tags from backend with popularity counts
 *   onChange  fn(string[])  called with the new tags array
 */
const TagFilter = ({ tags, presets = [], onChange }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  // Compute the list of all available suggestions (backend tags + predefined fallback)
  const allSuggestions = useCallback(() => {
    const tagSet = new Set();

    // Add backend presets (sorted by count if available)
    presets.forEach((item) => {
      const normalized = normalizeTag(item.tag || item);
      if (normalized && !tags.includes(normalized)) {
        tagSet.add(normalized);
      }
    });

    // Add predefined tags as fallback
    PREDEFINED_TAGS.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (normalized && !tags.includes(normalized)) {
        tagSet.add(normalized);
      }
    });

    return Array.from(tagSet);
  }, [presets, tags]);

  // Filter suggestions based on current input
  const filteredSuggestions = useCallback(() => {
    const inputNormalized = normalizeTag(input);
    if (!inputNormalized) return [];

    return allSuggestions().filter((tag) =>
      tag.includes(inputNormalized)
    ).slice(0, 10); // Limit to 10 suggestions
  }, [input, allSuggestions]);

  // Debounced handler to update suggestions dropdown while typing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer to update suggestions
    debounceTimer.current = setTimeout(() => {
      const filtered = filteredSuggestions();
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0 && value.trim().length > 0);
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const addTag = (raw) => {
    const normalized = normalizeTag(raw);
    if (!normalized || tags.includes(normalized)) {
      setInput('');
      setShowDropdown(false);
      return;
    }
    onChange([...tags, normalized]);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const togglePresetTag = (rawTag) => {
    const normalized = normalizeTag(rawTag);
    if (!normalized) return;

    if (tags.includes(normalized)) {
      removeTag(normalized);
      return;
    }

    onChange([...tags, normalized]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
      return;
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Get most popular tags from presets for the preset chips section
  const mostPopularTags = presets
    .slice(0, MAX_POPULAR_TAGS)
    .filter((item) => {
      const normalized = normalizeTag(item.tag || item);
      return normalized && !tags.includes(normalized);
    });

  return (
    <div className="tag-filter" ref={containerRef}>
      {/* Most Popular Tags Section */}
      {mostPopularTags.length > 0 && (
        <div className="tag-filter__section">
          <div className="tag-filter__label">Most Popular</div>
          <div className="tag-chips tag-chips--popular" role="list" aria-label="Popular tags">
            {mostPopularTags.map((item) => {
              const tag = item.tag || item;
              const normalized = normalizeTag(tag);
              const count = item.count || 0;

              return (
                <button
                  key={normalized}
                  type="button"
                  className="tag-chip tag-chip--preset"
                  onClick={() => togglePresetTag(normalized)}
                  aria-label={`Add tag ${normalized} (${count} posts)`}
                  title={`${count} ${count === 1 ? 'post' : 'posts'}`}
                >
                  <span className="tag-chip-label">#{normalized}</span>
                  {count > 0 && <span className="tag-chip-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Tags + Input Box */}
      <div className="tag-filter__section">
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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (input.trim()) {
                const filtered = filteredSuggestions();
                setSuggestions(filtered);
                setShowDropdown(filtered.length > 0);
              }
            }}
            placeholder={tags.length === 0 ? 'Filter by tag…' : 'Add tag…'}
            aria-label="Add tag filter"
            autoComplete="off"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="tag-filter__dropdown" role="listbox">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="tag-filter__suggestion"
                onClick={() => addTag(suggestion)}
                role="option"
                aria-label={`Add tag ${suggestion}`}
              >
                #{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Button */}
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
