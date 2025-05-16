"use client";
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Loader2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateVideoMetadata, type GenerateVideoMetadataOutput } from '@/ai/flows/generate-video-metadata';
import { Badge } from '@/components/ui/badge';

interface MetadataGenerationStepProps {
  onMetadataGenerated: (metadata: GenerateVideoMetadataOutput) => void;
  initialMetadata?: GenerateVideoMetadataOutput | null;
  disabled?: boolean;
}

export default function MetadataGenerationStep({ onMetadataGenerated, initialMetadata, disabled }: MetadataGenerationStepProps) {
  const [videoSummary, setVideoSummary] = useState('');
  const [title, setTitle] = useState(initialMetadata?.title || '');
  const [description, setDescription] = useState(initialMetadata?.description || '');
  const [tags, setTags] = useState<string[]>(initialMetadata?.tags || []);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateMetadata = async () => {
    if (!videoSummary.trim()) {
      toast({
        title: 'Video Summary Required',
        description: 'Please provide a brief summary of your video content.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateVideoMetadata({ videoDescription: videoSummary });
      setTitle(result.title);
      setDescription(result.description);
      setTags(result.tags);
      toast({
        title: 'Metadata Generated',
        description: 'AI has generated title, description, and tags for your video.',
      });
    } catch (error) {
      console.error('Error generating metadata:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate metadata. Please try again.',
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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          <CardTitle>Step 3: Generate Metadata</CardTitle>
        </div>
        <CardDescription>Provide a video summary for AI, then review or edit the generated metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-summary">Video Content Summary</Label>
          <Textarea
            id="video-summary"
            placeholder="e.g., A tutorial on how to bake a chocolate cake, featuring tips for beginners and common mistakes..."
            value={videoSummary}
            onChange={(e) => setVideoSummary(e.target.value)}
            className="min-h-[100px]"
            disabled={disabled || isLoading}
          />
        </div>
        <Button onClick={handleGenerateMetadata} disabled={disabled || isLoading || !videoSummary.trim()} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate with AI
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
             {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags added yet.</p>}
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
