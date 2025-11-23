'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const { user, isLoading, checkAuth } = useAuth();
  const [cookieStatus, setCookieStatus] = useState<string>('');

  useEffect(() => {
    // Check if we can access cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie;
      setCookieStatus(cookies);
    }
  }, []);

  const handleTestAuth = async () => {
    console.log('Testing authentication...');
    await checkAuth();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Context Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
            <button
              onClick={handleTestAuth}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Auth Check
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookie Status</h2>
          <div className="space-y-2">
            <p><strong>Document Cookie:</strong></p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {cookieStatus || 'No cookies found'}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test API Calls</h2>
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/me', {
                    credentials: 'include'
                  });
                  const data = await response.json();
                  console.log('API Response:', { status: response.status, data });
                  alert(`API Status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  console.error('API Error:', error);
                  alert(`API Error: ${error}`);
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-4"
            >
              Test /api/auth/me
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/health');
                  const data = await response.json();
                  console.log('Health Response:', data);
                  alert(`Health Status: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  console.error('Health Error:', error);
                  alert(`Health Error: ${error}`);
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test /api/health
            </button>
          </div>
        </div>

        <div className="mt-8">
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}