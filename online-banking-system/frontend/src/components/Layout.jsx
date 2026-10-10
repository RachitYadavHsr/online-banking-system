import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/beneficiaries', label: 'Beneficiaries' },
  { to: '/transfer', label: 'Transfer Funds' },
  { to: '/bills', label: 'Bill Payments' },
  { to: '/deposits', label: 'Deposits' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-navy text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="font-serif text-xl font-bold leading-tight">Online Banking<br />System</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-gold text-navy' : 'text-ice hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-ice/70 mb-1">Signed in as</p>
          <p className="text-sm font-semibold truncate mb-3">{user?.username}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ice hover:bg-white/10"
          >
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
