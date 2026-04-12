import { useState } from "react";

const SearchPost = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="search-bar">
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
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setQuery("");
            onSearch("");
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default SearchPost;
