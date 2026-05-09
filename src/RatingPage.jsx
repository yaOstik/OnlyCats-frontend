import React, { useState, useEffect } from 'react';

export default function RatingPage({ BASE_URL }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch(`${BASE_URL}/posts/rating`);

        if (!response.ok) throw new Error('Failed to load leaderboard');

        const data = await response.json();

        const formattedLeaders = data.map((post, index) => ({
          id: post.id,
          rank: index + 1,
          catName: post.title || "Fluffy",
          author: post.author_username || post.authorUsername || post.username || post.owner?.username || "Incognito Cat",
          score: post.rating_score || post.likes_count || post.likes || 0,
          image: post.image_url || "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }));

        setLeaders(formattedLeaders.filter(l => l.score > 0));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [BASE_URL]);

  if (loading) {
    return (
      <div className="w-full pb-12 animate-pulse flex flex-col items-center gap-6 mt-4">
        <div className="h-32 w-full bg-fuchsia-50 rounded-[32px] mb-8"></div>
        <div className="flex items-end justify-center gap-4 h-48 w-full">
          <div className="w-28 h-32 bg-gray-100 rounded-[24px]"></div>
          <div className="w-32 h-44 bg-gray-100 rounded-[24px]"></div>
          <div className="w-28 h-28 bg-gray-100 rounded-[24px]"></div>
        </div>
        <div className="w-full space-y-4 mt-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-full h-20 bg-gray-50 rounded-[24px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-[32px] border border-red-50 shadow-sm mt-4">
        <span className="text-6xl mb-4 block animate-bounce">😿</span>
        <h3 className="text-red-500 font-black text-xl">Oops! Leaderboard is taking a nap.</h3>
        <p className="text-gray-400 text-sm mt-2 font-medium">Try refreshing the page or petting a real cat meanwhile.</p>
      </div>
    );
  }

  const topThree = leaders.slice(0, 3);
  const theRest = leaders.slice(3, 10);

  // ЛАМПОВІ НАЛАШТУВАННЯ ДЛЯ ПОДІУМУ
  const podiumStyles = [
    {
        height: "h-[180px]",
        border: "border-yellow-400",
        bg: "bg-gradient-to-t from-yellow-100 to-white",
        crown: "👑",
        medal: "bg-yellow-400 text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.6)]",
        title: "Supreme Fluff",
        glow: "shadow-[0_0_40px_rgba(250,204,21,0.25)]"
    },
    {
        height: "h-[140px]",
        border: "border-slate-300",
        bg: "bg-gradient-to-t from-slate-100 to-white",
        crown: "🥈",
        medal: "bg-slate-200 text-slate-700 shadow-md",
        title: "Silver Whisker",
        glow: "shadow-lg"
    },
    {
        height: "h-[120px]",
        border: "border-orange-300",
        bg: "bg-gradient-to-t from-orange-100 to-white",
        crown: "🥉",
        medal: "bg-orange-300 text-orange-900 shadow-md",
        title: "Bronze Paw",
        glow: "shadow-lg"
    }
  ];

  const displayOrder = [];
  if (topThree[1]) displayOrder.push({ ...topThree[1], style: podiumStyles[1] });
  if (topThree[0]) displayOrder.push({ ...topThree[0], style: podiumStyles[0] });
  if (topThree[2]) displayOrder.push({ ...topThree[2], style: podiumStyles[2] });

  // Визначаємо забавний статус для котиків зі списку
  const getCatStatus = (rank) => {
      if (rank <= 5) return { text: "Hot Contender 🔥", color: "text-orange-500 bg-orange-50" };
      if (rank <= 8) return { text: "Rising Star ✨", color: "text-[#d946ef] bg-[#fdf4ff]" };
      return { text: "Cute Fluff 🐾", color: "text-blue-500 bg-blue-50" };
  };

  return (
    <div className="w-full pb-12 flex flex-col items-center">

      {/* 1. ІНТЕРАКТИВНИЙ ХІДЕР */}
      <div className="relative w-full bg-gradient-to-br from-[#fdf4ff] via-white to-[#fdf4ff] p-8 rounded-[32px] shadow-sm border border-fuchsia-100 mb-12 text-center overflow-hidden group">
        {/* Плаваючі бекграунд-елементи */}
        <div className="absolute -left-4 top-4 text-4xl opacity-10 group-hover:-rotate-12 transition-transform duration-700">🐾</div>
        <div className="absolute right-8 -bottom-4 text-5xl opacity-10 group-hover:rotate-12 transition-transform duration-700">🧶</div>
        <div className="absolute left-1/4 -top-6 text-3xl opacity-10 blur-[1px]">⭐</div>

        <div className="relative z-10">
            <span className="inline-block px-4 py-1 bg-white rounded-full text-[#d946ef] font-bold text-[11px] uppercase tracking-widest shadow-sm mb-3">Season 1</span>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Weekly Fluffy League</h2>
            <p className="text-[15px] text-gray-500 font-medium max-w-[80%] mx-auto leading-relaxed">
              Ratings reset every Monday. May the most adorable paws win! Top 3 cats earn <span className="text-yellow-500 font-black">Bonus Stars</span> ⭐
            </p>
        </div>
      </div>

      {leaders.length === 0 ? (
        <div className="text-center py-12 bg-white w-full rounded-[32px] border border-gray-100 border-dashed">
          <span className="text-5xl block mb-4 animate-pulse">🏜️</span>
          <p className="text-gray-900 font-bold text-xl">It's quiet here...</p>
          <p className="text-gray-400 text-[15px] mt-2 font-medium">Be the first cat to enter the arena!</p>
        </div>
      ) : (
        <>
          {/* 2. ЛАМПОВИЙ ПОДІУМ */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 w-full mb-16 mt-4 px-2">
            {displayOrder.map((leader) => (
              <div key={leader.id} className={`flex flex-col items-center w-[32%] sm:w-[140px] relative group cursor-pointer`}>

                {/* Корона з ефектом зависання */}
                {leader.style.crown && (
                  <span className={`text-4xl sm:text-5xl absolute ${leader.rank === 1 ? '-top-14 animate-bounce' : '-top-10 group-hover:-translate-y-2 transition-transform'} z-20 drop-shadow-md`}>
                      {leader.style.crown}
                  </span>
                )}

                {/* Аватарка котика */}
                <div className="relative z-10 mb-[-24px] group-hover:-translate-y-2 transition-transform duration-300">
                    <img
                    src={leader.image}
                    alt={leader.catName}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[5px] ${leader.style.border} ${leader.style.glow} bg-white`}
                    />
                </div>

                {/* П'єдестал */}
                <div className={`w-full ${leader.style.height} ${leader.style.bg} rounded-[24px] border border-b-4 ${leader.style.border} flex flex-col justify-end items-center pb-5 shadow-sm transition-all duration-300 group-hover:shadow-md`}>

                  <div className={`w-8 h-8 rounded-full ${leader.style.medal} font-black text-sm flex items-center justify-center mb-3 ring-4 ring-white`}>
                    {leader.rank}
                  </div>

                  <span className="font-black text-gray-900 text-[15px] truncate w-full px-3 text-center mb-0.5">{leader.catName}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{leader.style.title}</span>

                  <div className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-[#d946ef]" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                    <span className="text-gray-900 font-black text-sm">{leader.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. ІНТЕРАКТИВНИЙ СПИСОК 4-10 МІСЦЯ */}
          {theRest.length > 0 && (
            <div className="w-full flex flex-col gap-4 px-1">
              <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest px-2">Top 10 Contenders</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {theRest.map((leader) => {
                const status = getCatStatus(leader.rank);

                return (
                <div
                    key={leader.id}
                    className="group bg-white flex items-center p-4 pr-5 rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-transparent hover:border-fuchsia-100 hover:shadow-[0_10px_25px_rgba(217,70,239,0.08)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                  {/* Декоративна лінія зліва при наведенні */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d946ef] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="w-10 flex justify-center text-gray-300 group-hover:text-gray-500 transition-colors font-black text-xl mr-2">
                    {leader.rank}
                  </div>

                  <div className="relative mr-4">
                      <img src={leader.image} alt={leader.catName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                          <span className="text-[10px]">🐾</span>
                      </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-black text-gray-900 text-[17px] leading-tight truncate group-hover:text-[#d946ef] transition-colors">{leader.catName}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-gray-400 text-[13px] font-medium truncate">by @{leader.author.toLowerCase().replace(/\s+/g, '_')}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.color}`}>
                            {status.text}
                        </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 group-hover:bg-[#fdf4ff] transition-colors px-4 py-2 rounded-2xl flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-gray-400 group-hover:text-[#d946ef] text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors">Score</span>
                    <span className="text-gray-900 group-hover:text-[#d946ef] font-black text-lg leading-none transition-colors">{leader.score}</span>
                  </div>
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </div>
  );
}