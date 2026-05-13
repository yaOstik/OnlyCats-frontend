import NotificationPanel from './NotificationPanel';
import ThemeSwitcher from './ThemeSwitcher';

function BackButton({ onClick, isDarkTheme }) {
  const toneClass = isDarkTheme
    ? 'text-[#a7b2d1] hover:text-[#d4b2fa] bg-[#1b2336]/95 border-[#364262] shadow-[0_8px_22px_rgba(3,7,18,0.45)]'
    : 'text-gray-400 hover:text-[#d946ef] bg-white border-gray-100 shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`transition-colors p-2.5 rounded-full border ${toneClass}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

function SearchButton({ onClick, isDarkTheme }) {
  const toneClass = isDarkTheme
    ? 'text-[#a7b2d1] hover:text-[#d4b2fa] bg-[#1b2336]/95 border-[#364262] shadow-[0_8px_22px_rgba(3,7,18,0.45)]'
    : 'text-gray-400 hover:text-[#d946ef] bg-white border-gray-100 shadow-sm';

  return (
    <button
      onClick={onClick}
      className={`transition-colors p-2.5 rounded-full border ${toneClass}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  );
}

function BellButton({ unreadCount, onClick, mobile = false, isDarkTheme }) {
  const toneClass = isDarkTheme
    ? 'text-[#a7b2d1] hover:text-[#d4b2fa] bg-[#1b2336]/95 border-[#364262] shadow-[0_8px_22px_rgba(3,7,18,0.45)]'
    : 'text-gray-400 hover:text-[#d946ef] bg-white border-gray-100 shadow-sm';

  return (
    <button
      onClick={onClick}
      className={`transition-colors relative border ${toneClass} ${
        mobile ? 'p-2 rounded-full' : 'p-2.5 rounded-full'
      }`}
    >
      <svg className={mobile ? 'w-5 h-5' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <div
          className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#c987f5] border-2 rounded-full text-white text-[10px] font-black flex items-center justify-center ${
            isDarkTheme ? 'border-[#1b2336]' : 'border-white'
          }`}
        >
          {Math.min(unreadCount, 9)}
        </div>
      )}
    </button>
  );
}

export default function AppTopBars({
  tabTitle,
  canGoBack,
  onBack,
  onOpenSearch,
  onToggleNotifications,
  notificationsOpen,
  notifications,
  unreadNotificationsCount,
  onCloseNotifications,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  isNotificationsLoading,
  themeMode,
  onChangeThemeMode,
  desktopNotificationsRef,
  mobileNotificationsRef,
  isLoggedIn,
  activeTab,
  targetProfileId,
  onLogout,
  onOpenExplore,
  onGoHome,
  renderLogo,
  onRequireAuth,
  isDarkTheme,
}) {
  const mobileHeaderClass = isDarkTheme
    ? 'md:hidden sticky top-0 z-40 bg-[#141b2c]/90 backdrop-blur-xl px-5 py-3 border-b border-[#2e3a58] shadow-[0_10px_28px_rgba(2,6,18,0.4)] flex items-center justify-between'
    : 'md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-5 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center justify-between';

  return (
    <>
      <header className="h-[80px] hidden md:flex items-center justify-between px-8 shrink-0 bg-transparent z-30">
        <div className="flex items-center gap-3">
          {canGoBack && <BackButton onClick={onBack} isDarkTheme={isDarkTheme} />}
          <h2 className={`text-[24px] font-black tracking-tight ${isDarkTheme ? 'text-[#edf2ff]' : 'text-gray-900'}`}>
            {tabTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <SearchButton onClick={onOpenSearch} isDarkTheme={isDarkTheme} />
            <div className="relative" ref={desktopNotificationsRef}>
              <BellButton
                unreadCount={unreadNotificationsCount}
                onClick={onToggleNotifications}
                isDarkTheme={isDarkTheme}
              />
              <NotificationPanel
                isOpen={notificationsOpen}
                notifications={notifications}
                onClose={onCloseNotifications}
                onMarkAllRead={onMarkAllNotificationsRead}
                onMarkRead={onMarkNotificationRead}
                placement="desktop"
                isDarkTheme={isDarkTheme}
              />
              {isNotificationsLoading && (
                <p className={`absolute right-0 -bottom-5 text-[10px] font-bold ${isDarkTheme ? 'text-[#c987f5]' : 'text-[#d946ef]'}`}>
                  Loading...
                </p>
              )}
            </div>
          </div>

          <ThemeSwitcher value={themeMode} onChange={onChangeThemeMode} isDarkTheme={isDarkTheme} />
        </div>
      </header>

      <div className={mobileHeaderClass}>
        <div className="flex items-center gap-2.5">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className={`p-1.5 rounded-full transition-colors ${
                isDarkTheme
                  ? 'text-[#9dabcf] hover:bg-[#26314b] hover:text-[#d4b2fa]'
                  : 'text-gray-500 hover:bg-fuchsia-50 hover:text-[#d946ef]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button type="button" onClick={onGoHome} className="flex items-center gap-2.5">
            {renderLogo}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {isLoggedIn && activeTab === 'profile' && !targetProfileId && (
            <button
              onClick={() => {
                if (window.confirm('Meow, are you sure you want to log out?')) onLogout();
              }}
              className={`p-2 rounded-full transition-colors ${
                isDarkTheme ? 'text-[#f49cba] hover:bg-[#3b2531] hover:text-[#f9b1ca]' : 'text-red-400 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}

          <button
            onClick={onOpenExplore}
            className={`p-2 rounded-full transition-colors ${
              activeTab === 'explore'
                ? isDarkTheme
                  ? 'text-[#d5aff9] bg-[#2d3550]'
                  : 'text-[#d946ef] bg-fuchsia-50'
                : isDarkTheme
                  ? 'text-[#97a4c4] hover:bg-[#24304a]'
                  : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <SearchButton onClick={onOpenSearch} isDarkTheme={isDarkTheme} />
          {isLoggedIn && (
            <div className="relative" ref={mobileNotificationsRef}>
              <BellButton
                unreadCount={unreadNotificationsCount}
                onClick={onToggleNotifications}
                mobile
                isDarkTheme={isDarkTheme}
              />
              <NotificationPanel
                isOpen={notificationsOpen}
                notifications={notifications}
                onClose={onCloseNotifications}
                onMarkAllRead={onMarkAllNotificationsRead}
                onMarkRead={onMarkNotificationRead}
                placement="mobile"
                isDarkTheme={isDarkTheme}
              />
            </div>
          )}
          {!isLoggedIn && (
            <button
              onClick={onRequireAuth}
              className={`text-[13px] font-bold px-4 py-2 rounded-xl ml-1 transition-colors ${
                isDarkTheme
                  ? 'text-[#d5aff9] bg-[#2c3550] hover:bg-[#344063]'
                  : 'text-[#d946ef] bg-[#fdf4ff] hover:bg-fuchsia-100'
              }`}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </>
  );
}
