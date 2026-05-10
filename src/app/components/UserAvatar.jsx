import { useState } from 'react';

export default function UserAvatar({ userId, username, baseUrl, className }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const avatarUrl = userId ? `${baseUrl}/profiles/${userId}/avatar` : null;

  if (!avatarUrl || failedUrl === avatarUrl) {
    return (
      <div
        className={`rounded-full bg-gradient-to-tr from-fuchsia-100 to-purple-50 text-[#d946ef] flex items-center justify-center font-black ${className}`}
      >
        {username ? username.charAt(0).toUpperCase() : 'C'}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={username || 'User avatar'}
      onError={() => setFailedUrl(avatarUrl)}
      className={`rounded-full object-cover bg-white shadow-sm ${className}`}
    />
  );
}
