'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Toast from './Toast';
import { bus, TOPIC, type ToastPayload } from '@/lib/eventBus';

export type NotifyFn = (payload: ToastPayload) => void;

const Ctx = createContext<NotifyFn>(() => {});

export function useNotify() { return useContext(Ctx); }

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<Required<ToastPayload>>>([]);
  const onClose = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);

  const notify = useCallback<NotifyFn>(({ message, type = 'info', id }) => {
    const tid = id ?? Math.random().toString(36).slice(2, 9);
    setToasts(t => [...t, { id: tid, message, type }]);
  }, []);

  useEffect(() => {
    const off = bus.on<ToastPayload>(TOPIC.TOAST, (p) => notify(p));
    return () => off();
  }, [notify]);

  const value = useMemo(() => notify, [notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => <Toast key={t.id} id={t.id} message={t.message} type={t.type} onClose={onClose} />)}
      </div>
    </Ctx.Provider>
  );
}
