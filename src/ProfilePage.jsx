import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function ProfilePage({ BASE_URL, targetUserId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [followListType, setFollowListType] = useState(null);

  const getMyUserId = useCallback(() => {
    try {
        const token = localStorage.getItem('token')?.replace(/"/g, '');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return String(payload.sub || payload.id || payload.user_id);
    } catch {
        return null;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      if (!token) throw new Error("Please log in to view profiles.");

      const myId = getMyUserId();
      const isMe = !targetUserId || String(targetUserId) === String(myId);
      const endpoint = isMe ? `${BASE_URL}/profiles/me` : `${BASE_URL}/profiles/${targetUserId}`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();

      // 🚨 ФІКС КЕШУ: Додаємо таймстемп, щоб завжди бачити свіжу аватарку при заході в профіль
      if (data.avatar_url) {
          const cleanUrl = data.avatar_url.split('?')[0];
          data.avatar_url = `${cleanUrl}?t=${Date.now()}`;
      }

      setProfile(data);
      if (data.can_edit) {
          setEditForm({ username: data.username || '', bio: data.bio || '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, getMyUserId, targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const method = profile.is_followed_by_me ? 'DELETE' : 'POST';

      setProfile(prev => ({
          ...prev,
          is_followed_by_me: !prev.is_followed_by_me,
          followers_count: prev.is_followed_by_me ? prev.followers_count - 1 : prev.followers_count + 1
      }));

      const response = await fetch(`${BASE_URL}/profiles/${profile.user_id}/follow`, {
          method: method,
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to follow/unfollow");

      const data = await response.json();
      setProfile(prev => ({
          ...prev,
          is_followed_by_me: data.following,
          followers_count: data.followers_count,
          following_count: data.following_count
      }));

    } catch (error) {
      alert("Error: " + error.message);
      fetchProfile();
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/profiles/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to update profile");
      }

      const updatedProfile = await response.json();

      // Переносимо нашу свіжу аватарку, щоб вона не блимала
      updatedProfile.avatar_url = profile.avatar_url;

      setProfile(updatedProfile);
      localStorage.setItem('username', updatedProfile.username);
      setIsEditing(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingAvatar(true);

    try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
        });

        const width = img.width;
        const height = img.height;
        const cropSize = Math.min(width, height);
        const cropX = Math.floor((width - cropSize) / 2);
        const cropY = Math.floor((height - cropSize) / 2);

        URL.revokeObjectURL(objectUrl);

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('crop_x', cropX);
        formData.append('crop_y', cropY);
        formData.append('crop_size', cropSize);

        const token = localStorage.getItem('token')?.replace(/"/g, '');
        const response = await fetch(`${BASE_URL}/profiles/me/avatar`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to upload avatar");
        }

        const updatedProfile = await response.json();

        // 🚨 ФІКС КЕШУ: Оновлюємо картинку миттєво після зміни
        if (updatedProfile.avatar_url) {
            const cleanUrl = updatedProfile.avatar_url.split('?')[0];
            updatedProfile.avatar_url = `${cleanUrl}?t=${Date.now()}`;
        }

        setProfile(updatedProfile);
    } catch (error) {
        alert(error.message);
    } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="w-full animate-pulse flex flex-col mt-4">
        <div className="relative w-full mb-20">
            <div className="h-48 w-full bg-gray-200 rounded-[32px]"></div>
            <div className="absolute -bottom-10 left-8 w-[120px] h-[120px] bg-white rounded-full p-[5px]">
                <div className="w-full h-full bg-gray-300 rounded-full"></div>
            </div>
        </div>
        <div className="px-8 space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg"></div>
            <div className="flex gap-4 pt-4">
                <div className="h-16 w-24 bg-gray-200 rounded-2xl"></div>
                <div className="h-16 w-24 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-[32px] border border-red-50 shadow-sm mt-4">
        <span className="text-6xl mb-4 block animate-bounce">😿</span>
        <h3 className="text-red-500 font-black text-xl">Oops! User not found.</h3>
        <p className="text-gray-400 text-sm mt-2 font-medium">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full pb-12 flex flex-col">

      {/* 1. БЕЗПЕЧНИЙ КОНТЕЙНЕР ДЛЯ ОБКЛАДИНКИ І АВАТАРУ */}
      <div className="relative w-full mb-16 mt-2 shrink-0">

        {/* Фонова обкладинка */}
        <div className="w-full h-48 bg-gradient-to-br from-fuchsia-100 via-purple-100 to-pink-100 rounded-[32px] overflow-hidden relative shadow-[0_2px_15px_rgba(217,70,239,0.05)]">
            <div className="absolute top-4 right-10 text-6xl opacity-20 blur-[2px] transform rotate-12 pointer-events-none">🧶</div>
            <div className="absolute -bottom-8 left-1/3 text-8xl opacity-10 transform -rotate-12 pointer-events-none">🐾</div>
        </div>

        {/* Аватарка */}
        <div className="absolute -bottom-10 left-6 sm:left-10 z-10">
            <div className="relative group/avatar cursor-pointer" onClick={() => profile.can_edit && fileInputRef.current?.click()}>
                <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] rounded-full bg-white p-[5px] shadow-lg transition-transform duration-300 group-hover/avatar:scale-105">
                    {isUploadingAvatar ? (
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#d946ef] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    ) : profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover bg-gray-50" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-100 to-purple-50 text-[#d946ef] flex items-center justify-center font-black text-4xl sm:text-5xl">
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Іконка камери для зміни фото */}
                {profile.can_edit && !isUploadingAvatar && (
                    <div className="absolute bottom-1 right-1 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-md opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                )}
            </div>
            <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
        </div>

        {/* Кнопки Дій */}
        <div className="absolute -bottom-4 right-4 sm:right-6 z-10">
            {profile.can_edit ? (
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit Profile
                </button>
            ) : (
                <button
                    onClick={handleFollowToggle}
                    className={`font-bold text-[14px] px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${
                        profile.is_followed_by_me
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                        : 'bg-[#d946ef] hover:bg-[#c026d3] text-white border border-[#c026d3]'
                    }`}
                >
                    {profile.is_followed_by_me ? (
                        <>Following <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></>
                    ) : (
                        <>Follow <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg></>
                    )}
                </button>
            )}
        </div>
      </div>

      {/* 2. ІНФОРМАЦІЯ ПРОФІЛЮ */}
      <div className="px-6 sm:px-10 mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {profile.username}
        </h1>
        <p className="text-gray-500 font-medium text-[15px] mt-3 max-w-md leading-relaxed whitespace-pre-wrap">
            {profile.bio || "This kitty hasn't written a bio yet. Probably busy napping. 💤"}
        </p>

        {/* СТАТИСТИКА */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
            <div className="bg-white px-5 py-3.5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px]">
                <span className="text-gray-900 font-black text-xl">{profile.posts_count}</span>
                <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">Posts</span>
            </div>

            <button
                onClick={() => setFollowListType('followers')}
                className="bg-white px-5 py-3.5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px] hover:border-[#d946ef] hover:shadow-md transition-all active:scale-95"
            >
                <span className="text-gray-900 font-black text-xl">{profile.followers_count}</span>
                <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">Followers</span>
            </button>

            <button
                onClick={() => setFollowListType('following')}
                className="bg-white px-5 py-3.5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px] hover:border-[#d946ef] hover:shadow-md transition-all active:scale-95"
            >
                <span className="text-gray-900 font-black text-xl">{profile.following_count}</span>
                <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">Following</span>
            </button>
        </div>
      </div>

      {/* 3. ГАЛЕРЕЯ */}
      <div className="px-2 sm:px-6 w-full">
        <div className="flex items-center gap-3 mb-6 px-4">
            <h3 className="text-gray-900 font-black text-xl">Fluffy Gallery</h3>
            <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {profile.posts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-[32px] mx-4 border border-dashed border-gray-200">
                <span className="text-5xl block mb-4">📸</span>
                <h4 className="text-gray-900 font-bold text-lg">No posts yet</h4>
                <p className="text-gray-400 text-sm mt-1 font-medium">When photos are shared, they'll appear here.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 px-2">
                {profile.posts.map(post => (
                    <div key={post.id} className="relative aspect-square group overflow-hidden rounded-[24px] bg-gray-100 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <img
                            src={post.image_url || "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white font-black text-xl drop-shadow-md">
                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                                {post.rating_score || post.likes_count || post.likes || 0}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- МОДАЛКИ --- */}
      {isEditing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <span>✨</span> Edit Profile
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                        <label className="block text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                        <input
                            type="text"
                            required
                            maxLength={50}
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-bold text-gray-900 outline-none focus:border-[#d946ef] focus:ring-2 focus:ring-fuchsia-100 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                        <textarea
                            rows={3}
                            maxLength={100}
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            placeholder="Tell everyone how much you love cats..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-medium text-gray-900 outline-none focus:border-[#d946ef] focus:ring-2 focus:ring-fuchsia-100 transition-all resize-none"
                        />
                        <div className="text-right text-xs font-bold text-gray-400 mt-1">
                            {editForm.bio.length} / 100
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-[#d946ef] text-white font-bold text-lg py-4 rounded-2xl shadow-sm hover:bg-[#c026d3] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isSaving ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Модалка для списків Followers/Following */}
      {followListType && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl relative text-center">
                <button onClick={() => setFollowListType(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <span className="text-5xl block mb-4">🛠️</span>
                <h3 className="text-2xl font-black text-gray-900 mb-2 capitalize">{followListType} List</h3>
                <p className="text-gray-500 font-medium text-[15px] leading-relaxed mb-6">
                    This feature is under construction!
                </p>
                <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl text-sm font-bold border border-orange-100">
                    Tell your backend dev to add a <span className="font-mono bg-white px-1 rounded text-orange-600">GET /profiles/{profile.user_id}/{followListType}</span> endpoint so we can see the cats here! 🐾
                </div>

                <button
                    onClick={() => setFollowListType(null)}
                    className="w-full mt-6 bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Got it!
                </button>
            </div>
        </div>
      )}

    </div>
  );
}
