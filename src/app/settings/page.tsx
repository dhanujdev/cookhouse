
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SETTINGS_STORAGE_KEY = 'vidtune_app_settings';

interface AppSettings {
  youtubeClientId: string;
  googleAiApiKey: string;
}

export default function SettingsPage() {
  const [youtubeClientId, setYoutubeClientId] = useState('');
  const [googleAiApiKey, setGoogleAiApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        const settings: AppSettings = JSON.parse(storedSettings);
        setYoutubeClientId(settings.youtubeClientId || '');
        setGoogleAiApiKey(settings.googleAiApiKey || '');
      } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    const settings: AppSettings = {
      youtubeClientId: youtubeClientId.trim(),
      googleAiApiKey: googleAiApiKey.trim(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved to browser localStorage.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Configure API keys and client IDs for application services. These settings are stored in your browser&apos;s localStorage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                Storing API keys directly in the browser (localStorage) is not recommended for production applications as they can be accessed by malicious scripts. For production, critical keys like the Google AI API Key should be managed via secure server-side environment variables. The YouTube Client ID is generally safer for client-side use when configured with proper redirect URIs.
                <br />
                <strong>The YouTube Client Secret should NEVER be stored here or anywhere in client-side code.</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="youtubeClientId">YouTube OAuth Client ID</Label>
              <Input
                id="youtubeClientId"
                value={youtubeClientId}
                onChange={(e) => setYoutubeClientId(e.target.value)}
                placeholder="Enter your YouTube OAuth Client ID"
              />
              <p className="text-xs text-muted-foreground">
                Used for uploading videos to YouTube. This will override the value set in <code>.env</code> if provided.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleAiApiKey">Google AI API Key (for Genkit)</Label>
              <Input
                id="googleAiApiKey"
                type="password"
                value={googleAiApiKey}
                onChange={(e) => setGoogleAiApiKey(e.target.value)}
                placeholder="Enter your Google AI API Key"
              />
               <Alert variant="default" className="mt-2">
                <Info className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  The AI-powered metadata generation (Genkit flow) runs on the server. It <strong>will NOT use an API key entered here.</strong>
                  It relies on a <code>GOOGLE_API_KEY</code> environment variable configured in your server&apos;s deployment environment. This input is provided for completeness but does not affect the current backend AI functionality.
                </AlertDescription>
              </Alert>
            </div>
            
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
