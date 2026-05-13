export default function PostActionsMenu({
  isOpen,
  isOwner,
  onToggle,
  onReport,
  onDelete,
  onClose,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={onClose}
            aria-label="Close post menu"
          />
          <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-fuchsia-100 bg-white p-1.5 shadow-xl">
            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-fuchsia-50 hover:text-[#d946ef]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 3v18m0-11h10l-2 3 2 3H5"
                />
              </svg>
              Report Post
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={onDelete}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 7h12m-9 0V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12h6l1-12"
                  />
                </svg>
                Delete Post
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
