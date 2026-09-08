import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CircleHelp, LogOut, Menu, RotateCcw, Search, UserRound } from 'lucide-react';
import { useStore, resetDemoData } from '@/store/useStore';
import { Avatar, SeverityBadge } from '@/components/ui';
import { fromNow } from '@/utils/format';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/utils/cn';

export function Header({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const currentUser = useStore((s) => s.currentUser)!;
  const facilityFilter = useStore((s) => s.facilityFilter);
  const setFacilityFilter = useStore((s) => s.setFacilityFilter);
  const logout = useStore((s) => s.logout);

  const [q, setQ] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(searchRef, () => setShowResults(false));
  useOnClickOutside(notifRef, () => setShowNotif(false));
  useOnClickOutside(userRef, () => setShowUser(false));

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const t = q.toLowerCase();
    return db.patients
      .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) || p.mrn.includes(t))
      .slice(0, 6);
  }, [q, db.patients]);

  const unread = db.notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/95 px-4 backdrop-blur">
      <button onClick={onMenu} className="btn-ghost p-2 lg:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      {/* Global patient search */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          className="input pl-9"
          placeholder="Search patients by name or MRN…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        {showResults && results.length > 0 && (
          <div className="absolute mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  navigate(`/patients/${p.id}`);
                  setShowResults(false);
                  setQ('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-ink-50"
              >
                <Avatar name={`${p.firstName} ${p.lastName}`} size={26} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-800">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-ink-400">MRN {p.mrn}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {showResults && q.trim().length >= 2 && results.length === 0 && (
          <div className="absolute mt-1 w-full rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-500 shadow-lg">
            No patients match “{q}”.
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <select
          aria-label="Facility selector"
          className="hidden rounded-lg border border-ink-300 bg-white py-1.5 pl-2.5 pr-7 text-xs text-ink-700 focus:border-brand-500 focus:outline-none sm:block"
          value={facilityFilter}
          onChange={(e) => setFacilityFilter(e.target.value)}
        >
          <option value="all">All Facilities</option>
          {db.facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotif((v) => !v)} className="btn-ghost relative p-2" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-1 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
              <div className="border-b border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800">Notifications</div>
              <div className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
                {db.notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.link) navigate(n.link);
                      setShowNotif(false);
                    }}
                    className={cn('block w-full px-4 py-3 text-left hover:bg-ink-50', !n.read && 'bg-brand-50/40')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-800">{n.title}</span>
                      <SeverityBadge severity={n.severity} size="sm" withDot={false} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[11px] text-ink-400">{fromNow(n.at)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn-ghost p-2" aria-label="Help">
          <CircleHelp className="h-5 w-5" />
        </button>

        {/* User dropdown */}
        <div ref={userRef} className="relative">
          <button onClick={() => setShowUser((v) => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ink-100">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size={30} />
            <div className="hidden text-left leading-tight md:block">
              <p className="text-xs font-semibold text-ink-800">
                {currentUser.name}
                {currentUser.credentials ? `, ${currentUser.credentials}` : ''}
              </p>
              <p className="text-[11px] text-ink-400">{currentUser.role}</p>
            </div>
          </button>
          {showUser && (
            <div className="absolute right-0 mt-1 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
              <div className="border-b border-ink-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-ink-800">{currentUser.name}</p>
                <p className="text-xs text-ink-400">{currentUser.email}</p>
              </div>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
                <UserRound className="h-4 w-4" /> My profile
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowUser(false);
                  useStore.getState().pushToast({ title: 'Demo data reset.', tone: 'info', body: 'All synthetic records restored to their starting state.' });
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              >
                <RotateCcw className="h-4 w-4" /> Reset demo data
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
