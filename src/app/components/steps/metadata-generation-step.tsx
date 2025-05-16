
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Loader2, Tag, RotateCcw, Edit3, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateVideoMetadata, type GenerateVideoMetadataOutput } from '@/ai/flows/generate-video-metadata';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MetadataGenerationStepProps {
  videoFile: File | null;
  videoFileDetails: { name: string; type: string; size: number } | null;
  onMetadataGenerated: (metadata: GenerateVideoMetadataOutput) => void;
  initialMetadata?: GenerateVideoMetadataOutput | null;
  disabled?: boolean;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function MetadataGenerationStep({ videoFile, videoFileDetails, onMetadataGenerated, initialMetadata, disabled }: MetadataGenerationStepProps) {
  const [videoSummary, setVideoSummary] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialMetadata) {
      setTitle(initialMetadata.title);
      setDescription(initialMetadata.description);
      setTags(initialMetadata.tags);
      if (initialMetadata.title || initialMetadata.description || initialMetadata.tags.length > 0) {
        setHasGeneratedOnce(true); 
      }
    } else {
      setTitle('');
      setDescription('');
      setTags([]);
      setHasGeneratedOnce(false);
    }
  }, [initialMetadata]);


  const handleGenerateMetadata = async () => {
    if (!videoFile && !videoFileDetails) { 
      toast({
        title: 'Video File Required',
        description: 'A video file must be selected to generate metadata.',
        variant: 'destructive',
      });
      return;
    }
    if (!videoFile && videoFileDetails) { 
       toast({
        title: 'Video File Lost',
        description: `The video file "${videoFileDetails.name}" needs to be re-selected. Please go to Step 1.`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const videoDataUri = await fileToDataUri(videoFile!); 
      const result = await generateVideoMetadata({ 
        videoDataUri, 
        videoDescription: videoSummary.trim() || undefined 
      });
      setTitle(result.title);
      setDescription(result.description);
      setTags(result.tags);
      setHasGeneratedOnce(true);
      toast({
        title: hasGeneratedOnce ? 'Metadata Re-generated' : 'Metadata Generated',
        description: 'AI has processed your video content.',
      });
    } catch (error) {
      console.error('Error generating metadata:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate metadata. Please try a shorter or smaller video file, or simplify the video summary.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!title || !description || tags.length === 0) {
      toast({
        title: 'Incomplete Metadata',
        description: 'Please ensure title, description, and at least one tag are present.',
        variant: 'destructive',
      });
      return;
    }
    onMetadataGenerated({ title, description, tags });
  };
  
  const canGenerate = !!(videoFile || videoFileDetails);
  const videoObjectMissing = !videoFile && !!videoFileDetails;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          {hasGeneratedOnce ? <Edit3 className="h-6 w-6 text-accent" /> : <Wand2 className="h-6 w-6 text-accent" />}
          <CardTitle>{hasGeneratedOnce ? 'Step 3: Review & Edit Metadata' : 'Step 3: Generate Metadata'}</CardTitle>
        </div>
        <CardDescription>
          {hasGeneratedOnce 
            ? 'Review, edit, or re-generate the AI-powered metadata for your video.'
            : 'The AI will analyze your video content. Optionally add a summary for more context.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {videoObjectMissing && (
          <Alert variant="warning" className="mb-4"> {/* Changed from destructive to warning */}
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Video File Action Required</AlertTitle>
            <AlertDescription>
              The video file ({videoFileDetails?.name}) needs to be re-selected at Step 1 to enable AI generation. Your previous metadata (if any) is shown below for editing.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="video-summary">Video Content Summary (Optional)</Label>
          <Textarea
            id="video-summary"
            placeholder="e.g., A tutorial on how to bake a chocolate cake, featuring tips for beginners and common mistakes..."
            value={videoSummary}
            onChange={(e) => setVideoSummary(e.target.value)}
            className="min-h-[100px]"
            disabled={disabled || isLoading}
          />
           <p className="text-xs text-muted-foreground">
            The AI will primarily analyze the video frames. This summary can provide additional context or highlight key points.
          </p>
        </div>
        <Button 
          onClick={handleGenerateMetadata} 
          disabled={disabled || isLoading || !canGenerate || videoObjectMissing} 
          className="w-full sm:w-auto"
          aria-label={!canGenerate ? "Upload a video first to enable metadata generation" : (videoObjectMissing ? "Video file needs re-selection" : (hasGeneratedOnce ? "Re-generate metadata with AI" : "Generate metadata with AI"))}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (hasGeneratedOnce ? <RotateCcw className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />)}
          {hasGeneratedOnce ? 'Re-generate with AI' : 'Generate with AI'}
        </Button>
        
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video Title" disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Video Description" className="min-h-[120px]" disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input 
                id="tags-input" 
                value={currentTag} 
                onChange={(e) => setCurrentTag(e.target.value)} 
                placeholder="Add a tag" 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag();}}}
                disabled={disabled} 
                className="flex-grow"
              />
              <Button variant="outline" onClick={handleAddTag} disabled={disabled || !currentTag.trim()}>Add Tag</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-muted-foreground hover:text-foreground" disabled={disabled}>
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
             {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags added yet. AI can generate these, or you can add them manually.</p>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={disabled || !title || !description || tags.length === 0} className="w-full sm:w-auto">
          Confirm Metadata &amp; Proceed
        </Button>
      </CardFooter>
    </Card>
  );
}
