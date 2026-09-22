'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { removeAuthToken, getUserEmail } from '../lib/auth';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = getUserEmail();
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <header className="navbar">
      <div className="navBrandWrapper">
        <div className="brandLogo">🎓</div>
        <Link href="/dashboard" className="navbar-brand">
          GradeTrack
        </Link>
      </div>

      <nav className="navbar-links">
        <Link
          href="/dashboard"
          className={`navLink ${pathname === '/dashboard' ? 'navLinkActive' : ''}`}
        >
          <span>📊</span> Dashboard
        </Link>
        <Link
          href="/predict"
          className={`navLink ${pathname === '/predict' ? 'navLinkActive' : ''}`}
        >
          <span>🧮</span> Calculate & Plan
        </Link>
        <Link
          href="/visuals"
          className={`navLink ${pathname === '/visuals' ? 'navLinkActive' : ''}`}
        >
          <span>📈</span> Visuals
        </Link>
        <Link
          href="/history"
          className={`navLink ${pathname === '/history' ? 'navLinkActive' : ''}`}
        >
          <span>📜</span> History & Audit
        </Link>

        {userEmail && (
          <div className="userBadge" title={`Logged in as ${userEmail}`}>
            <span className="userDot"></span>
            <span className="userEmailText">{userEmail}</span>
          </div>
        )}

        <button type="button" onClick={handleLogout} className="logoutBtn">
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Navbar;