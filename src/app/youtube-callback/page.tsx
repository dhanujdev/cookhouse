
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function YouTubeCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const error = params.get('error');

      if (error) {
        console.error('YouTube OAuth Error:', error);
        localStorage.setItem('youtube_auth_error', `OAuth Error: ${error}. Please try authenticating again.`);
        localStorage.removeItem('youtube_access_token');
        setMessage(`Authentication failed: ${error}`);
      } else if (accessToken) {
        localStorage.setItem('youtube_access_token', accessToken);
        localStorage.removeItem('youtube_auth_error'); // Clear any previous error
        setMessage('Authentication successful! Redirecting...');
      } else {
        // No token and no error, unusual state.
        localStorage.setItem('youtube_auth_error', 'Authentication failed. No access token or error received.');
        localStorage.removeItem('youtube_access_token');
        setMessage('Authentication failed. Invalid response from Google.');
      }
      
      // Redirect back to the main page, which will handle the token/error from localStorage
      // Using a small delay to allow the user to see the message if needed.
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">You will be redirected shortly.</p>
    </div>
  );
}
