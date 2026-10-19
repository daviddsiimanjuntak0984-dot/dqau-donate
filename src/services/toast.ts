/**
 * Toast Notification Service for Dqua Donate
 * Replaces window.alert with smooth in-app cyber toast notifications
 */

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

type ToastListener = (toasts: ToastMessage[]) => void;

let listeners: ToastListener[] = [];
let activeToasts: ToastMessage[] = [];

export const showToast = (
  message: string, 
  type: 'success' | 'info' | 'warning' | 'error' = 'info'
) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, message, type };
  activeToasts = [...activeToasts, newToast];
  listeners.forEach(l => l(activeToasts));

  setTimeout(() => {
    activeToasts = activeToasts.filter(t => t.id !== id);
    listeners.forEach(l => l(activeToasts));
  }, 4000);
};

export const subscribeToasts = (listener: ToastListener) => {
  listeners.push(listener);
  listener(activeToasts);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
