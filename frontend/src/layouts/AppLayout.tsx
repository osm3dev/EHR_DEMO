import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui';
import { useStore } from '@/store/useStore';

export function AppLayout() {
  const currentUser = useStore((s) => s.currentUser);
  const [mobileNav, setMobileNav] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f9]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onClose={() => setMobileNav(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileNav(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
