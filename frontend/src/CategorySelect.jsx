import { useEffect, useState } from 'react';
import { listCategories } from './assets/api.js';

/**
 * Category dropdown populated from the backend.
 * Uses category.slug as the option value so the parent can pass it
 * directly to the API (?category=<slug>).
 */
const CategorySelect = ({ value, onChange }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <select
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by category"
    >
      <option value="">All categories</option>
      {categories.map((cat) => (
        <option key={cat._id ?? cat.slug} value={cat.slug}>
          {cat.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
