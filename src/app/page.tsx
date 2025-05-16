
"use client";

import { useState, useEffect } from 'react';
import type { AudioTrack, Metadata, Step } from '@/types';

import VideoUploadStep from './components/steps/video-upload-step';
import AudioSelectionStep from './components/steps/audio-selection-step';
import MetadataGenerationStep from './components/steps/metadata-generation-step';
import VideoPreviewStep from './components/steps/video-preview-step';
import YouTubeUploadStep from './components/steps/youtube-upload-step';
import { StepIndicator } from './components/ui/step-indicator';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Music2, Wand2, PlayCircle, Youtube as YoutubeIcon, Edit3 } from 'lucide-react';
// Removed Alert related imports as the specific warning alert is removed
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Button } from '@/components/ui/button';

const INITIAL_APP_STEPS: Step[] = [
  { id: 1, name: 'Upload Video', icon: UploadCloud },
  { id: 2, name: 'Select Audio', icon: Music2 },
  { id: 3, name: 'Gen. Metadata', icon: Wand2 }, // Default name
  { id: 4, name: 'Preview', icon: PlayCircle },
  { id: 5, name: 'Publish', icon: YoutubeIcon },
];

const LOCAL_STORAGE_APP_STATE_KEY = 'vidtune_app_state';

interface PersistedAppState {
  currentStep: number;
  completedSteps: number[];
  videoFileDetails: { name: string; type: string; size: number } | null;
  selectedAudio: AudioTrack | null;
  generatedMetadata: Metadata | null;
  youtubeUrl: string | null;
}

