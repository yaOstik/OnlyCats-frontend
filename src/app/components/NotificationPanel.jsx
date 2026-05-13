function NotificationIcon({ type }) {
  if (type === 'comment') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.26-.95L3 20l1.4-3.72C3.5 15.04 3 13.57 3 12c0-4.42 4.03-8 9-8s9 3.58 9 8z"
        />
      </svg>
    );
  }

  if (type === 'follow') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M12 4v16m8-8H4M16 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.05 2.93a1 1 0 011.9 0l1.52 4.67a1 1 0 00.95.69h4.91c.97 0 1.37 1.24.59 1.81l-3.98 2.89a1 1 0 00-.36 1.12l1.52 4.67c.3.92-.75 1.69-1.54 1.12l-3.98-2.89a1 1 0 00-1.17 0l-3.98 2.89c-.78.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 00-.36-1.12L2.08 10.1c-.78-.57-.38-1.81.59-1.81h4.91a1 1 0 00.95-.69l1.52-4.67z" />
    </svg>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
}

export default function NotificationPanel({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
  placement = 'desktop',
  isDarkTheme = false,
}) {
  if (!isOpen) return null;

  const placementClass =
    placement === 'mobile'
      ? 'top-[74px] right-3 left-3'
      : 'top-[92px] right-8 w-[380px] max-w-[calc(100vw-2rem)]';
  const panelClass = isDarkTheme
    ? 'rounded-[24px] border border-[#364262] bg-[#182033]/95 p-4 shadow-[0_20px_52px_rgba(2,6,18,0.64)]'
    : 'rounded-[24px] border border-fuchsia-100 bg-white p-4 shadow-[0_18px_55px_rgba(13,17,34,0.28)]';

  return (
    <div className={`fixed z-[2400] ${placementClass}`}>
      <div className={panelClass}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkTheme ? 'text-[#dbe5ff]' : 'text-gray-700'}`}>
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className={`text-xs font-black transition-colors ${
                isDarkTheme ? 'text-[#cc99f7] hover:text-[#dfbbff]' : 'text-[#d946ef] hover:text-[#c026d3]'
              }`}
            >
              Mark all
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-1 transition-colors ${
                isDarkTheme
                  ? 'text-[#9aa8ca] hover:bg-[#2b3550] hover:text-[#d6b2fa]'
                  : 'text-gray-400 hover:bg-fuchsia-50 hover:text-[#d946ef]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <p
            className={`rounded-2xl px-3 py-4 text-center text-sm font-semibold ${
              isDarkTheme ? 'bg-[#27314a] text-[#aab6d5]' : 'bg-fuchsia-50 text-gray-500'
            }`}
          >
            No new activity yet.
          </p>
        ) : (
          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => {
                  if (!notification.read) onMarkRead?.(notification.id);
                }}
                className={`rounded-2xl border px-3 py-2.5 ${
                  notification.read
                    ? isDarkTheme
                      ? 'border-[#33405f] bg-[#1d263a]'
                      : 'border-gray-100 bg-white'
                    : isDarkTheme
                      ? 'border-[#48567b] bg-[#24314b]'
                      : 'border-fuchsia-100 bg-fuchsia-50/40'
                } w-full text-left`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 rounded-xl p-2 ${
                      isDarkTheme ? 'bg-[#1a2234] text-[#cc9af8]' : 'bg-white text-[#d946ef] shadow-sm'
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-semibold leading-relaxed break-words ${
                        isDarkTheme ? 'text-[#d2dbf4]' : 'text-gray-700'
                      }`}
                    >
                      {notification.text}
                    </p>
                    <p
                      className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${
                        isDarkTheme ? 'text-[#8f9ec2]' : 'text-gray-400'
                      }`}
                    >
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
