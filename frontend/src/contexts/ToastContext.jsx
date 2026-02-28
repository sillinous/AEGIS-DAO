import { createContext, useCallback, useContext, useState, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    const newToast = { id, ...toast, timestamp: Date.now() };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5

    if (toast.duration !== 0) {
      const timer = setTimeout(() => removeToast(id), toast.duration || 5000);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  const toast = useCallback({
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message, duration: 8000 }),
    info: (title, message) => addToast({ type: 'info', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    tx: (title, hash) => addToast({ type: 'tx', title, hash, duration: 6000 }),
    pending: (title) => addToast({ type: 'pending', title, duration: 0 }),
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-slide-up rounded-xl border bg-gray-900 p-4 shadow-2xl shadow-black/40"
          style={{
            borderColor: t.type === 'success' ? 'rgba(74,222,128,0.3)' :
              t.type === 'error' ? 'rgba(248,113,113,0.3)' :
              t.type === 'warning' ? 'rgba(251,191,36,0.3)' :
              t.type === 'pending' ? 'rgba(129,140,248,0.3)' :
              t.type === 'tx' ? 'rgba(74,222,128,0.3)' :
              'rgba(107,114,128,0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              {t.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              )}
              {t.type === 'tx' && (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t.type === 'pending' && (
                <svg className="w-5 h-5 text-aegis-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{t.title}</p>
              {t.message && (
                <p className="text-xs text-gray-400 mt-0.5 break-words">{t.message}</p>
              )}
              {t.hash && (
                <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{t.hash}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
