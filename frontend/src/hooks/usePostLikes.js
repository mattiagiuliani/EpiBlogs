import { useCallback, useEffect, useState } from 'react';
import { getLikes, toggleLike } from '../assets/api.js';

/**
 * Manages the like state for a single post.
 *
 * @param {string} postId        - MongoDB ObjectId of the post.
 * @param {object|null} currentUser - Authenticated author ({ _id, email }).
 */
export const usePostLikes = (postId, currentUser) => {
    const [count, setCount] = useState(0);
    const [likedByMe, setLikedByMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!postId) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        getLikes(postId)
            .then((data) => {
                if (!cancelled) {
                    setCount(data.count ?? 0);
                    setLikedByMe(data.likedByMe ?? false);
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message ?? 'Error fetching likes');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [postId]);

    /**
     * Optimistically toggles the like, rolling back on failure.
     * No-op when the user is not authenticated or a toggle is already in flight.
     */
    const toggle = useCallback(async () => {
        if (!currentUser || toggling) return;

        // Optimistic update
        const wasLiked = likedByMe;
        setLikedByMe(!wasLiked);
        setCount((c) => c + (wasLiked ? -1 : 1));
        setToggling(true);
        setError(null);

        try {
            const data = await toggleLike(postId);
            setCount(data.count ?? 0);
            setLikedByMe(data.likedByMe ?? false);
        } catch (err) {
            // Rollback
            setLikedByMe(wasLiked);
            setCount((c) => c + (wasLiked ? 1 : -1));
            setError(err?.message ?? 'Error toggling like');
        } finally {
            setToggling(false);
        }
    }, [postId, currentUser, likedByMe, toggling]);

    return { count, likedByMe, loading, toggling, error, toggle };
};
