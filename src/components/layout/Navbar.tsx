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
  User,
  ChevronDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, profile, isDemoMode, currentDemoPersona, switchDemoPersona, resetDemoData, signOut, enterDemoMode } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-money', label: 'My Money', icon: Wallet },
    { to: '/insights', label: 'Understand My Money', icon: Sparkles },
    { to: '/passport', label: 'Financial Passport', icon: FileCheck2 },
    { to: '/documents', label: 'Documents', icon: FileText }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Judge Demo Banner */}
      {isDemoMode && currentDemoPersona && (
        <div className="bg-gradient-to-r from-brand-900 to-navy-900 text-white text-xs py-1.5 px-4">
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

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span>Switch Persona</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-60 rounded-md bg-white text-slate-800 shadow-xl border border-slate-200 py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona('priya');
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col ${
                        currentDemoPersona.id === 'priya' ? 'bg-brand-50 font-semibold text-brand-900' : ''
                      }`}
                    >
                      <span className="font-medium text-slate-900">Priya Sharma (Freelancer)</span>
                      <span className="text-[11px] text-slate-500">₹62k/mo • Graphic Designer, Pune</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona('aarav');
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col ${
                        currentDemoPersona.id === 'aarav' ? 'bg-brand-50 font-semibold text-brand-900' : ''
                      }`}
                    >
                      <span className="font-medium text-slate-900">Aarav Patel (Student)</span>
                      <span className="text-[11px] text-slate-500">₹20k/mo • Tutoring & Stipend, Bengaluru</span>
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
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-brand-400 shadow-sm group-hover:bg-slate-800 transition-colors">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy-900 font-heading">NEXUS</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-500 font-medium -mt-1">
                Financial Identity
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {(user || isDemoMode) && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-50 text-brand-800 border-b-2 border-brand-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user || isDemoMode ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {profile?.fullName || (isDemoMode ? currentDemoPersona?.name : 'Nexus Member')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {profile?.occupation || 'Freelancer'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                  className="px-3.5 py-2 text-sm font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200 shadow-sm"
                >
                  Explore Demo
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {!user && !isDemoMode && (
              <button
                type="button"
                onClick={() => enterDemoMode('priya')}
                className="px-2.5 py-1.5 text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-200 rounded-md"
              >
                Demo
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {(user || isDemoMode) ? (
            <>
              <div className="px-3 py-2 bg-slate-50 rounded-lg mb-3">
                <div className="text-xs text-slate-500">Signed in as</div>
                <div className="font-semibold text-slate-800">{profile?.fullName || 'Nexus Member'}</div>
                <div className="text-xs text-brand-700 font-medium">{profile?.occupation || 'Freelancer'}</div>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  enterDemoMode('priya');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-50 text-brand-800 border border-brand-200"
              >
                Explore Demo Mode
              </button>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-navy-900"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
