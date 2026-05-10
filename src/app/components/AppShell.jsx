import { NAV_ITEMS } from '../constants';
import PawIcon from './PawIcon';

export default function AppShell({
  activeTab,
  targetProfileId,
  tabTitle,
  isLoggedIn,
  topCats,
  onSelectTab,
  onSelectProfile,
  onCreatePost,
  onRequireAuth,
  onOpenAuthTab,
  onLogout,
  onOpenProfile,
  children,
}) {
  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans relative text-gray-800 selection:bg-fuchsia-200">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        `}
      </style>

      <div className="w-[260px] bg-white flex-col hidden md:flex shrink-0 z-10 border-r border-gray-100 shadow-[2px_0_15px_rgba(0,0,0,0.02)]">
        <div className="p-6 pt-8 pb-8 flex items-center gap-3">
          <div className="w-[42px] h-[42px] bg-[#d946ef] rounded-[12px] flex items-center justify-center text-white shadow-sm shrink-0">
            <PawIcon className="w-[22px] h-[22px]" />
          </div>
          <h1 className="text-[24px] font-black tracking-tight text-[#0f172a] mt-0.5">OnlyCats</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id && (item.id !== 'profile' || !targetProfileId);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'profile') {
                    onSelectProfile();
                    return;
                  }
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[18px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#fdf4ff] text-[#d946ef] shadow-sm border border-fuchsia-50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.path} />
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-5 mt-auto border-t border-gray-50">
          <button
            onClick={() => {
              if (!isLoggedIn) {
                onRequireAuth();
                return;
              }
              onCreatePost();
            }}
            className="w-full bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-4 px-4 rounded-[18px] flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 shadow-[0_4px_15px_rgba(217,70,239,0.3)]"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-lg font-black leading-none pb-0.5">
              +
            </div>
            Post Cat
          </button>

          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
            >
              Log Out
            </button>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => onOpenAuthTab('register')}
                className="w-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={() => onOpenAuthTab('login')}
                className="w-full text-sm font-bold text-[#d946ef] bg-[#fdf4ff] hover:bg-fuchsia-100 py-3 rounded-xl transition-colors"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-[80px] hidden md:flex items-center justify-between px-8 shrink-0 bg-transparent z-10">
          <h2 className="text-[24px] font-black text-gray-900 tracking-tight">{tabTitle}</h2>
          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-[#d946ef] transition-colors bg-white p-2.5 rounded-full shadow-sm border border-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-[#d946ef] transition-colors relative bg-white p-2.5 rounded-full shadow-sm border border-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#d946ef] border-2 border-white rounded-full" />
            </button>
          </div>
        </header>

        <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-5 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#d946ef] rounded-[8px] flex items-center justify-center text-white shadow-sm shrink-0">
              <PawIcon className="w-4 h-4" />
            </div>
            <h1 className="text-[20px] font-black text-[#0f172a] tracking-tight mt-0.5">OnlyCats</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {isLoggedIn && activeTab === 'profile' && !targetProfileId && (
              <button
                onClick={() => {
                  if (window.confirm('Log out from your account?')) onLogout();
                }}
                className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
              onClick={() => onSelectTab('explore')}
              className={`p-2 rounded-full transition-colors ${
                activeTab === 'explore' ? 'text-[#d946ef] bg-fuchsia-50' : 'text-gray-400 hover:bg-gray-50'
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

            {!isLoggedIn && (
              <button
                onClick={onRequireAuth}
                className="text-[13px] font-bold text-[#d946ef] bg-[#fdf4ff] px-4 py-2 rounded-xl ml-1"
              >
                Log In
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-y-auto px-0 md:px-8 pb-32 md:pb-8 pt-4 md:pt-0">
          <main className="flex-1 max-w-[620px] w-full mx-auto flex flex-col">{children}</main>

          <aside className="w-[320px] ml-8 hidden lg:block shrink-0 pt-0">
            <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-50 rounded-full opacity-60 blur-2xl pointer-events-none" />

              <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-[18px] relative z-10">
                <span className="text-xl">🏆</span> Fluffy League
              </h3>

              {topCats.length === 0 ? (
                <div className="text-center py-6 relative z-10">
                  <p className="text-gray-400 text-sm font-medium">No ratings yet.</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {topCats.map((cat, index) => (
                    <div
                      key={cat.id}
                      onClick={() => onOpenProfile(cat.userId)}
                      className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black text-[13px] shadow-sm ${cat.style.bg} ${cat.style.color}`}
                      >
                        {cat.rank}
                      </div>

                      <div className="relative">
                        {index === 0 && (
                          <span className="absolute -top-3 -right-2 text-sm z-10 drop-shadow-sm">👑</span>
                        )}
                        <img
                          src={cat.image}
                          alt={cat.catName}
                          className="w-12 h-12 rounded-[14px] object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0 ml-1">
                        <div className="font-black text-gray-900 text-[15px] leading-tight truncate group-hover:text-[#d946ef] transition-colors">
                          {cat.catName}
                        </div>
                        <div className="text-[12px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                          <span className="text-yellow-400 text-sm">★</span>
                          {cat.likes} stars
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onSelectTab('rating')}
                className="w-full mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-100 font-black tracking-wide py-3.5 rounded-xl transition-all hover:shadow-md active:scale-95 text-sm relative z-10"
              >
                View Leaderboard
              </button>
            </div>

            <div className="mt-6 px-4 text-center">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] font-bold text-gray-300 mb-3">
                <a href="#" className="hover:text-gray-500 transition-colors">
                  About
                </a>
                <a href="#" className="hover:text-gray-500 transition-colors">
                  Help
                </a>
                <a href="#" className="hover:text-gray-500 transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-gray-500 transition-colors">
                  Terms
                </a>
              </div>
              <p className="text-[11px] font-bold text-gray-300">© 2026 OnlyCats Inc.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-6 bg-gradient-to-t from-[#f3f4f6] via-[#f3f4f6]/90 to-transparent pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[24px] flex justify-around items-center p-2 pointer-events-auto">
          <button
            onClick={() => onSelectTab('home')}
            className={`p-3 rounded-[18px] transition-colors ${
              activeTab === 'home' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'
            }`}
          >
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>

          <button
            onClick={() => onSelectTab('tasks')}
            className={`p-3 rounded-[18px] transition-colors ${
              activeTab === 'tasks' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'
            }`}
          >
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) {
                onRequireAuth();
                return;
              }
              onCreatePost();
            }}
            className="bg-gradient-to-tr from-[#d946ef] to-[#c026d3] text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(217,70,239,0.4)] transform -translate-y-4 border-[4px] border-white transition-transform active:scale-95 relative z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={() => onSelectTab('rating')}
            className={`p-3 rounded-[18px] transition-colors ${
              activeTab === 'rating' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'
            }`}
          >
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) {
                onRequireAuth();
                return;
              }
              onSelectProfile();
            }}
            className={`p-3 rounded-[18px] transition-colors ${
              activeTab === 'profile' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'
            }`}
          >
            <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

