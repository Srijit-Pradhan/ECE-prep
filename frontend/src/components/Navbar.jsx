import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Menu, Upload } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import SidebarMenu from "./SidebarMenu";

// Simple helper for desktop nav button style.
const desktopNavClass = ({ isActive }) =>
  `hidden items-center rounded-full border px-4 py-2.5 text-sm font-semibold transition lg:inline-flex ${
    isActive
      ? "border-teal-700 bg-teal-50 text-teal-800"
      : "border-slate-300 text-slate-700 hover:bg-slate-100"
  }`;

// Keep theme-reading logic in one small function.
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("ece-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Apply selected theme to the root element.
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
    localStorage.setItem("ece-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    // Keep logout flow clear: call API/logout logic, close sidebar, go home.
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeMobileMenu} className="inline-flex items-center" aria-label="ExamPrep Home">
            <img src="/logo-navbar.svg" alt="ExamPrep" className="h-10 w-auto md:h-11 lg:h-12" />
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
                  aria-label="Dashboard"
                  title="Dashboard"
                >
                  <LayoutDashboard size={18} />
                </NavLink>
                <NavLink
                  to="/upload"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
                  aria-label="Upload"
                  title="Upload"
                >
                  <Upload size={18} />
                </NavLink>
              </>
            )}

            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={desktopNavClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/upload" className={desktopNavClass}>
                  Upload
                </NavLink>
              </>
            )}

            <button
              type="button"
              onClick={openMobileMenu}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Menu size={18} /> Menu
            </button>
          </div>
        </div>
      </nav>

      <SidebarMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </header>
  );
};

export default Navbar;


