import { useEffect, useState } from "react";
import { apiPaths, fetchJson } from "./assets/api.js";

const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuthors = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(apiPaths.authors, {}, "Error fetching authors");
      setAuthors(result.data ?? []);
    } catch (err) {
      setAuthors([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <span className="eyebrow">People</span>
          <h2 className="section-title mt-2 mb-1">Authors</h2>
          <p className="section-copy mb-0">Browse and manage registered authors.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchAuthors}
          disabled={loading}
          type="button"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="section-state">
          <div className="spinner-sm" role="status" aria-label="Loading authors" />
          <span>Loading authors...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : authors.length === 0 ? (
        <div className="alert alert-info empty-state" role="status">No authors found</div>
      ) : (
        <div className="authors-grid">
          {authors.map((author) => (
            <div className="author-card" key={author._id}>
              <div className="author-header">
                <div className="author-avatar">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={`${author.firstName} ${author.lastName || ""}`.trim()}
                    />
                  ) : (
                    <span>
                      {`${author.firstName?.[0] || ""}${author.lastName?.[0] || ""}`.trim() || "AU"}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="author-name">
                    {author.firstName} {author.lastName}
                  </h3>
                  {author.profile ? (
                    <p className="author-profile">{author.profile}</p>
                  ) : null}
                </div>
              </div>
              <p className="author-email">{author.email}</p>
              {author.birthDate ? (
                <small className="author-birthdate">
                  Born: {new Date(author.birthDate).toLocaleDateString()}
                </small>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AuthorList;
