import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-surface-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'
  }`;

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-surface-800 bg-surface-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-xl font-black tracking-tight text-brand-500">
            RateFlix
          </NavLink>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              קטלוג
            </NavLink>
            {user && (
              <>
                <NavLink to="/recommendations" className={linkClass}>
                  המלצות בשבילך
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  פרופיל
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                ניהול
              </NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-500 sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-surface-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-brand-500 hover:text-brand-400"
              >
                התנתקות
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                התחברות
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                הרשמה
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
