'use client';
import { useEffect, useState } from 'react';
import { bus, TOPIC } from './eventBus';
import { getCurrentUser, login as sLogin, logout as sLogout, register as sRegister, type User } from './store';

export function useAuth() {
  const [user, setUser] = useState<User | undefined>(() => getCurrentUser());
  useEffect(() => {
    const offLogin = bus.on<User>(TOPIC.LOGIN, (u) => setUser(u));
    const offLogout = bus.on(TOPIC.LOGOUT, () => setUser(undefined));
    return () => { offLogin(); offLogout(); };
  }, []);
  return { user, login: sLogin, logout: sLogout, register: sRegister };
}