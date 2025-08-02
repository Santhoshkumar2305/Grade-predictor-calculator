'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeAuthToken } from '../lib/auth';
import '../styles/globals.css';

function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="navbar-brand">Grade Predictor</Link>
      <div className="navbar-links">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/predict">Predict Grade</Link>
        <Link href="/history">View History</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
export default Navbar;