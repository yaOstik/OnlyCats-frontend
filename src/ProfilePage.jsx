import React, { useCallback, useEffect, useRef, useState } from 'react';
import ImageCropModal from './app/components/ImageCropModal';
import ProfileSettingsModal from './app/components/ProfileSettingsModal';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function getImageSize(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image size.'));
    };
    img.src = objectUrl;
  });
}

function buildCoverStorageKey(userId) {
  return `onlycats.cover.${userId}`;
}

function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'followed', 'following'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'not_following', 'unfollowed'].includes(normalized)) return false;
  }
  return null;
}

function parseCount(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ProfilePage({ BASE_URL, targetUserId, themeMode, onChangeThemeMode, isDarkTheme }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);

  const [coverUrl, setCoverUrl] = useState('');
  const [followListType, setFollowListType] = useState(null);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

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
    setError(null);
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      if (!token) throw new Error('Please log in to open profile.');

      const myId = getMyUserId();
      const isMe = !targetUserId || String(targetUserId) === String(myId);
      const endpoint = isMe ? `${BASE_URL}/profiles/me` : `${BASE_URL}/profiles/${targetUserId}`;

      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load profile.');

      const data = await response.json();
      const normalizedProfile = { ...data };

      if (normalizedProfile.avatar_url) {
        const cleanUrl = normalizedProfile.avatar_url.split('?')[0];
        normalizedProfile.avatar_url = `${cleanUrl}?t=${Date.now()}`;
      }

      const followCandidates = [
        normalizedProfile.is_followed_by_me,
        normalizedProfile.is_following,
        normalizedProfile.following,
        normalizedProfile.followed_by_me,
        normalizedProfile.isFollowing,
        normalizedProfile.following_by_me,
        normalizedProfile.followingStatus,
      ];
      let followedByMe = null;
      for (const candidate of followCandidates) {
        const parsed = parseBooleanFlag(candidate);
        if (parsed !== null) {
          followedByMe = parsed;
          break;
        }
      }
      if (followedByMe === null && Array.isArray(normalizedProfile.followers) && myId) {
        followedByMe = normalizedProfile.followers.some((item) => {
          const followerId = item?.user_id ?? item?.id ?? item?.follower_id ?? item;
          return String(followerId) === String(myId);
        });
      }

      const followersCount = parseCount(
        normalizedProfile.followers_count ??
          normalizedProfile.followersCount ??
          (Array.isArray(normalizedProfile.followers) ? normalizedProfile.followers.length : 0),
        0,
      );

      const followingCount = parseCount(
        normalizedProfile.following_count ??
          normalizedProfile.followingCount ??
          (Array.isArray(normalizedProfile.following) ? normalizedProfile.following.length : 0),
        0,
      );

      normalizedProfile.is_followed_by_me = followedByMe ?? false;
      normalizedProfile.followers_count = followersCount;
      normalizedProfile.following_count = followingCount;

      setProfile(normalizedProfile);
      if (normalizedProfile.can_edit) {
        setEditForm({ username: normalizedProfile.username || '', bio: normalizedProfile.bio || '' });
      }

      const localCover = localStorage.getItem(buildCoverStorageKey(normalizedProfile.user_id));
      setCoverUrl(normalizedProfile.cover_url || localCover || '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, getMyUserId, targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!profile || isFollowActionLoading) return;
    setIsFollowActionLoading(true);

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      if (!token) throw new Error('Please log in first.');
      const method = profile.is_followed_by_me ? 'DELETE' : 'POST';

      setProfile((prev) => ({
        ...prev,
        is_followed_by_me: !prev.is_followed_by_me,
        followers_count: prev.is_followed_by_me
          ? Math.max(0, (Number(prev.followers_count) || 0) - 1)
          : (Number(prev.followers_count) || 0) + 1,
      }));

      const response = await fetch(`${BASE_URL}/profiles/${profile.user_id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to follow/unfollow.');

      const data = await response.json();
      const responseFollowing =
        parseBooleanFlag(data.following) ??
        parseBooleanFlag(data.is_followed_by_me) ??
        parseBooleanFlag(data.isFollowing) ??
        parseBooleanFlag(data.followed_by_me);

      setProfile((prev) => ({
        ...prev,
        is_followed_by_me: responseFollowing ?? prev.is_followed_by_me,
        followers_count: parseCount(data.followers_count ?? data.followersCount, Number(prev.followers_count) || 0),
        following_count: parseCount(data.following_count ?? data.followingCount, Number(prev.following_count) || 0),
      }));
    } catch (followError) {
      alert(followError.message);
      fetchProfile();
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/profiles/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Failed to update profile.');
      }

      const updatedProfile = await response.json();
      updatedProfile.avatar_url = profile.avatar_url;
      updatedProfile.cover_url = profile.cover_url;
      setProfile(updatedProfile);
      localStorage.setItem('username', updatedProfile.username);
      setShowSettingsModal(false);
    } catch (saveError) {
      alert(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    setIsUploadingAvatar(true);
    try {
      const { width, height } = await getImageSize(file);
      const cropSize = Math.min(width, height);

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('crop_x', '0');
      formData.append('crop_y', '0');
      formData.append('crop_size', String(cropSize));

      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/profiles/me/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Failed to update avatar.');
      }

      const updatedProfile = await response.json();
      if (updatedProfile.avatar_url) {
        const cleanUrl = updatedProfile.avatar_url.split('?')[0];
        updatedProfile.avatar_url = `${cleanUrl}?t=${Date.now()}`;
      }
      setProfile((prev) => ({ ...prev, ...updatedProfile }));
    } catch (avatarError) {
      alert(avatarError.message);
    } finally {
      setIsUploadingAvatar(false);
      setShowAvatarCropModal(false);
      setPendingAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAvatarSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setShowAvatarCropModal(true);
  };

  const handleCoverSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.can_edit) return;
    const storageKey = buildCoverStorageKey(profile.user_id);
    const previousCoverUrl = coverUrl;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCoverUrl(dataUrl);
      localStorage.setItem(storageKey, dataUrl);

      const token = localStorage.getItem('token')?.replace(/"/g, '');
      if (!token) throw new Error('Please log in first.');

      const attempts = [
        { endpoint: '/profiles/me/background', method: 'PUT', field: 'background' },
        { endpoint: '/profiles/me/background', method: 'PUT', field: 'image' },
        { endpoint: '/profiles/me/background', method: 'PUT', field: 'file' },
        { endpoint: '/profiles/me/cover', method: 'PUT', field: 'cover' },
        { endpoint: '/profiles/me/cover', method: 'PUT', field: 'image' },
        { endpoint: '/profiles/me/cover', method: 'PUT', field: 'file' },
      ];

      let uploaded = false;
      let lastMessage = 'Failed to update profile background.';

      for (const attempt of attempts) {
        try {
          const formData = new FormData();
          formData.append(attempt.field, file);
          const response = await fetch(`${BASE_URL}${attempt.endpoint}`, {
            method: attempt.method,
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (response.ok) {
            uploaded = true;
            break;
          }

          let detail = '';
          try {
            const errorBody = await response.json();
            detail = errorBody?.detail || errorBody?.message || '';
          } catch {
            detail = '';
          }

          lastMessage = detail || `Upload failed (${response.status}) on ${attempt.endpoint}`;

          if (response.status === 401 || response.status === 403) {
            break;
          }
        } catch (attemptError) {
          lastMessage = attemptError.message || lastMessage;
        }
      }

      if (!uploaded) {
        throw new Error(lastMessage);
      }
    } catch (coverError) {
      setCoverUrl(previousCoverUrl || '');
      if (previousCoverUrl) {
        localStorage.setItem(storageKey, previousCoverUrl);
      } else {
        localStorage.removeItem(storageKey);
      }
      alert(coverError.message || 'Failed to update profile background.');
      fetchProfile();
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async (password) => {
    const token = localStorage.getItem('token')?.replace(/"/g, '');
    const endpoints = [
      { url: `${BASE_URL}/users/me`, method: 'DELETE' },
      { url: `${BASE_URL}/users/me/`, method: 'DELETE' },
    ];

    let deleted = false;
    let lastMessage = 'Failed to delete account.';

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        });

        if (response.ok) {
          deleted = true;
          break;
        }

        if (response.status === 404) {
          continue;
        }

        let detail = '';
        try {
          const errorBody = await response.json();
          detail = errorBody?.detail || errorBody?.message || '';
        } catch {
          detail = '';
        }
        lastMessage = detail || `Failed with status ${response.status}.`;
      } catch {
        lastMessage = 'Network error. Try again.';
      }
    }

    if (!deleted) {
      throw new Error(lastMessage);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('remembered_email');
    if (profile?.user_id) {
      localStorage.removeItem(buildCoverStorageKey(profile.user_id));
    }
    alert('Account deleted permanently.');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="w-full animate-pulse flex flex-col mt-4">
        <div className="relative w-full mb-20">
          <div className="h-48 w-full bg-gray-200 rounded-[32px]" />
          <div className="absolute -bottom-10 left-8 w-[120px] h-[120px] bg-white rounded-full p-[5px]">
            <div className="w-full h-full bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-[32px] border border-red-50 shadow-sm mt-4">
        <h3 className="text-red-500 font-black text-xl">Oops! User not found.</h3>
        <p className="text-gray-400 text-sm mt-2 font-medium">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full pb-12 flex flex-col">
      <div className="relative w-full mb-16 mt-2 shrink-0">
        <div
          className="w-full h-48 rounded-[32px] overflow-hidden relative shadow-[0_2px_15px_rgba(217,70,239,0.08)] border border-fuchsia-100"
          style={
            coverUrl
              ? {
                  backgroundImage: `url(${coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!coverUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-100 via-purple-100 to-pink-100" />
          )}

          {profile.can_edit && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute right-4 top-4 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#d946ef] shadow-sm hover:bg-white"
            >
              Change Background
            </button>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverSelected}
        />

        <div className="absolute -bottom-10 left-6 sm:left-10 z-10">
          <div
            className="relative group/avatar cursor-pointer"
            onClick={() => profile.can_edit && avatarInputRef.current?.click()}
          >
            <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] rounded-full bg-white p-[5px] shadow-lg transition-transform duration-300 group-hover/avatar:scale-105">
              {isUploadingAvatar ? (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#d946ef] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65z"
                    />
                  </svg>
                </div>
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover bg-gray-50" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-100 to-purple-50 text-[#d946ef] flex items-center justify-center font-black text-4xl sm:text-5xl">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {profile.can_edit && !isUploadingAvatar && (
              <div className="absolute bottom-1 right-1 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-md opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.89l.82-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.66.89l.82 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={avatarInputRef}
            onChange={handleAvatarSelected}
          />
        </div>

        <div className="absolute -bottom-4 right-4 sm:right-6 z-10">
          {profile.can_edit ? (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.33 3.26l1.34-1.34a1 1 0 011.42 0l1.34 1.34a1 1 0 00.7.29h1.89a1 1 0 011 1v1.89a1 1 0 00.29.7l1.34 1.34a1 1 0 010 1.42l-1.34 1.34a1 1 0 00-.29.7v1.89a1 1 0 01-1 1h-1.89a1 1 0 00-.7.29l-1.34 1.34a1 1 0 01-1.42 0l-1.34-1.34a1 1 0 00-.7-.29H8.44a1 1 0 01-1-1v-1.89a1 1 0 00-.29-.7L5.81 9.61a1 1 0 010-1.42l1.34-1.34a1 1 0 00.29-.7V4.26a1 1 0 011-1h1.89a1 1 0 00.7-.29z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
              </svg>
              Settings
            </button>
          ) : (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowActionLoading}
              className={`font-bold text-[14px] px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${
                profile.is_followed_by_me
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                  : 'bg-[#d946ef] hover:bg-[#c026d3] text-white border border-[#c026d3]'
              } ${isFollowActionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isFollowActionLoading ? 'Updating...' : profile.is_followed_by_me ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-10 mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile.username}</h1>
        <p className="text-gray-500 font-medium text-[15px] mt-3 max-w-md leading-relaxed whitespace-pre-wrap">
          {profile.bio || "This kitty hasn't written a bio yet."}
        </p>

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

      <div className="px-2 sm:px-6 w-full">
        <div className="flex items-center gap-3 mb-6 px-4">
          <h3 className="text-gray-900 font-black text-xl">Fluffy Gallery</h3>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {profile.posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[32px] mx-4 border border-dashed border-gray-200">
            <h4 className="text-gray-900 font-bold text-lg">No posts yet</h4>
            <p className="text-gray-400 text-sm mt-1 font-medium">When photos are shared, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 px-2">
            {profile.posts.map((post) => (
              <div key={post.id} className="relative aspect-square group overflow-hidden rounded-[24px] bg-gray-100 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <img
                  src={post.image_url || 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white font-black text-xl drop-shadow-md">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.5 7C7.1 7 6 5.9 6 4.5S7.1 2 8.5 2 11 3.1 11 4.5 9.9 7 8.5 7zm7 0C14.1 7 13 5.9 13 4.5S14.1 2 15.5 2 18 3.1 18 4.5 16.9 7 15.5 7zM5.5 12C4.1 12 3 10.9 3 9.5S4.1 7 5.5 7 8 8.1 8 9.5 6.9 12 5.5 12zm13 0c-1.4 0-2.5-1.1-2.5-2.5S17.1 7 18.5 7 21 8.1 21 9.5 19.9 12 18.5 12zM12 22c-3.3 0-6-2.7-6-6 0-2.5 1.5-4.5 3.5-5.5.8-.4 1.7-.5 2.5-.5s1.7.1 2.5.5c2 1 3.5 3 3.5 5.5 0 3.3-2.7 6-6 6z" />
                    </svg>
                    {post.rating_score || post.likes_count || post.likes || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        basicForm={editForm}
        onChangeBasic={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))}
        onSaveBasic={handleSaveProfile}
        isSavingBasic={isSaving}
        baseUrl={BASE_URL}
        defaultEmail={profile.email || localStorage.getItem('remembered_email') || ''}
        onDeleteAccount={handleDeleteAccount}
        themeMode={themeMode}
        onChangeThemeMode={onChangeThemeMode}
        isDarkTheme={isDarkTheme}
      />

      <ImageCropModal
        isOpen={showAvatarCropModal}
        file={pendingAvatarFile}
        title="Crop avatar"
        shape="circle"
        aspect={1}
        onCancel={() => {
          setShowAvatarCropModal(false);
          setPendingAvatarFile(null);
          if (avatarInputRef.current) avatarInputRef.current.value = '';
        }}
        onApply={(croppedFile) => {
          uploadAvatar(croppedFile);
        }}
      />

      {followListType && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setFollowListType(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-2 capitalize">{followListType} list</h3>
            <p className="text-gray-500 font-medium text-[15px] leading-relaxed mb-6">
              This feature is under construction.
            </p>
            <button
              onClick={() => setFollowListType(null)}
              className="w-full mt-2 bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
