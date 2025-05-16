
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Music2, CheckCircle2 } from 'lucide-react';
import type { AudioTrack } from '@/types';
import { useToast } from '@/hooks/use-toast';

const royaltyFreeTracks: AudioTrack[] = [
  { id: 'track1', name: 'Morning Routine', artist: 'Lofi Chillhop', url: '/audio/placeholder1.mp3' },
  { id: 'track2', name: 'Focus Flow', artist: 'Ambient Beats', url: '/audio/placeholder2.mp3' },
  { id: 'track3', name: 'Uplifting Journey', artist: 'Cinematic Pop', url: '/audio/placeholder3.mp3' },
  { id: 'track4', name: 'Sunset Vibes', artist: 'Acoustic Cafe', url: '/audio/placeholder4.mp3' },
  { id: 'track5', name: 'Tech Pulse', artist: 'Electronic Future', url: '/audio/placeholder5.mp3' },
];

interface AudioSelectionStepProps {
  onAudioSelected: (track: AudioTrack) => void;
  initialSelectedAudioTrack?: AudioTrack | null;
  disabled?: boolean;
}

export default function AudioSelectionStep({ onAudioSelected, initialSelectedAudioTrack, disabled }: AudioSelectionStepProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(initialSelectedAudioTrack?.id || null);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedTrackId(initialSelectedAudioTrack?.id || null);
  }, [initialSelectedAudioTrack]);

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  const handleSubmit = () => {
    const track = royaltyFreeTracks.find(t => t.id === selectedTrackId);
    if (track) {
      onAudioSelected(track);
      toast({
        title: 'Audio Selected',
        description: `${track.name} by ${track.artist} has been chosen.`,
      });
    } else {
       toast({
        title: 'No Audio Selected',
        description: 'Please select a background audio track.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Music2 className="h-6 w-6 text-accent" />
          <CardTitle>Step 2: Select Background Audio</CardTitle>
        </div>
        <CardDescription>Choose a royalty-free music track for your video.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <RadioGroup
            value={selectedTrackId ?? undefined}
            onValueChange={handleSelectTrack}
            disabled={disabled}
            aria-label="Background audio tracks"
          >
            {royaltyFreeTracks.map((track) => (
              <div key={track.id} className="flex items-center space-x-3 p-2 hover:bg-secondary/30 rounded-md transition-colors">
                <RadioGroupItem value={track.id} id={track.id} />
                <Label htmlFor={track.id} className="flex-1 cursor-pointer">
                  <span className="block font-medium text-foreground">{track.name}</span>
                  <span className="block text-sm text-muted-foreground">{track.artist}</span>
                </Label>
                {selectedTrackId === track.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
            ))}
          </RadioGroup>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!selectedTrackId || disabled} className="w-full sm:w-auto">
          Confirm Audio &amp; Proceed
        </Button>
      </CardFooter>
    </Card>
  );
}
