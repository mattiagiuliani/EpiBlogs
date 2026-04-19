import { useCallback, useEffect, useState } from 'react';
import { listComments, createComment } from '../assets/api.js';

/**
 * Manages the comments for a single post.
 *
 * @param {string} postId        - MongoDB ObjectId of the post.
 * @param {object|null} currentUser - Authenticated author ({ _id, email }).
 */
export const usePostComments = (postId, currentUser) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!postId) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        listComments(postId)
            .then((data) => {
                if (!cancelled) setComments(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message ?? 'Error fetching comments');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [postId]);

    /**
     * Optimistically adds a comment, rolling back on network failure.
     * @param {string} text - Comment body.
     */
    const addComment = useCallback(
        async (text) => {
            if (!text?.trim() || !currentUser) return;

            // Optimistic placeholder — uses a temp id so React keys stay stable.
            const tempId = `temp-${Date.now()}`;
            const optimistic = {
                _id: tempId,
                author: { _id: currentUser._id, email: currentUser.email },
                comment: text.trim(),
                createdAt: new Date().toISOString(),
            };

            setComments((prev) => [...prev, optimistic]);
            setSubmitting(true);
            setError(null);

            try {
                const saved = await createComment(postId, text.trim());
                // Replace the placeholder with the persisted document from the server.
                setComments((prev) =>
                    prev.map((c) => (c._id === tempId ? saved : c))
                );
            } catch (err) {
                // Rollback: remove the optimistic entry.
                setComments((prev) => prev.filter((c) => c._id !== tempId));
                setError(err?.message ?? 'Error creating comment');
            } finally {
                setSubmitting(false);
            }
        },
        [postId, currentUser]
    );

    return { comments, loading, error, submitting, addComment };
};
