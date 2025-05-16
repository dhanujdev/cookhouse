"use client";

import type React from 'react';
import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Film, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadStepProps {
  onVideoUploaded: (file: File) => void;
  disabled?: boolean;
}

export default function VideoUploadStep({ onVideoUploaded, disabled }: VideoUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setFileName(file.name);
        toast({
          title: 'Video Selected',
          description: `${file.name} is ready to be processed.`,
        });
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a valid video file (e.g., MP4, MOV).',
          variant: 'destructive',
        });
        setSelectedFile(null);
        setFileName(null);
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onVideoUploaded(selectedFile);
    } else {
      toast({
        title: 'No Video Selected',
        description: 'Please select a video file to upload.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-accent" />
          <CardTitle>Step 1: Upload Video</CardTitle>
        </div>
        <CardDescription>Select a video file from your device (MP4, MOV).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-upload" className="sr-only">Upload Video</Label>
          <Input
            id="video-upload"
            type="file"
            accept="video/mp4,video/mov"
            onChange={handleFileChange}
            className="file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:rounded-md file:border-0 file:px-4 file:py-2 file:mr-4"
            disabled={disabled}
          />
        </div>
        {fileName && (
          <div className="flex items-center gap-2 p-3 rounded-md border bg-secondary/50">
            <Film className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-foreground truncate">{fileName}</span>
            <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!selectedFile || disabled} className="w-full sm:w-auto">
          Confirm Video &amp; Proceed
        </Button>
      </CardFooter>
    </Card>
  );
}
