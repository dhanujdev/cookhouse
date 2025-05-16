import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Updated to the user-specified model
  model: 'googleai/gemini-2.5-pro-preview-05-06', 
});
