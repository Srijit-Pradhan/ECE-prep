import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  Upload,
  UserPlus,
  X,
} from "lucide-react";

// Build classes in a very direct way so beginners can follow each condition.
const getNavItemClass = (isDark, isActive) => {
  const base = "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition";

  if (isActive && isDark) {
    return `${base} border-teal-400 bg-teal-900/30 text-teal-200`;
  }

  if (isActive && !isDark) {
    return `${base} border-teal-700 bg-teal-50 text-teal-800`;
  }

  if (!isActive && isDark) {
    return `${base} border-slate-700 text-slate-100 hover:bg-slate-800`;
  }

  return `${base} border-slate-300 text-slate-700 hover:bg-slate-100`;
};

const SidebarMenu = ({
  isOpen,
  onClose,
  isAuthenticated,
  isAdmin,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  // We compute this once and reuse it in class names.
  const isDark = theme === "dark";

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-slate-900/40"
      />

      <aside className="fixed top-0 right-0 z-40 h-screen w-[88vw] max-w-xs border-l border-slate-200 bg-white p-4 shadow-2xl md:w-80">
        <div className="mb-4 flex items-center justify-between">
          <p className={`flex items-center gap-2 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-700"}`}>
            <Menu size={16} /> Navigation
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border p-2 transition ${
              isDark
                ? "border-slate-700 text-slate-100 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {isAdmin && (
          <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
            <Shield size={12} /> Admin Panel
          </p>
        )}

        <div className="grid gap-2">
          {!isAuthenticated && (
            <>
              <Link to="/login" onClick={onClose} className={getNavItemClass(isDark, false)}>
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" onClick={onClose} className={getNavItemClass(isDark, false)}>
                <UserPlus size={16} /> Register
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                onClick={onClose}
                className={({ isActive }) => getNavItemClass(isDark, isActive)}
              >
                <LayoutDashboard size={16} /> Dashboard
              </NavLink>
              <NavLink
                to="/upload"
                onClick={onClose}
                className={({ isActive }) => getNavItemClass(isDark, isActive)}
              >
                <Upload size={16} /> Upload
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) => getNavItemClass(isDark, isActive)}
                >
                  <Shield size={16} /> Admin Panel
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className={`mt-5 border-t pt-4 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
              isDark
                ? "border-slate-700 text-slate-100 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={onLogout}
              className={`mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-white transition ${
                isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-900 hover:bg-slate-700"
              }`}
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default SidebarMenu;
