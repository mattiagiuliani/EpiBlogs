import { useEffect, useRef, useState } from 'react';

/**
 * Debounced search input.
 * Calls onChange 300 ms after the user stops typing.
 */
const SearchBar = ({ value, onChange, placeholder = 'Search posts…' }) => {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  // Keep local state in sync when the parent resets the value
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    setLocal('');
    onChange('');
  };

  return (
    <div className="search-input-wrapper">
      <input
        type="search"
        className="form-control"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
        aria-label={placeholder}
      />
      {local && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
