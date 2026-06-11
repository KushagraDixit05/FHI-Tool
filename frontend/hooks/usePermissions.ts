'use client';

import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/constants';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const can = (permission: keyof typeof PERMISSIONS): boolean => {
    if (!user) return false;
    return (PERMISSIONS[permission] as readonly string[]).includes(user.role);
  };

  return { can, role: user?.role };
}
