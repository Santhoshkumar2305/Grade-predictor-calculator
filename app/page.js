'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '../lib/auth';

function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();

    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);
  return (
    <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Loading...</h1>
      <p>Redirecting you to the appropriate page.</p>
    </div>
  );
}

export default HomePage;