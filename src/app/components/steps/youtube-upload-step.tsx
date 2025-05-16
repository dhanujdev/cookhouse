
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Loader2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Metadata } from '@/types'; 

interface YouTubeUploadStepProps {
  videoFile: File | null;
  videoFileDetails: { name: string; type: string; size: number } | null; // For displaying info if File object is lost
  metadata: Metadata | null;
  onUploadComplete: (url: string) => void;
  onReset: () => void; 
  onPrepareOAuth: () => void; // Callback to save app state before redirect
  disabled?: boolean;
}

const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const SETTINGS_STORAGE_KEY = 'vidtune_app_settings';
const CORRECT_YOUTUBE_CALLBACK_PATH = "/youtube-callback"; 

interface AppSettings {
  youtubeClientId: string;
  googleAiApiKey: string; 
}

export default function YouTubeUploadStep({ 
  videoFile, 
  videoFileDetails,
  metadata, 
  onUploadComplete, 
  onReset, 
  onPrepareOAuth,
  disabled 
}: YouTubeUploadStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [effectiveClientId, setEffectiveClientId] = useState<string | null>(process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || null);
  const { toast } = useToast();

  const envRedirectUriPath = process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI;

  useEffect(() => {
    // console.log('[YouTubeUploadStep] Value of process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI:', envRedirectUriPath);
    // if (envRedirectUriPath && envRedirectUriPath !== CORRECT_YOUTUBE_CALLBACK_PATH) {
    //     console.warn(`[YouTubeUploadStep] WARNING: process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI is "${envRedirectUriPath}" but using "${CORRECT_YOUTUBE_CALLBACK_PATH}" for authentication.`);
    // }
  }, [envRedirectUriPath]);

  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    let clientIdFromStorage: string | null = null;
    if (storedSettings) {
      try {
        const settings: AppSettings = JSON.parse(storedSettings);
        if (settings.youtubeClientId) {
          clientIdFromStorage = settings.youtubeClientId;
        }
      } catch (error) {
        console.error("Failed to parse settings from localStorage for Client ID", error);
      }
    }
    setEffectiveClientId(clientIdFromStorage || process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || null);

    const storedToken = localStorage.getItem('youtube_access_token');
    const storedError = localStorage.getItem('youtube_auth_error');

    if (storedToken) {
      setAccessToken(storedToken);
      // No longer removing token here, VidTunePage handles it after successful use or full reset
    }
    if (storedError) {
      setAuthError(storedError);
      toast({ title: 'Authentication Failed', description: storedError, variant: 'destructive' });
      localStorage.removeItem('youtube_auth_error');
    }
  }, [toast]);

  const handleAuthenticate = () => {
    onPrepareOAuth(); // Save app state before redirecting

    if (!effectiveClientId || effectiveClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      toast({
        title: 'Configuration Error',
        description: 'YouTube Client ID is not configured correctly. Please check your .env file or the in-app Settings page, and ensure you have replaced placeholders with actual values.',
        variant: 'destructive',
      });
      console.error('YouTube Client ID is not configured. Effective Client ID:', effectiveClientId);
      return;
    }
    if (!CORRECT_YOUTUBE_CALLBACK_PATH) { 
        toast({
            title: 'Internal Configuration Error',
            description: 'The YouTube callback path is not defined internally. This is unexpected.',
            variant: 'destructive',
        });
        console.error('Internal error: CORRECT_YOUTUBE_CALLBACK_PATH is not set.');
        return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    const redirectUri = `${window.location.origin}${CORRECT_YOUTUBE_CALLBACK_PATH}`; 
    
    // console.log('[YouTubeUploadStep] Authenticating with Client ID:', effectiveClientId);
    // console.log('[YouTubeUploadStep] Using Redirect URI for Google:', redirectUri);
    // console.log('[YouTubeUploadStep] window.location.origin:', window.location.origin);
    // console.log('[YouTubeUploadStep] (env NEXT_PUBLIC_YOUTUBE_REDIRECT_URI was:', envRedirectUriPath, ')');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${effectiveClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(YOUTUBE_UPLOAD_SCOPE)}&include_granted_scopes=true`;
    
    // console.log('Attempting to authenticate with authUrl:', authUrl);
    // console.log('Ensure your Google Cloud Console OAuth Client ID has this EXACT redirect URI registered:', redirectUri);
    // console.log('And this Client ID:', effectiveClientId);
    // console.log('And that Authorized JavaScript Origins includes:', window.location.origin);

    window.location.href = authUrl;
  };

  const handleUpload = async () => {
    if (!videoFile) {
       toast({
        title: 'Video File Missing',
        description: 'The video file is not available. Please go back to Step 1 to select it again.',
        variant: 'destructive',
      });
      return;
    }
    if (!metadata || !accessToken) {
      toast({
        title: 'Missing Information',
        description: 'Metadata or authentication token is missing.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    const ytMetadata = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: "22", 
      },
      status: {
        privacyStatus: "private", 
        selfDeclaredMadeForKids: false,
      },
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(ytMetadata)], { type: 'application/json; charset=UTF-8' }));
    formData.append('video', videoFile);

    try {
      const response = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.id) {
        const videoUrl = `https://www.youtube.com/watch?v=${result.id}`;
        setUploadedUrl(videoUrl);
        onUploadComplete(videoUrl);
        localStorage.removeItem('youtube_access_token'); // Clean up token after successful use
        toast({
          title: 'Upload Successful!',
          description: `${videoFile.name} is now on YouTube.`,
        });
      } else {
        console.error('YouTube API Error:', result);
        const errorMessage = result.error?.message || 'Failed to upload video to YouTube.';
        setAuthError(errorMessage); 
        if (response.status === 401) { 
             localStorage.removeItem('youtube_access_token'); 
             setAccessToken(null); 
             toast({ title: 'Authentication Error', description: 'Your session may have expired. Please authenticate again.', variant: 'destructive' });
        } else {
            toast({ title: 'Upload Failed', description: errorMessage, variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during upload.';
      setAuthError(message);
      toast({
        title: 'Upload Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetFlow = () => {
    // No longer removing token here, onReset (VidTunePage.resetToStep1) handles it
    setAccessToken(null); // Clear local component access token state
    setAuthError(null);
    setUploadedUrl(null);
    setIsLoading(false);
    setIsAuthenticating(false);
    onReset(); 
  }
  
  const isEnvConfigError = !effectiveClientId || effectiveClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE' || !process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI;
   
  if (isEnvConfigError && (!envRedirectUriPath || envRedirectUriPath !== CORRECT_YOUTUBE_CALLBACK_PATH)) {
     return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" /> Configuration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            YouTube Client ID is not configured or is still a placeholder. Please set <code>NEXT_PUBLIC_YOUTUBE_CLIENT_ID</code> in your <code>.env</code> file, or set it on the <Link href="/settings" className="underline">Settings page</Link>.
            <br/>
            Also, ensure <code>NEXT_PUBLIC_YOUTUBE_REDIRECT_URI</code> in your <code>.env</code> file is set to <code>{CORRECT_YOUTUBE_CALLBACK_PATH}</code>. Currently, it might be misconfigured or missing in your environment.
            Value found for <code>NEXT_PUBLIC_YOUTUBE_REDIRECT_URI</code>: <strong>{envRedirectUriPath || "Not set"}</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Make sure to also configure Authorized JavaScript origins and the correct Redirect URI (<code>{typeof window !== 'undefined' ? window.location.origin : ''}{CORRECT_YOUTUBE_CALLBACK_PATH}</code>) in your Google Cloud Console for the Client ID you are using.
          </p>
        </CardContent>
         <CardFooter className="justify-center">
          <Button variant="outline" onClick={handleResetFlow} className="w-full sm:w-auto">
            Reset / Start Over
          </Button>
      </CardFooter>
      </Card>
    );
  }

  // If videoFile is null but videoFileDetails exists, it means we came from a redirect and lost the File object.
  const videoObjectMissing = !videoFile && !!videoFileDetails;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-500" />
          <CardTitle>Step 5: Upload to YouTube</CardTitle>
        </div>
        <CardDescription>
          {accessToken ? "Finalize and upload your processed video to YouTube." : "Authenticate with Google to upload your video to YouTube."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {authError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
            <p>{authError}</p>
          </div>
        )}

        {!uploadedUrl ? (
          !accessToken ? (
            <Button 
              onClick={handleAuthenticate} 
              disabled={disabled || isAuthenticating || videoObjectMissing} 
              className="w-full max-w-xs mx-auto"
              size="lg"
              aria-label={videoObjectMissing ? "Video file needs re-selection, authentication disabled" : "Authenticate with Google"}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting to Google...
                </>
              ) : (
                <>
                 <Youtube className="mr-2 h-5 w-5" /> Authenticate with Google
                </>
              )}
            </Button>
          ) : (
            <>
              <p className="text-muted-foreground">
                Ready to upload {videoFile ? <span className="font-semibold text-foreground">{videoFile.name}</span> : (videoFileDetails ? <span className="font-semibold text-foreground">{videoFileDetails.name}</span> : "your video")} to YouTube?
              </p>
              <Button 
                onClick={handleUpload} 
                disabled={disabled || isLoading || !videoFile || !metadata || videoObjectMissing} 
                className="w-full max-w-xs mx-auto"
                size="lg"
                aria-label={videoObjectMissing ? "Video file needs re-selection, upload disabled" : "Upload to YouTube"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                   <Youtube className="mr-2 h-5 w-5" /> Upload to YouTube
                  </>
                )}
              </Button>
            </>
          )
        ) : (
          <div className="space-y-4 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-semibold text-green-700">Video Uploaded!</h3>
            <p className="text-green-600">
              {videoFile?.name || videoFileDetails?.name || 'Your video'} has been successfully uploaded to YouTube.
            </p>
            <Link
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
            >
              View on YouTube <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}
        {videoObjectMissing && !uploadedUrl && (
           <p className="text-sm text-destructive mt-2">
             The video file needs to be re-selected. Please go back to Step 1.
           </p>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="outline" onClick={handleResetFlow} className="w-full sm:w-auto">
          {uploadedUrl ? 'Process Another Video' : 'Reset / Start Over'}
        </Button>
      </CardFooter>
    </Card>
  );
}
