import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Sparkles,
  FileCheck2,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronDown,
  RefreshCw,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PrivacySettingsModal } from '../common/PrivacySettingsModal';

export const Navbar: React.FC = () => {
  const { user, profile, isDemoMode, currentDemoPersona, switchDemoPersona, resetDemoData, signOut, enterDemoMode } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-money', label: 'My Money', icon: Wallet },
    { to: '/insights', label: 'Understand My Money', icon: Sparkles },
    { to: '/passport', label: 'Financial Passport', icon: FileCheck2 },
    { to: '/documents', label: 'Documents', icon: FileText }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Judge Demo Banner */}
      {isDemoMode && currentDemoPersona && (
        <div className="bg-gradient-to-r from-brand-900 to-navy-900 dark:from-slate-950 dark:to-[#0C1220] text-white text-xs py-1.5 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/30 text-brand-200 border border-brand-400/30">
                JUDGE DEMO MODE
              </span>
              <span className="hidden sm:inline text-slate-300">
                Viewing active persona:
              </span>
              <strong className="text-white font-medium">{currentDemoPersona.name}</strong>
              <span className="text-brand-300 hidden md:inline">({currentDemoPersona.tagline})</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
                >
                  <span>Switch Persona</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-60 rounded-lg bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona('aarav');
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col ${
                        currentDemoPersona.id === 'aarav' ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-900 dark:text-brand-300' : ''
                      }`}
                    >
                      <span className="font-medium text-slate-900 dark:text-white">Profile A: Aarav Patel (Student)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">₹20k/mo • Limited Income, Student Tutor, Bengaluru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona('priya');
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col ${
                        currentDemoPersona.id === 'priya' ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-900 dark:text-brand-300' : ''
                      }`}
                    >
                      <span className="font-medium text-slate-900 dark:text-white">Profile B: Priya Sharma (Freelancer)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">₹62k/mo • Irregular Income & Retainer, Pune</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona('business');
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col ${
                        currentDemoPersona.id === 'vikram' ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-900 dark:text-brand-300' : ''
                      }`}
                    >
                      <span className="font-medium text-slate-900 dark:text-white">Profile C: Vikram Malhotra (Small Business)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">₹1.4L/mo • Café Owner, Operating Expenses, Jaipur</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={resetDemoData}
                title="Reset this persona's records to original clean state"
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
                className="text-slate-400 hover:text-rose-300 transition-colors ml-1"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-navy-900 dark:bg-brand-950 flex items-center justify-center text-brand-400 shadow-sm group-hover:bg-slate-800 dark:group-hover:bg-brand-900 transition-colors border dark:border-brand-800/50">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white font-heading">NEXUS</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium -mt-1">
                Financial Identity
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {(user || isDemoMode) && (
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Actions & Theme Toggle */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 animate-fadeIn" />
              )}
            </button>

            {user || isDemoMode ? (
              <div className="flex items-center gap-3 ml-1">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                    {profile?.fullName || (isDemoMode ? currentDemoPersona?.name : 'Nexus Member')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {profile?.occupation || 'Freelancer'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title="Privacy & Data Settings"
                  aria-label="Privacy & Data Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => enterDemoMode('priya')}
                  className="px-3.5 py-2 text-sm font-semibold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg transition-colors border border-brand-200 dark:border-brand-800 shadow-xs"
                >
                  Explore Demo
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 rounded-lg shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle + Theme Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 active:scale-95"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {!user && !isDemoMode && (
              <button
                type="button"
                onClick={() => enterDemoMode('priya')}
                className="px-2.5 py-1 text-xs font-semibold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 rounded-md"
              >
                Demo
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu - 100% Solid Opacity */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] px-4 pt-3 pb-6 space-y-2 shadow-2xl opacity-100">
          {(user || isDemoMode) ? (
            <>
              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111827] rounded-lg mb-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Signed in as</div>
                <div className="font-semibold text-slate-900 dark:text-white">{profile?.fullName || 'Nexus Member'}</div>
                <div className="text-xs text-brand-700 dark:text-brand-400 font-medium">{profile?.occupation || 'Freelancer'}</div>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-semibold border-l-4 border-brand-600 dark:border-brand-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPrivacyModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>Privacy & Data Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  enterDemoMode('priya');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-50 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                Explore Demo Mode
              </button>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Privacy & Account Settings Modal */}
      <PrivacySettingsModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </header>
  );
};
