function HighlightText({ text, query }) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escaped})`, 'ig');
  const normalizedQuery = query.toLowerCase();
  return text.split(pattern).map((chunk, index) =>
    chunk.toLowerCase() === normalizedQuery ? (
      <mark key={`${chunk}-${index}`} className="bg-fuchsia-100 text-[#d946ef] rounded px-1">
        {chunk}
      </mark>
    ) : (
      <span key={`${chunk}-${index}`}>{chunk}</span>
    ),
  );
}

export default function SearchModal({
  isOpen,
  query,
  onQueryChange,
  onClose,
  accounts,
  posts,
  showAllAccounts,
  onToggleAccountsView,
  onOpenProfile,
}) {
  if (!isOpen) return null;

  const visibleAccounts = showAllAccounts ? accounts : accounts.slice(0, 3);

  return (
    <div className="fixed inset-0 z-[1200] bg-gray-900/45 backdrop-blur-sm p-4 sm:p-8">
      <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-fuchsia-100 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-fuchsia-50 px-4 sm:px-6 py-4">
          <div className="text-[#d946ef]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
                d="M21 21l-5.2-5.2m1.7-5.3a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search cats, posts, and people..."
            className="flex-1 bg-transparent text-[15px] font-semibold text-gray-900 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-fuchsia-50 hover:text-[#d946ef]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-500">
                Popular Accounts
              </h3>
              {accounts.length > 3 && (
                <button
                  type="button"
                  onClick={onToggleAccountsView}
                  className="text-xs font-black text-[#d946ef] hover:text-[#c026d3]"
                >
                  {showAllAccounts ? 'Show less' : 'View all'}
                </button>
              )}
            </div>

            {visibleAccounts.length === 0 ? (
              <p className="text-sm font-medium text-gray-400">No matching accounts.</p>
            ) : (
              <div className="space-y-2">
                {visibleAccounts.map((account) => (
                  <button
                    key={`account-${account.userId}`}
                    type="button"
                    onClick={() => onOpenProfile(account.userId)}
                    className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:border-fuchsia-200 hover:bg-fuchsia-50/40"
                  >
                    <p className="text-[15px] font-black text-gray-900">
                      <HighlightText text={account.author} query={query} />
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">
                      {account.postsCount} posts · {account.totalLikes} stars
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-[13px] font-black uppercase tracking-wider text-gray-500">
              Similar Posts
            </h3>
            {posts.length === 0 ? (
              <p className="text-sm font-medium text-gray-400">No similar posts found.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={`post-${post.id}`}
                    className="rounded-2xl border border-gray-100 p-3 sm:p-4 transition-colors hover:border-fuchsia-200"
                  >
                    <div className="flex gap-3">
                      <img
                        src={post.image}
                        alt={post.catName}
                        className="h-14 w-14 rounded-xl object-cover bg-fuchsia-50"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-black text-gray-900 truncate">
                          <HighlightText text={post.catName} query={query} />
                        </p>
                        <p className="text-[12px] font-semibold text-gray-500 truncate">
                          by {post.author}
                        </p>
                        <p className="mt-1 text-[12px] text-gray-600 line-clamp-2">
                          <HighlightText text={post.description || 'No description'} query={query} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
