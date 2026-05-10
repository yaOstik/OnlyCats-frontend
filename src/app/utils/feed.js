import { DEFAULT_CAT_IMAGE } from '../constants';

export function formatComment(comment, myUserId, myUsername) {
  const isMine = String(comment.user_id) === String(myUserId);
  const author =
    comment.author_username ||
    comment.authorUsername ||
    comment.username ||
    (isMine ? myUsername || 'You' : `User ${comment.user_id}`);

  return {
    id: comment.id,
    userId: comment.user_id,
    author,
    text: comment.content,
    isMine,
  };
}

export function formatPost(post, rawComments, likedPostIds, myUserId, myUsername) {
  const likedSet = new Set((likedPostIds || []).map((id) => String(id)));
  const postAuthor =
    post.author_username ||
    post.authorUsername ||
    post.username ||
    post.owner?.username ||
    'Incognito Cat';

  return {
    id: post.id,
    userId: post.user_id || post.userId || post.owner?.id,
    author: postAuthor,
    catName: post.title || 'Fluffy',
    age: post.cat_age,
    image: post.image_url || DEFAULT_CAT_IMAGE,
    description: post.content || '',
    likes: post.rating_score || post.likes_count || post.likes || 0,
    hasLiked: likedSet.has(String(post.id)),
    createdAt: post.created_at || new Date().toISOString(),
    comments: (rawComments || []).map((comment) => formatComment(comment, myUserId, myUsername)),
    newCommentText: '',
    showCommentInput: false,
    isCommentsExpanded: false,
  };
}

export function buildTopCats(feedPosts) {
  return [...feedPosts]
    .filter((post) => post.likes > 0)
    .sort((left, right) => right.likes - left.likes)
    .slice(0, 3)
    .map((post, index) => {
      let style = { color: 'text-gray-500', bg: 'bg-gray-100' };
      if (index === 0) style = { color: 'text-yellow-700', bg: 'bg-yellow-100' };
      if (index === 1) style = { color: 'text-gray-700', bg: 'bg-gray-200' };
      if (index === 2) style = { color: 'text-orange-800', bg: 'bg-orange-100' };
      return { ...post, rank: index + 1, style };
    });
}

