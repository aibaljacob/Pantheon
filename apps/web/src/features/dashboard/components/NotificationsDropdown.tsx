import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2 } from 'lucide-react';
import { apiClient } from '../../auth/services/httpClient';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export const NotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications?limit=20');
      setNotifications(response.data.items);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
        if (isMounted) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
    }

    const targetUrl =
      notification.actionUrl ||
      (notification.entityType === 'PROJECT' && notification.entityId
        ? `/projects/${notification.entityId}`
        : notification.entityType === 'TASK' && notification.entityId
        ? `/projects/${notification.entityId}?tab=tasks`
        : notification.entityType === 'PLAYTEST' && notification.entityId
        ? `/projects/${notification.entityId}?tab=playtests`
        : notification.entityType === 'APPLICATION' && notification.entityId
        ? `/projects/${notification.entityId}?tab=applications`
        : null);

    if (targetUrl) {
      setIsOpen(false);
      navigate(targetUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-pantheon-border bg-pantheon-low text-pantheon-ivory transition-colors hover:border-pantheon-border-light"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-pantheon-bg bg-pantheon-ivory" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] w-80 rounded-2xl border border-pantheon-border bg-pantheon-low p-2 shadow-2xl shadow-black/40 z-50 flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between border-b border-pantheon-border-dark px-3 py-3">
            <p className="text-sm font-semibold text-pantheon-ivory">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-pantheon-dim hover:text-pantheon-ivory transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-pantheon-dim" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-pantheon-dim">
                No notifications
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-pantheon-mid cursor-pointer ${
                      !notification.isRead ? 'bg-pantheon-mid/50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-pantheon-ivory break-words">{notification.title}</p>
                      <p className="text-xs text-pantheon-dim mt-1 break-words">{notification.message}</p>
                      <p className="text-[10px] text-pantheon-dim mt-2 font-mono">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="flex-shrink-0 text-pantheon-dim hover:text-pantheon-ivory p-1"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
