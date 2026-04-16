import { useState } from "react";

const SearchPost = ({
  onSearch,
  categories = [],
  selectedCategory = "",
  onCategoryChange,
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    onCategoryChange?.("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="search-bar">
        {categories.length > 0 ? (
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by title..."
          aria-label="Search posts by title"
        />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>
          Clear
        </button>
      </div>
    </form>
  );
};

export default SearchPost;
