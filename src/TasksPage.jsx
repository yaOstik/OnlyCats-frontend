import React, { useState, useEffect } from 'react';

export default function TasksPage({ BASE_URL }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token')?.replace(/"/g, '');
        if (!token) throw new Error("No token");

        const response = await fetch(`${BASE_URL}/tasks/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load tasks');

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [BASE_URL]);

  if (loading) {
    return (
      <div className="w-full pb-12 animate-pulse">
        <div className="flex gap-4 mb-6">
          <div className="h-24 bg-gray-100 rounded-[24px] flex-1"></div>
          <div className="h-24 bg-gray-100 rounded-[24px] flex-1"></div>
        </div>
        <div className="h-40 bg-gray-100 rounded-[24px] mb-4"></div>
        <div className="h-40 bg-gray-100 rounded-[24px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-white rounded-[24px] border border-red-100">
        <span className="text-4xl mb-3 block">😿</span>
        <h3 className="text-red-500 font-bold">Oops! Could not load tasks.</h3>
        <p className="text-gray-400 text-sm mt-2">Try refreshing the page.</p>
      </div>
    );
  }

  if (!data) return null;

  // Визначаємо колір вогника
  const flameColors = {
    orange: "text-fuchsia-500 bg-fuchsia-100",
    grey: "text-gray-400 bg-gray-100",
    off: "text-gray-300 bg-gray-50"
  };
  const flameClass = flameColors[data.flame_status] || flameColors.off;

  // Компонент одного рядка завдання
  const TaskRow = ({ icon, title, desc, progress, isBonus, reward }) => {
    const percent = Math.min(100, Math.round((progress.current / progress.required) * 100));
    const isDone = progress.completed;

    return (
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
        isDone ? 'bg-[#fdf4ff] border-fuchsia-100' : 'bg-white border-transparent hover:border-fuchsia-50 shadow-sm'
      }`}>
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-[#d946ef] text-white' : 'bg-gray-50 text-gray-400'}`}>
            {isDone ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            ) : icon}
          </div>
          <div>
            <h4 className={`font-bold text-[15px] ${isDone ? 'text-gray-800 line-through opacity-70' : 'text-gray-900'}`}>{title}</h4>
            <p className="text-gray-400 text-[13px] font-medium">{desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:w-[180px] shrink-0 justify-between sm:justify-end">
          {isBonus && !isDone && (
            <div className="flex items-center gap-1 bg-fuchsia-50 px-2 py-1 rounded-lg">
              <span className="text-fuchsia-500 text-sm">⭐</span>
              <span className="text-fuchsia-600 font-bold text-xs">+{reward}</span>
            </div>
          )}

          <div className="flex-1 sm:w-24 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
              <span>{progress.current} / {progress.required}</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out rounded-full ${isDone ? 'bg-[#d946ef]' : isBonus ? 'bg-fuchsia-400' : 'bg-gray-800'}`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-12 space-y-6">

      {/* 1. TOP DASHBOARD (STREAK & BALANCE) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${flameClass}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2c0 0-4.5 3-4.5 8s2.5 5 2.5 8c0 1.5-1.5 2-1.5 2s4 2 7 0c1.5-1 1.5-3 1.5-3s-1-2.5 1-4.5c2-2 1-6 1-6s-3.5 2-4.5 2c-1.5 0-2.5-1.5-2.5-4.5z" />
            </svg>
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Day Streak</div>
            <div className="text-2xl font-black text-gray-900 leading-none mt-1">{data.streak_days}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-fuchsia-50 text-fuchsia-500 flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Star Balance</div>
            <div className="text-2xl font-black text-gray-900 leading-none mt-1">{data.bonus_stars_balance}</div>
          </div>
        </div>
      </div>

      {/* 2. MANDATORY TASKS */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span className="text-xl">🎯</span> Daily Routine
          </h3>
          {data.mandatory_completed_today && (
             <span className="text-xs font-bold bg-[#fdf4ff] text-[#d946ef] px-3 py-1 rounded-lg">All Done! 🎉</span>
          )}
        </div>

        <div className="space-y-3">
          <TaskRow
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
            title="Post a Fluffy"
            desc="Upload a new picture of a cat"
            progress={data.mandatory_post_task}
          />
          <TaskRow
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>}
            title="Give Paws"
            desc="Like other cats' posts"
            progress={data.mandatory_like_task}
          />
        </div>
      </div>

      {/* 3. BONUS TASKS */}
      <div className="oc-bonus-quests-panel bg-gradient-to-br from-fuchsia-50 to-purple-50 p-6 rounded-[24px] shadow-sm border border-fuchsia-100">
        <div className="flex justify-between items-center mb-5">
          <h3 className="oc-bonus-title font-bold text-fuchsia-800 text-lg flex items-center gap-2">
            <span className="text-xl">🎁</span> Bonus Quests
          </h3>
          <span className="oc-earned-pill text-xs font-bold text-fuchsia-600 bg-white px-3 py-1 rounded-lg shadow-sm">
            Earned today: {data.bonus_stars_earned_today} ⭐
          </span>
        </div>

        <div className="space-y-3">
          <TaskRow
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>}
            title="Extra Posts"
            desc="Post more cats for extra stars"
            progress={data.bonus_post_task}
            isBonus={true}
            reward={data.bonus_post_task.reward_stars}
          />
          <TaskRow
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>}
            title="Chatty Cat"
            desc="Leave comments on posts"
            progress={data.bonus_comment_task}
            isBonus={true}
            reward={data.bonus_comment_task.reward_stars}
          />
        </div>
      </div>

      {/* 4. FOOTER STATS */}
      <div className="flex flex-wrap gap-4 text-center justify-center px-4">
        <p className="text-xs text-gray-400 font-bold bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          Daily likes left: <span className="text-[#d946ef]">{data.remaining_daily_likes}</span>
        </p>
      </div>

    </div>
  );
}
