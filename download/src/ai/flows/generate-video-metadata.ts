
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
  videoDataUri: z
    .string()
    .describe(
      "The video content, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  videoDescription: z
    .string()
    .optional()
    .describe('An optional user-provided summary of the video content, including scene context and key moments.'),
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

  You will be provided with direct access to the video content and an optional user-provided summary. Analyze the video content (frames, scenes, and implied narrative or information) as the primary source. Use the user-provided summary as supplementary context if available.

  Generate a title, description, and tags that will maximize the video's discoverability.

  Video Content:
  {{media url=videoDataUri}}

  User-provided Summary (optional):
  {{#if videoDescription}}
  {{videoDescription}}
  {{else}}
  No user summary provided. Rely solely on video content.
  {{/if}}

  Output the title, description (2-3 short paragraphs), and tags (10-15 tags).`,
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
