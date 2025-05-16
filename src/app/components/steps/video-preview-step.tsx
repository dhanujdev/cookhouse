
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Music2, FileText, Tag, AlertTriangle } from 'lucide-react';
import type { AudioTrack, Metadata } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoPreviewStepProps {
  videoFile: File | null;
  videoFileDetails: { name: string; type: string; size: number } | null; // For placeholder if File object is lost
  selectedAudio: AudioTrack | null;
  metadata: Metadata | null;
  onConfirmPreview: () => void;
  disabled?: boolean;
}

export default function VideoPreviewStep({ videoFile, videoFileDetails, selectedAudio, metadata, onConfirmPreview, disabled }: VideoPreviewStepProps) {
  
  const videoUrl = videoFile ? URL.createObjectURL(videoFile) : "https://placehold.co/600x400.png?text=Video+Preview+Unavailable";
  const videoObjectMissing = !videoFile && !!videoFileDetails;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-accent" />
          <CardTitle>Step 4: Preview Video</CardTitle>
        </div>
        <CardDescription>Review your video with selected audio and generated metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {videoObjectMissing && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Video preview is unavailable as the file ({videoFileDetails?.name}) needs to be re-selected at Step 1. Your audio and metadata choices are shown below.
            </AlertDescription>
          </Alert>
        )}
        <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {videoFile ? (
             <video controls src={videoUrl} className="w-full h-full object-contain" data-ai-hint="video player"></video>
          ) : (
            <Image src={videoUrl} alt={videoObjectMissing ? `Placeholder for ${videoFileDetails?.name}` : "Video placeholder"} width={600} height={400} data-ai-hint="video placeholder" className="w-full h-full object-cover" />
          )}
        </div>
        
        {selectedAudio && (
          <div className="p-4 border rounded-md bg-secondary/30">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Music2 className="h-5 w-5 text-primary" />Selected Audio</h3>
            <p className="text-foreground">{selectedAudio.name} - <span className="text-muted-foreground">{selectedAudio.artist}</span></p>
          </div>
        )}

        {metadata && (
          <div className="p-4 border rounded-md bg-secondary/30">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Generated Metadata</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground">Title:</h4>
                <p className="text-muted-foreground">{metadata.title}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Description:</h4>
                <ScrollArea className="h-24">
                   <p className="text-muted-foreground whitespace-pre-wrap">{metadata.description}</p>
                </ScrollArea>
              </div>
              <div>
                <h4 className="font-medium text-foreground flex items-center gap-1"><Tag className="h-4 w-4" />Tags:</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {metadata.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onConfirmPreview} disabled={disabled || videoObjectMissing} className="w-full sm:w-auto">
          Looks Good, Proceed to Upload
        </Button>
      </CardFooter>
    </Card>
  );
}
