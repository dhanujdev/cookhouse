'use server';
/**
 * @fileOverview Generates video metadata (title, description, tags) using AI.
 *
 * - generateVideoMetadata - A function that generates video metadata.
 * - GenerateVideoMetadataInput - The input type for the generateVideoMetadata function.
 * - GenerateVideoMetadataOutput - The return type for the generateVideoMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoMetadataInputSchema = z.object({
  videoDescription: z
    .string()
    .describe('A description of the video content, including scene context and key moments.'),
});
export type GenerateVideoMetadataInput = z.infer<typeof GenerateVideoMetadataInputSchema>;

const GenerateVideoMetadataOutputSchema = z.object({
  title: z.string().describe('A concise, SEO-optimized title for the video.'),
  description: z.string().describe('A compelling description for the video (2-3 short paragraphs).'),
  tags: z.array(z.string()).describe('A list of 10-15 relevant keyword tags for the video.'),
});
export type GenerateVideoMetadataOutput = z.infer<typeof GenerateVideoMetadataOutputSchema>;

export async function generateVideoMetadata(
  input: GenerateVideoMetadataInput
): Promise<GenerateVideoMetadataOutput> {
  return generateVideoMetadataFlow(input);
}

const generateVideoMetadataPrompt = ai.definePrompt({
  name: 'generateVideoMetadataPrompt',
  input: {schema: GenerateVideoMetadataInputSchema},
  output: {schema: GenerateVideoMetadataOutputSchema},
  prompt: `You are an expert in creating engaging and SEO-optimized metadata for YouTube videos.

  Based on the video description provided, generate a title, description, and tags that will maximize the video's discoverability.

  Description:
  {{videoDescription}}

  Title:
  Description (2-3 short paragraphs):
  Tags (10-15 tags, separated by commas):`,
});

const generateVideoMetadataFlow = ai.defineFlow(
  {
    name: 'generateVideoMetadataFlow',
    inputSchema: GenerateVideoMetadataInputSchema,
    outputSchema: GenerateVideoMetadataOutputSchema,
  },
  async input => {
    const {output} = await generateVideoMetadataPrompt(input);
    return output!;
  }
);
