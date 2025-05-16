import type { GenerateVideoMetadataOutput } from '@/ai/flows/generate-video-metadata';

export interface AudioTrack {
  id: string;
  name: string;
  artist: string;
  url: string; // In a real app, this would be a URL to the audio file
}

export type Metadata = GenerateVideoMetadataOutput;

export interface Step {
  id: number;
  name: string;
  icon?: React.ElementType;
}
