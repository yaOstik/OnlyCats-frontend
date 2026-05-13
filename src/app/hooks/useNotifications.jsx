import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function mapNotification(item) {
  const type = item.type || item.event_type || item.kind || 'like';
  const actor = item.actor_username || item.actor || item.username || 'Someone';
  const commentSnippet = item.comment_text || item.content || '';

  let text = item.text;
  if (!text) {
    if (type === 'comment') {
      text = `${actor} commented: "${commentSnippet.slice(0, 20)}${commentSnippet.length > 20 ? '...' : ''}"`;
    } else if (type === 'follow') {
      text = `${actor} followed you.`;
    } else {
      text = `${actor} liked your post.`;
    }
  }

  return {
    id: item.id || `${type}-${actor}-${item.created_at || Date.now()}`,
    type,
    text,
    read: Boolean(item.read || item.is_read),
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  };
}

function byNewest(left, right) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export default function useNotifications({ baseUrl, isLoggedIn }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const desktopNotificationsRef = useRef(null);
  const mobileNotificationsRef = useRef(null);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const fetchNotifications = async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    setIsNotificationsLoading(true);
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${baseUrl}/notifications/me?skip=0&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Notifications endpoint unavailable');

      const data = await response.json();
      const mapped = normalizeList(data).map(mapNotification).sort(byNewest);
      setNotifications(mapped);
    } catch {
      const localFallback = JSON.parse(localStorage.getItem('onlycats_local_notifications') || '[]');
      setNotifications(localFallback.map(mapNotification).sort(byNewest));
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      await fetch(`${baseUrl}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // UI already optimistic
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      await fetch(`${baseUrl}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // UI already optimistic
    }
  };

  const prependLocalNotification = (notificationItem) => {
    const current = JSON.parse(localStorage.getItem('onlycats_local_notifications') || '[]');
    const next = [notificationItem, ...current].slice(0, 100);
    localStorage.setItem('onlycats_local_notifications', JSON.stringify(next));
    setNotifications(next.map(mapNotification).sort(byNewest));
  };

  const toggleNotifications = async () => {
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);
    if (willOpen) {
      await fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 45000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!notificationsOpen) return;
      if (desktopNotificationsRef.current?.contains(event.target)) return;
      if (mobileNotificationsRef.current?.contains(event.target)) return;
      setNotificationsOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [notificationsOpen]);

  return {
    notificationsOpen,
    notifications,
    unreadNotificationsCount,
    isNotificationsLoading,
    desktopNotificationsRef,
    mobileNotificationsRef,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    prependLocalNotification,
    toggleNotifications,
    setNotificationsOpen,
  };
}
