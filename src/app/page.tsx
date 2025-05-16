
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
import { UploadCloud, Music2, Wand2, PlayCircle, Youtube as YoutubeIcon, Edit3, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
  const [showVideoMissingWarning, setShowVideoMissingWarning] = useState(false);


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
        setPersistedVideoFileDetails(storedState.videoFileDetails); // Restore details

        // Check if we need to show the "video file lost" warning
        // This happens if we are on step 5, an access token exists (meaning auth happened),
        // we had video details, but the videoFile object itself is now null.
        if (
          storedState.currentStep === 5 &&
          !videoFile && // videoFile state would be null initially after page load
          storedState.videoFileDetails &&
          storedState.completedSteps.includes(4) && // Ensure they actually reached step 4
          localStorage.getItem('youtube_access_token') // Check if auth was likely successful
        ) {
          setShowVideoMissingWarning(true);
        }
      } catch (error) {
        console.error("Failed to parse app state from localStorage", error);
      }
      localStorage.removeItem(LOCAL_STORAGE_APP_STATE_KEY); 
    }

    localStorage.removeItem('youtube_auth_error');
    // Only clear token if truly starting over and no token was found during load.
    // If a token is present, it might be from the just-completed OAuth flow.
    if (currentStep === 1 && !localStorage.getItem('youtube_access_token')) {
        localStorage.removeItem('youtube_access_token');
    }

  }, []); // Runs once on mount

  useEffect(() => {
    // Update step 3 name/icon based on metadata status
    const metadataExists = generatedMetadata !== null && (generatedMetadata.title !== '' || generatedMetadata.description !== '' || generatedMetadata.tags.length > 0);
    setAppSteps(prevSteps => prevSteps.map(step => 
      step.id === 3 
        ? { ...step, name: metadataExists ? 'Edit Metadata' : 'Gen. Metadata', icon: metadataExists ? Edit3 : Wand2 }
        : step
    ));
  }, [generatedMetadata]);

  // Hide warning if videoFile becomes available (e.g., re-selected)
  useEffect(() => {
    if (videoFile) {
      setShowVideoMissingWarning(false);
    }
  }, [videoFile]);


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
    setShowVideoMissingWarning(false);
    if (clearToken) {
      localStorage.removeItem('youtube_access_token');
    }
    localStorage.removeItem('youtube_auth_error');
    localStorage.removeItem(LOCAL_STORAGE_APP_STATE_KEY);
  };

  const handleVideoUploaded = (file: File) => {
    setVideoFile(file);
    setPersistedVideoFileDetails({ name: file.name, type: file.type, size: file.size });
    setCompletedSteps(prev => [...new Set([...prev, 1])]); // Mark step 1 as complete
    setCurrentStep(2); // Proceed to step 2
    setShowVideoMissingWarning(false); // Hide warning if it was shown
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
    localStorage.removeItem('youtube_access_token'); // Clean up token after successful use
  };
  
  // This function is specifically for when the user clicks the button in the "video missing" warning.
  const handleNavigateToStep1ForReselection = () => {
    setShowVideoMissingWarning(false);
    // videoFile is already null
    // persistedVideoFileDetails, selectedAudio, generatedMetadata are kept.
    // youtubeUrl is kept (though upload didn't happen yet).
    // Access token is kept.
    setCompletedSteps([]); // User needs to re-confirm steps with the new video file.
    setCurrentStep(1);
  };

  const getStepDisabledState = (stepId: number): boolean => {
    if (completedSteps.includes(5) && youtubeUrl) return stepId !== 5; 

    // If video is missing after auth, only allow step 1 or showing step 5 (which will show warning)
    if (showVideoMissingWarning && stepId !== 1 && stepId !== 5) return true;


    // Standard progression logic
    if (stepId === 1) return false; // Always allow step 1 unless flow is complete or specific warning
    if (stepId === 2) return !completedSteps.includes(1) && !persistedVideoFileDetails;
    if (stepId === 3) return !completedSteps.includes(2) && !selectedAudio;
    if (stepId === 4) return !completedSteps.includes(3) && !generatedMetadata;
    if (stepId === 5) return !completedSteps.includes(4);
    
    return true; // Default to disabled for unhandled cases
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <StepIndicator steps={appSteps} currentStep={currentStep} completedSteps={completedSteps} />
        <Separator />

        {showVideoMissingWarning && currentStep === 5 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Video File Re-selection Needed</AlertTitle>
            <AlertDescription>
              Authentication was successful. However, the video file ({persistedVideoFileDetails?.name || "your video"}) needs to be re-selected due to the page redirect. 
              Your audio and metadata choices have been preserved.
              <Button onClick={handleNavigateToStep1ForReselection} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                Click here to go to Step 1 and re-select your video.
              </Button>
            </AlertDescription>
          </Alert>
        )}

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

        {currentStep === 5 && (persistedVideoFileDetails || videoFile) && selectedAudio && generatedMetadata && (
           <YouTubeUploadStep 
            videoFile={videoFile}
            videoFileDetails={persistedVideoFileDetails}
            metadata={generatedMetadata}
            onUploadComplete={handleUploadComplete}
            onReset={() => resetToStep1(true)} 
            onPrepareOAuth={saveAppStateToLocalStorage}
            disabled={getStepDisabledState(5) || showVideoMissingWarning || (!videoFile && !!persistedVideoFileDetails)}
          />
        )}
      </div>
    </div>
  );
}

    