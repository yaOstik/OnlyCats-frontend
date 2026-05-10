import PawIcon from './PawIcon';
import UserAvatar from './UserAvatar';

export default function HomeFeed({
  feedPosts,
  baseUrl,
  currentUserId,
  currentUsername,
  editingCommentId,
  editCommentText,
  onSetEditCommentText,
  onOpenProfile,
  onLikePost,
  onToggleComments,
  onCommentChange,
  onAddCommentToPost,
  onStartEditing,
  onCancelEditing,
  onSaveEditedComment,
  onDeleteComment,
}) {
  return (
    <div className="w-full space-y-6 md:space-y-8">
      {feedPosts.map((post) => {
        const userHandle = `@${post.author.toLowerCase().replace(/\s+/g, '_')}`;
        const visibleComments = post.isCommentsExpanded ? post.comments : post.comments.slice(-1);

        return (
          <article
            key={post.id}
            className="bg-white mx-3 sm:mx-0 rounded-[28px] sm:rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 w-auto sm:w-full overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onOpenProfile(post.userId)}
              >
                <UserAvatar
                  userId={post.userId}
                  username={post.author}
                  baseUrl={baseUrl}
                  className="w-11 h-11 text-lg group-hover:ring-2 ring-[#d946ef] ring-offset-2 transition-all"
                />
                <div className="leading-tight">
                  <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-[#d946ef] transition-colors">
                    {post.author}
                  </h3>
                  <p className="text-gray-400 text-[13px] font-medium">{userHandle}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-50">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>

            <div
              className="w-full bg-gray-50 relative cursor-pointer sm:px-2"
              onDoubleClick={() => onLikePost(post.id)}
            >
              <img
                src={post.image}
                alt={post.catName}
                className="w-full rounded-[16px] sm:rounded-[24px] object-cover max-h-[600px] shadow-sm"
              />
            </div>

            <div className="px-5 py-3 flex items-center justify-between mt-1">
              <div className="flex gap-4">
                <button
                  onClick={() => onLikePost(post.id)}
                  className={`transition-all active:scale-75 hover:-translate-y-0.5 ${
                    post.hasLiked ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <svg
                    className="w-[30px] h-[30px] drop-shadow-sm"
                    fill={post.hasLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={post.hasLiked ? '0' : '2'}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => onToggleComments(post.id)}
                  className={`transition-all active:scale-75 hover:-translate-y-0.5 ${
                    post.showCommentInput ? 'text-[#d946ef]' : 'text-gray-300 hover:text-[#d946ef]'
                  }`}
                >
                  <svg
                    className="w-[30px] h-[30px] drop-shadow-sm"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-5 pb-4 flex flex-col gap-2">
              <p className="font-black text-gray-900 text-[15px] flex items-center gap-1">
                {post.likes} {post.likes === 1 ? 'star' : 'stars'} <span className="text-yellow-400">★</span>
              </p>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[17px] text-gray-900 tracking-tight">{post.catName}</span>
                  {post.age && post.age !== 'Age unknown' && (
                    <span className="bg-white border border-fuchsia-100 text-[#d946ef] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">
                      {post.age}
                    </span>
                  )}
                </div>
                {post.description && (
                  <p className="text-gray-700 text-[14px] leading-relaxed">{post.description}</p>
                )}
              </div>
            </div>

            <div
              className={`px-5 pb-5 space-y-4 ${
                post.isCommentsExpanded ? 'max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-3' : ''
              }`}
            >
              {post.comments.length > 1 && !post.isCommentsExpanded && (
                <button
                  onClick={() => onToggleComments(post.id)}
                  className="text-[13px] font-bold text-gray-400 hover:text-[#d946ef] transition-colors uppercase tracking-wider"
                >
                  View all {post.comments.length} comments
                </button>
              )}

              {visibleComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <UserAvatar
                    userId={comment.userId}
                    username={comment.author}
                    baseUrl={baseUrl}
                    className="w-9 h-9 text-[13px] shrink-0 mt-0.5"
                  />

                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-[20px] rounded-tl-sm px-4 py-3 relative border border-transparent group-hover:border-gray-100 transition-colors">
                      <span
                        className="font-bold text-gray-900 text-[13px] block mb-1 cursor-pointer hover:text-[#d946ef] transition-colors"
                        onClick={() => onOpenProfile(comment.userId)}
                      >
                        {comment.author}
                      </span>

                      {editingCommentId === comment.id ? (
                        <div className="mt-1 flex flex-col items-end gap-2 w-full">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(event) => onSetEditCommentText(event.target.value)}
                            className="w-full border-b-2 border-[#d946ef] outline-none text-sm py-1 bg-transparent font-medium"
                          />
                          <div className="flex gap-3 mt-1">
                            <button
                              onClick={onCancelEditing}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => onSaveEditedComment(post.id)}
                              className="text-xs font-black text-[#d946ef] hover:text-[#c026d3]"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-[14px] leading-snug break-words font-medium">
                          {comment.text}
                        </span>
                      )}
                    </div>

                    {comment.isMine && editingCommentId !== comment.id && (
                      <div className="flex items-center gap-4 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onStartEditing(comment)}
                          className="text-[11px] font-bold text-gray-400 hover:text-[#d946ef]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteComment(post.id, comment.id)}
                          className="text-[11px] font-bold text-gray-400 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {post.showCommentInput && (
              <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50">
                <form onSubmit={(event) => onAddCommentToPost(event, post.id)} className="flex items-center gap-3">
                  <UserAvatar
                    userId={currentUserId}
                    username={currentUsername}
                    baseUrl={baseUrl}
                    className="w-8 h-8 text-[12px] shrink-0"
                  />
                  <input
                    type="text"
                    autoFocus
                    value={post.newCommentText}
                    onChange={(event) => onCommentChange(post.id, event.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 text-[15px] font-medium outline-none placeholder-gray-400 bg-transparent"
                  />
                  <button
                    type="submit"
                    className={`text-[15px] font-black tracking-wide ${
                      post.newCommentText.trim() ? 'text-[#d946ef]' : 'text-fuchsia-200'
                    }`}
                  >
                    Post
                  </button>
                </form>
              </div>
            )}
          </article>
        );
      })}

      <div className="text-center py-6 pb-10">
        <div className="text-gray-300 flex justify-center mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-[12px] flex items-center justify-center text-gray-300 shadow-sm shrink-0">
            <PawIcon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-gray-400 font-bold text-[15px]">You are all caught up.</p>
      </div>
    </div>
  );
}

