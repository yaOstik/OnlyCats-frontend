import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStoredToken, getStoredUsername } from '../utils/authStorage';
import { buildTopCats, formatComment, formatPost } from '../utils/feed';

export function useFeedPosts({ baseUrl, isLoggedIn, getMyUserId, onAuthRequired, onOutOfLikes }) {
  const [feedPosts, setFeedPosts] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchFeedPosts = useCallback(async () => {
    try {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [postsResponse, likesResponse] = await Promise.all([
        fetch(`${baseUrl}/posts/`),
        token ? fetch(`${baseUrl}/likes/me`, { headers }) : Promise.resolve(null),
      ]);

      if (!postsResponse.ok) throw new Error('Failed to load feed');

      const postsData = await postsResponse.json();

      let likedPostIds = [];
      if (likesResponse && likesResponse.ok) {
        const likesData = await likesResponse.json();
        likedPostIds = likesData.post_ids || [];
      }

      const commentsPromises = postsData.map((post) =>
        fetch(`${baseUrl}/comments/${post.id}`)
          .then((response) => (response.ok ? response.json() : []))
          .catch(() => []),
      );
      const commentsByPost = await Promise.all(commentsPromises);

      const myUserId = getMyUserId();
      const myUsername = getStoredUsername();

      const formattedPosts = postsData
        .map((post, index) =>
          formatPost(post, commentsByPost[index], likedPostIds, myUserId, myUsername),
        )
        .sort((left, right) => Number(right.id) - Number(left.id));

      setFeedPosts(formattedPosts);
    } catch (error) {
      console.error('Feed loading error:', error);
    }
  }, [baseUrl, getMyUserId]);

  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts, isLoggedIn]);

  const handleLikePost = useCallback(
    async (postId) => {
      if (!isLoggedIn) {
        onAuthRequired();
        return;
      }

      const targetPost = feedPosts.find((post) => post.id === postId);
      if (!targetPost) return;

      const isLikingNow = !targetPost.hasLiked;

      setFeedPosts((posts) =>
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasLiked: isLikingNow,
                likes: isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1),
              }
            : post,
        ),
      );

      try {
        const token = getStoredToken();
        if (!token) throw new Error('No token');

        const response = await fetch(isLikingNow ? `${baseUrl}/likes/` : `${baseUrl}/likes/${postId}`, {
          method: isLikingNow ? 'POST' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: isLikingNow ? JSON.stringify({ post_id: Number(postId) }) : null,
        });

        if (!response.ok) {
          if (response.status === 403) onOutOfLikes();
          if (response.status === 401) alert('Your session expired. Please log in again.');
          throw new Error(`Like request failed: ${response.status}`);
        }
      } catch {
        setFeedPosts((posts) =>
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  hasLiked: !isLikingNow,
                  likes: !isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1),
                }
              : post,
          ),
        );
      }
    },
    [baseUrl, feedPosts, isLoggedIn, onAuthRequired, onOutOfLikes],
  );

  const toggleComments = useCallback(
    async (postId) => {
      const post = feedPosts.find((item) => item.id === postId);
      if (!post) return;

      const willExpand = !post.isCommentsExpanded;

      setFeedPosts((posts) =>
        posts.map((item) =>
          item.id === postId
            ? { ...item, showCommentInput: willExpand, isCommentsExpanded: willExpand }
            : item,
        ),
      );

      if (!willExpand) return;

      try {
        const response = await fetch(`${baseUrl}/comments/${postId}`);
        if (!response.ok) return;

        const data = await response.json();
        const myUserId = getMyUserId();
        const myUsername = getStoredUsername();

        setFeedPosts((posts) =>
          posts.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  comments: data.map((comment) => formatComment(comment, myUserId, myUsername)),
                }
              : item,
          ),
        );
      } catch (error) {
        console.error('Comment loading error:', error);
      }
    },
    [baseUrl, feedPosts, getMyUserId],
  );

  const handleCommentChange = useCallback((postId, text) => {
    setFeedPosts((posts) =>
      posts.map((post) => (post.id === postId ? { ...post, newCommentText: text } : post)),
    );
  }, []);

  const handleAddCommentToPost = useCallback(
    async (event, postId) => {
      event.preventDefault();
      if (!isLoggedIn) {
        onAuthRequired();
        return;
      }

      const post = feedPosts.find((item) => item.id === postId);
      if (!post) return;
      const text = post.newCommentText.trim();
      if (!text) return;

      const tempId = Date.now();
      const myUserId = getMyUserId();
      const myUsername = getStoredUsername() || 'You';

      setFeedPosts((posts) =>
        posts.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: [
                  ...item.comments,
                  { id: tempId, userId: myUserId, author: myUsername, text, isMine: true },
                ],
                newCommentText: '',
                isCommentsExpanded: true,
              }
            : item,
        ),
      );

      try {
        const token = getStoredToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${baseUrl}/comments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ post_id: postId, content: text }),
        });

        if (!response.ok) throw new Error('Failed to post comment');
        const savedComment = await response.json();

        setFeedPosts((posts) =>
          posts.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  comments: item.comments.map((comment) =>
                    comment.id === tempId
                      ? {
                          ...comment,
                          id: savedComment.id,
                          author:
                            savedComment.author_username ||
                            savedComment.authorUsername ||
                            savedComment.username ||
                            myUsername,
                        }
                      : comment,
                  ),
                }
              : item,
          ),
        );
      } catch {
        setFeedPosts((posts) =>
          posts.map((item) =>
            item.id === postId
              ? { ...item, comments: item.comments.filter((comment) => comment.id !== tempId) }
              : item,
          ),
        );
      }
    },
    [baseUrl, feedPosts, getMyUserId, isLoggedIn, onAuthRequired],
  );

  const deleteComment = useCallback(
    async (postId, commentId) => {
      if (!window.confirm('Delete this comment?')) return;

      const post = feedPosts.find((item) => item.id === postId);
      if (!post) return;

      const commentToDelete = post.comments.find((comment) => comment.id === commentId);
      if (!commentToDelete) return;

      setFeedPosts((posts) =>
        posts.map((item) =>
          item.id === postId
            ? { ...item, comments: item.comments.filter((comment) => comment.id !== commentId) }
            : item,
        ),
      );

      try {
        const token = getStoredToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${baseUrl}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Delete failed');
      } catch {
        setFeedPosts((posts) =>
          posts.map((item) =>
            item.id === postId
              ? { ...item, comments: [...item.comments, commentToDelete] }
              : item,
          ),
        );
      }
    },
    [baseUrl, feedPosts],
  );

  const startEditing = useCallback((comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  const saveEditedComment = useCallback(
    async (postId) => {
      if (!editingCommentId || !editCommentText.trim()) return;

      const post = feedPosts.find((item) => item.id === postId);
      if (!post) return;
      const originalComment = post.comments.find((comment) => comment.id === editingCommentId);
      if (!originalComment) return;

      const currentEditId = editingCommentId;
      const nextText = editCommentText.trim();

      setFeedPosts((posts) =>
        posts.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: item.comments.map((comment) =>
                  comment.id === currentEditId ? { ...comment, text: nextText } : comment,
                ),
              }
            : item,
        ),
      );

      setEditingCommentId(null);
      setEditCommentText('');

      try {
        const token = getStoredToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${baseUrl}/comments/${currentEditId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: nextText }),
        });
        if (!response.ok) throw new Error('Update failed');
      } catch {
        setFeedPosts((posts) =>
          posts.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  comments: item.comments.map((comment) =>
                    comment.id === currentEditId ? { ...comment, text: originalComment.text } : comment,
                  ),
                }
              : item,
          ),
        );
      }
    },
    [baseUrl, editCommentText, editingCommentId, feedPosts],
  );

  const topCats = useMemo(() => buildTopCats(feedPosts), [feedPosts]);

  return {
    feedPosts,
    topCats,
    editingCommentId,
    editCommentText,
    setEditCommentText,
    fetchFeedPosts,
    handleLikePost,
    toggleComments,
    handleCommentChange,
    handleAddCommentToPost,
    deleteComment,
    startEditing,
    cancelEditing,
    saveEditedComment,
  };
}