export default function VidTunePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [persistedVideoFileDetails, setPersistedVideoFileDetails] = useState<PersistedAppState['videoFileDetails']>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [generatedMetadata, setGeneratedMetadata] = useState<Metadata | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [appSteps, setAppSteps] = useState<Step[]>(INITIAL_APP_STEPS);
  // Removed showVideoMissingWarning state

  useEffect(() => {
    const storedStateString = localStorage.getItem(LOCAL_STORAGE_APP_STATE_KEY);
    if (storedStateString) {
      try {
        const storedState: PersistedAppState = JSON.parse(storedStateString);
        setCurrentStep(storedState.currentStep);
        setCompletedSteps(storedState.completedSteps);
        setSelectedAudio(storedState.selectedAudio);
        setGeneratedMetadata(storedState.generatedMetadata);
        setYoutubeUrl(storedState.youtubeUrl);
        setPersistedVideoFileDetails(storedState.videoFileDetails); 
        // videoFile state remains null here, it's not persistable.
        // YouTubeUploadStep will handle prompting for re-selection if needed.
      } catch (error) {
        console.error("Failed to parse app state from localStorage", error);
      }
      localStorage.removeItem(LOCAL_STORAGE_APP_STATE_KEY); 
    }

    localStorage.removeItem('youtube_auth_error');
    if (currentStep === 1 && !localStorage.getItem('youtube_access_token')) {
        localStorage.removeItem('youtube_access_token');
    }

  }, []); 

  useEffect(() => {
    const metadataExists = generatedMetadata !== null && (generatedMetadata.title !== '' || generatedMetadata.description !== '' || generatedMetadata.tags.length > 0);
    setAppSteps(prevSteps => prevSteps.map(step => 
      step.id === 3 
        ? { ...step, name: metadataExists ? 'Edit Metadata' : 'Gen. Metadata', icon: metadataExists ? Edit3 : Wand2 }
        : step
    ));
  }, [generatedMetadata]);

  const saveAppStateToLocalStorage = () => {
    const stateToSave: PersistedAppState = {
      currentStep,
      completedSteps,
      videoFileDetails: videoFile ? { name: videoFile.name, type: videoFile.type, size: videoFile.size } : persistedVideoFileDetails,
      selectedAudio,
      generatedMetadata,
      youtubeUrl,
    };
    localStorage.setItem(LOCAL_STORAGE_APP_STATE_KEY, JSON.stringify(stateToSave));
  };
  
  const resetToStep1 = (clearToken = true) => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setVideoFile(null);
    setPersistedVideoFileDetails(null);
    setSelectedAudio(null);
    setGeneratedMetadata(null);
    setYoutubeUrl(null);
    if (clearToken) {
      localStorage.removeItem('youtube_access_token');
    }
    localStorage.removeItem('youtube_auth_error');
    localStorage.removeItem(LOCAL_STORAGE_APP_STATE_KEY);
  };

  const handleVideoUploaded = (file: File) => {
    setVideoFile(file);
    setPersistedVideoFileDetails({ name: file.name, type: file.type, size: file.size });
    setCompletedSteps(prev => [...new Set([...prev, 1])]); 
    setCurrentStep(2); 
  };

  const handleVideoReselectedInUploadStep = (file: File) => {
    setVideoFile(file); // Update the main video file state
    setPersistedVideoFileDetails({ name: file.name, type: file.type, size: file.size }); // Also update details
    // No need to change currentStep or completedSteps here, user stays on step 5
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
    localStorage.removeItem('youtube_access_token'); 
  };
  
  const getStepDisabledState = (stepId: number): boolean => {
    if (completedSteps.includes(5) && youtubeUrl) return stepId !== 5; 

    // Standard progression logic
    if (stepId === 1) return false;
    // Enable step if the previous one is complete OR if the necessary data for that step already exists
    // (e.g., user navigated back and data was preserved from a previous run through the steps)
    if (stepId === 2) return !completedSteps.includes(1) && !persistedVideoFileDetails;
    if (stepId === 3) return !completedSteps.includes(2) && !selectedAudio;
    if (stepId === 4) return !completedSteps.includes(3) && !generatedMetadata;
    if (stepId === 5) return !completedSteps.includes(4); // Must have completed preview
    
    return true; 
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <StepIndicator steps={appSteps} currentStep={currentStep} completedSteps={completedSteps} />
        <Separator />

        {currentStep === 1 && (
          <VideoUploadStep 
            onVideoUploaded={handleVideoUploaded} 
            disabled={getStepDisabledState(1)}
          />
        )}

        {currentStep === 2 && (persistedVideoFileDetails || videoFile) && (
          <AudioSelectionStep 
            onAudioSelected={handleAudioSelected} 
            disabled={getStepDisabledState(2)}
            initialSelectedAudioTrack={selectedAudio}
          />
        )}
        
        {currentStep === 3 && (persistedVideoFileDetails || videoFile) && selectedAudio && (
          <MetadataGenerationStep
            videoFile={videoFile} 
            videoFileDetails={persistedVideoFileDetails}
            onMetadataGenerated={handleMetadataGenerated}
            initialMetadata={generatedMetadata}
            disabled={getStepDisabledState(3)}
          />
        )}

        {currentStep === 4 && (persistedVideoFileDetails || videoFile) && selectedAudio && generatedMetadata && (
          <VideoPreviewStep 
            videoFile={videoFile}
            videoFileDetails={persistedVideoFileDetails}
            selectedAudio={selectedAudio}
            metadata={generatedMetadata}
            onConfirmPreview={handleConfirmPreview}
            disabled={getStepDisabledState(4)}
          />
        )}

        {currentStep === 5 && (persistedVideoFileDetails || videoFile || (youtubeUrl && completedSteps.includes(5)) ) && selectedAudio && generatedMetadata && (
           <YouTubeUploadStep 
            videoFile={videoFile}
            videoFileDetails={persistedVideoFileDetails}
            metadata={generatedMetadata}
            onUploadComplete={handleUploadComplete}
            onReset={() => resetToStep1(true)} 
            onPrepareOAuth={saveAppStateToLocalStorage}
            onVideoReselected={handleVideoReselectedInUploadStep} // New prop
            disabled={getStepDisabledState(5) && !youtubeUrl} // Disable if step logic says so, unless already uploaded
          />
        )}
      </div>
    </div>
  );
}
