"use client";

import { useState } from 'react';
import type { AudioTrack, Metadata, Step } from '@/types';
import { generateVideoMetadata } from '@/ai/flows/generate-video-metadata';

import VideoUploadStep from './components/steps/video-upload-step';
import AudioSelectionStep from './components/steps/audio-selection-step';
import MetadataGenerationStep from './components/steps/metadata-generation-step';
import VideoPreviewStep from './components/steps/video-preview-step';
import YouTubeUploadStep from './components/steps/youtube-upload-step';
import { StepIndicator } from './components/ui/step-indicator';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Music2, Wand2, PlayCircle, Youtube as YoutubeIcon } from 'lucide-react';

const APP_STEPS: Step[] = [
  { id: 1, name: 'Upload Video', icon: UploadCloud },
  { id: 2, name: 'Select Audio', icon: Music2 },
  { id: 3, name: 'Metadata', icon: Wand2 },
  { id: 4, name: 'Preview', icon: PlayCircle },
  { id: 5, name: 'Publish', icon: YoutubeIcon },
];

export default function VidTunePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [generatedMetadata, setGeneratedMetadata] = useState<Metadata | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);

  const handleVideoUploaded = (file: File) => {
    setVideoFile(file);
    setCompletedSteps(prev => [...prev, 1]);
    setCurrentStep(2);
  };

  const handleAudioSelected = (track: AudioTrack) => {
    setSelectedAudio(track);
    setCompletedSteps(prev => [...prev, 2]);
    setCurrentStep(3);
  };

  const handleMetadataGenerated = (metadata: Metadata) => {
    setGeneratedMetadata(metadata);
    setCompletedSteps(prev => [...prev, 3]);
    setCurrentStep(4);
  };

  const handleConfirmPreview = () => {
    setCompletedSteps(prev => [...prev, 4]);
    setCurrentStep(5);
  };
  
  const handleUploadComplete = (url: string) => {
    setYoutubeUrl(url);
    setCompletedSteps(prev => [...prev, 5]);
    // Current step remains 5 to show completion
  };
  
  const isStepDisabled = (stepId: number) => {
    if (stepId === 1) return false; // Video upload is always initially enabled
    if (stepId > currentStep) return true; // Future steps are disabled
    if (completedSteps.includes(stepId) && stepId !== currentStep) return true; // Completed steps (not current) are disabled for re-doing simply
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <StepIndicator steps={APP_STEPS} currentStep={currentStep} completedSteps={completedSteps} />
        <Separator />

        {currentStep === 1 && (
          <VideoUploadStep 
            onVideoUploaded={handleVideoUploaded} 
            disabled={isStepDisabled(1)}
          />
        )}

        {currentStep === 2 && (
          <AudioSelectionStep 
            onAudioSelected={handleAudioSelected} 
            disabled={isStepDisabled(2) || !videoFile}
          />
        )}
        
        {currentStep === 3 && (
          <MetadataGenerationStep 
            onMetadataGenerated={handleMetadataGenerated}
            initialMetadata={generatedMetadata}
            disabled={isStepDisabled(3) || !selectedAudio}
          />
        )}

        {currentStep === 4 && (
          <VideoPreviewStep 
            videoFile={videoFile}
            selectedAudio={selectedAudio}
            metadata={generatedMetadata}
            onConfirmPreview={handleConfirmPreview}
            disabled={isStepDisabled(4) || !generatedMetadata}
          />
        )}

        {currentStep === 5 && (
           <YouTubeUploadStep 
            onUploadComplete={handleUploadComplete}
            videoFileName={videoFile?.name}
            disabled={isStepDisabled(5) || !videoFile || !selectedAudio || !generatedMetadata}
          />
        )}
      </div>
    </div>
  );
}
