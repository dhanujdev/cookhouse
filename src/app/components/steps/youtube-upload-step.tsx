"use client";
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface YouTubeUploadStepProps {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
  videoFileName?: string | null;
}

export default function YouTubeUploadStep({ onUploadComplete, disabled, videoFileName }: YouTubeUploadStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    
    // In a real app, you'd call the YouTube Data API v3 here.
    // For now, we'll simulate success.
    const fakeYouTubeUrl = `https://www.youtube.com/watch?v=example123`;
    setUploadedUrl(fakeYouTubeUrl);
    onUploadComplete(fakeYouTubeUrl);
    
    toast({
      title: 'Upload Successful!',
      description: `${videoFileName || 'Your video'} is now live on YouTube (simulated).`,
    });
    setIsLoading(false);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-600" />
          <CardTitle>Step 5: Upload to YouTube</CardTitle>
        </div>
        <CardDescription>Finalize and upload your processed video to YouTube.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {!uploadedUrl ? (
          <>
            <p className="text-muted-foreground">
              Ready to upload {videoFileName ? <span className="font-semibold text-foreground">{videoFileName}</span> : "your video"} to YouTube?
            </p>
            <Button 
              onClick={handleUpload} 
              disabled={disabled || isLoading} 
              className="w-full max-w-xs mx-auto"
              size="lg"
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
        ) : (
          <div className="space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold text-green-700">Video Uploaded!</h3>
            <p className="text-green-600">
              Your video has been successfully uploaded (simulated).
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
      </CardContent>
      {uploadedUrl && (
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
            Process Another Video
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
