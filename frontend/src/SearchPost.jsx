import { useState } from "react";
import { Button, Form } from "react-bootstrap";

const SearchPost = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <div className="search-bar">
        <Form.Control
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by title..."
          aria-label="Search posts by title"
        />
        <Button type="submit" variant="outline-dark">
          Search
        </Button>
        <Button
          type="button"
          variant="light"
          onClick={() => {
            setQuery("");
            onSearch("");
          }}
        >
          Clear
        </Button>
      </div>
    </Form>
  );
};

export default SearchPost;
