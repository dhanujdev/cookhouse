
"use client";

import { useState, useEffect } from 'react';
import type { AudioTrack, Metadata, Step } from '@/types';
// Removed unused import: import { generateVideoMetadata } from '@/ai/flows/generate-video-metadata';

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

const initialCompletedSteps: number[] = [];

export default function VidTunePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialCompletedSteps);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [generatedMetadata, setGeneratedMetadata] = useState<Metadata | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);

  // Effect to clear YouTube auth token from localStorage when the page first loads or user navigates away
  // This is a simple way to ensure a fresh auth attempt if needed,
  // but in a real app, token expiry and refresh tokens would be handled more robustly.
  useEffect(() => {
    // Clear auth error on page load, so it's only shown after a callback.
    localStorage.removeItem('youtube_auth_error');

    // If the user is at step 1, we can assume they might be starting over,
    // so clear the access token. This is a simple heuristic.
    // A more robust solution would be an explicit "logout" or "reset" button in YouTubeUploadStep.
    if (currentStep === 1) {
        localStorage.removeItem('youtube_access_token');
    }
  }, [currentStep]);


  const resetToStep1 = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setVideoFile(null);
    setSelectedAudio(null);
    setGeneratedMetadata(null);
    setYoutubeUrl(null);
    localStorage.removeItem('youtube_access_token'); // Clear token on full reset
    localStorage.removeItem('youtube_auth_error');
  };


  const handleVideoUploaded = (file: File) => {
    setVideoFile(file);
    setCompletedSteps(prev => [...new Set([...prev, 1])]);
    setCurrentStep(2);
  };

  const handleAudioSelected = (track: AudioTrack) => {
    setSelectedAudio(track);
    setCompletedSteps(prev => [...new Set([...prev, 2])]);
    setCurrentStep(3);
  };

  const handleMetadataGenerated = (metadata: Metadata) => {
    setGeneratedMetadata(metadata);
    setCompletedSteps(prev => [...new Set([...prev, 3])]);
    setCurrentStep(4);
  };

  const handleConfirmPreview = () => {
    setCompletedSteps(prev => [...new Set([...prev, 4])]);
    setCurrentStep(5);
  };
  
  const handleUploadComplete = (url: string) => {
    setYoutubeUrl(url);
    setCompletedSteps(prev => [...new Set([...prev, 5])]);
    // Current step remains 5 to show completion
  };
  
  const isStepDisabled = (stepId: number) => {
    if (stepId === 1 && currentStep !== 1 && !completedSteps.includes(5)) return true; // Can't go back to step 1 unless flow complete
    if (stepId > currentStep && !completedSteps.includes(stepId -1)) return true; // Future steps are disabled if previous not complete
    if (completedSteps.includes(5) && stepId !==5 ) return true; // If flow complete, only step 5 viewable or reset.
    // Allow navigation to previous completed steps if not yet at final publish step
    // if (completedSteps.includes(stepId) && currentStep > stepId && !completedSteps.includes(5)) return false;
    
    return false; // Default to enabled, specific conditions above disable.
  };
  
  // More granular control for step enabling based on previous step completion
  const getStepDisabledState = (stepId: number): boolean => {
    if (completedSteps.includes(5)) return stepId !== 5; // If finished, only final step is "active"

    switch (stepId) {
      case 1: return false; // Always allow starting at step 1 (unless flow is complete)
      case 2: return !completedSteps.includes(1);
      case 3: return !completedSteps.includes(2);
      case 4: return !completedSteps.includes(3);
      case 5: return !completedSteps.includes(4);
      default: return true;
    }
  }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <StepIndicator steps={APP_STEPS} currentStep={currentStep} completedSteps={completedSteps} />
        <Separator />

        {currentStep === 1 && (
          <VideoUploadStep 
            onVideoUploaded={handleVideoUploaded} 
            disabled={getStepDisabledState(1)}
          />
        )}

        {currentStep === 2 && videoFile && (
          <AudioSelectionStep 
            onAudioSelected={handleAudioSelected} 
            disabled={getStepDisabledState(2)}
          />
        )}
        
        {currentStep === 3 && videoFile && selectedAudio && (
          <MetadataGenerationStep
            videoFile={videoFile} 
            onMetadataGenerated={handleMetadataGenerated}
            initialMetadata={generatedMetadata}
            disabled={getStepDisabledState(3)}
          />
        )}

        {currentStep === 4 && videoFile && selectedAudio && generatedMetadata && (
          <VideoPreviewStep 
            videoFile={videoFile}
            selectedAudio={selectedAudio}
            metadata={generatedMetadata}
            onConfirmPreview={handleConfirmPreview}
            disabled={getStepDisabledState(4)}
          />
        )}

        {currentStep === 5 && videoFile && selectedAudio && generatedMetadata && (
           <YouTubeUploadStep 
            videoFile={videoFile}
            metadata={generatedMetadata}
            onUploadComplete={handleUploadComplete}
            onReset={resetToStep1}
            disabled={getStepDisabledState(5)}
          />
        )}
      </div>
    </div>
  );
}

