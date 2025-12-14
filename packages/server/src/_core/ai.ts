/**
 * AI/ML Module
 *
 * Integrates AI capabilities for the Recording Studio Manager:
 * - Audio transcription (Whisper API)
 * - Text analysis (GPT-4)
 * - Music metadata extraction
 * - Musician recommendations
 * - Auto-generated descriptions
 *
 * Requires:
 * - OPENAI_API_KEY environment variable
 *
 * Usage:
 *   import { transcribeAudio, analyzeLyrics } from './_core/ai';
 *   const transcript = await transcribeAudio(audioBuffer, 'en');
 */

// =============================================================================
// Types
// =============================================================================

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface LyricsAnalysis {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore: number; // -1 to 1
  themes: string[];
  mood: string[];
  keywords: string[];
  language: string;
  summary: string;
}

export interface MusicMetadata {
  estimatedBpm?: number;
  estimatedKey?: string;
  genre?: string[];
  mood?: string[];
  energy?: "low" | "medium" | "high";
  instruments?: string[];
}

export interface MusicianRecommendation {
  musicianId: number;
  name: string;
  score: number;
  reasons: string[];
  matchingGenres: string[];
  matchingInstruments: string[];
}

export interface ProjectDescription {
  title: string;
  shortDescription: string;
  longDescription: string;
  tags: string[];
  targetAudience: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  whisperModel: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const config: AIConfig = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL ?? "gpt-4-turbo-preview",
  whisperModel: process.env.WHISPER_MODEL ?? "whisper-1",
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? "2000"),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.7"),
  enabled: !!process.env.OPENAI_API_KEY,
};

const OPENAI_API_BASE = "https://api.openai.com/v1";

// =============================================================================
// Initialization
// =============================================================================

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return config.enabled;
}

/**
 * Get AI configuration (without API key)
 */
export function getAIConfig(): Omit<AIConfig, "apiKey"> {
  return {
    model: config.model,
    whisperModel: config.whisperModel,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    enabled: config.enabled,
  };
}

// =============================================================================
// OpenAI API Helpers
// =============================================================================

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface WhisperResponse {
  text: string;
  segments?: {
    id: number;
    start: number;
    end: number;
    text: string;
  }[];
  language?: string;
  duration?: number;
}

/**
 * Make a chat completion request to OpenAI
 */
async function chatCompletion(
  messages: OpenAIMessage[],
  options: { maxTokens?: number; temperature?: number; responseFormat?: "json" } = {}
): Promise<string> {
  if (!config.enabled) {
    throw new Error("AI features are not enabled. Set OPENAI_API_KEY.");
  }

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: options.maxTokens ?? config.maxTokens,
      temperature: options.temperature ?? config.temperature,
      response_format: options.responseFormat === "json" ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data.choices[0]?.message?.content ?? "";
}

// =============================================================================
// Audio Transcription (Whisper)
// =============================================================================

/**
 * Transcribe audio file using Whisper API
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language?: string,
  filename = "audio.wav"
): Promise<TranscriptionResult> {
  if (!config.enabled) {
    throw new Error("AI features are not enabled. Set OPENAI_API_KEY.");
  }

  // Create form data
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer]), filename);
  formData.append("model", config.whisperModel);
  formData.append("response_format", "verbose_json");

  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as WhisperResponse;

  return {
    text: data.text,
    segments:
      data.segments?.map((s) => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text,
      })) ?? [],
    language: data.language ?? language ?? "unknown",
    duration: data.duration ?? 0,
  };
}

/**
 * Transcribe audio from S3 URL
 */
export async function transcribeAudioFromUrl(
  url: string,
  language?: string
): Promise<TranscriptionResult> {
  // Fetch audio from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract filename from URL
  const filename = url.split("/").pop() ?? "audio.wav";

  return transcribeAudio(buffer, language, filename);
}

// =============================================================================
// Text Analysis
// =============================================================================

/**
 * Analyze lyrics for sentiment, themes, and mood
 */
export async function analyzeLyrics(lyrics: string): Promise<LyricsAnalysis> {
  const systemPrompt = `You are a music industry expert analyzing song lyrics.
Analyze the given lyrics and provide a JSON response with the following fields:
- sentiment: "positive", "negative", "neutral", or "mixed"
- sentimentScore: number from -1 (very negative) to 1 (very positive)
- themes: array of 3-5 main themes (e.g., "love", "heartbreak", "empowerment")
- mood: array of 2-4 mood descriptors (e.g., "melancholic", "uplifting", "introspective")
- keywords: array of 5-10 important keywords or phrases
- language: detected language code (e.g., "en", "es", "fr")
- summary: one sentence summary of the lyrics

Respond ONLY with valid JSON.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: lyrics },
    ],
    { responseFormat: "json" }
  );

  try {
    return JSON.parse(response) as LyricsAnalysis;
  } catch {
    throw new Error("Failed to parse lyrics analysis response");
  }
}

/**
 * Generate session notes summary
 */
export async function summarizeSessionNotes(notes: string): Promise<string> {
  const systemPrompt = `You are a professional audio engineer assistant.
Summarize the following recording session notes into a concise, professional summary.
Focus on:
- Key decisions made
- Technical settings used
- Issues encountered and solutions
- Action items for next session

Keep the summary under 200 words.`;

  return chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: notes },
  ]);
}

// =============================================================================
// Music Metadata Extraction
// =============================================================================

/**
 * Analyze audio characteristics (placeholder - would use audio analysis library)
 */
export async function analyzeAudioMetadata(
  audioBuffer: Buffer
): Promise<MusicMetadata> {
  // In production, this would use an audio analysis library like:
  // - Essentia.js for tempo/key detection
  // - Librosa (via Python microservice) for advanced analysis
  // - Third-party APIs like ACRCloud or Musicstax

  // For now, return placeholder data
  console.log(`[AI] Audio analysis requested for ${audioBuffer.length} bytes`);

  return {
    estimatedBpm: undefined,
    estimatedKey: undefined,
    genre: [],
    mood: [],
    energy: undefined,
    instruments: [],
  };
}

/**
 * Use AI to suggest metadata from track title and context
 */
export async function suggestMetadataFromContext(
  trackTitle: string,
  projectGenre?: string,
  artistStyle?: string
): Promise<MusicMetadata> {
  const systemPrompt = `You are a music metadata expert. Based on the track title and context, suggest likely metadata.
Respond with JSON containing:
- estimatedBpm: likely BPM range (e.g., "120-130" or null if uncertain)
- estimatedKey: likely key (e.g., "C major", "A minor") or null
- genre: array of likely genres
- mood: array of likely moods
- energy: "low", "medium", or "high"
- instruments: array of likely instruments

Respond ONLY with valid JSON.`;

  const userMessage = `Track: "${trackTitle}"
Genre context: ${projectGenre ?? "Not specified"}
Artist style: ${artistStyle ?? "Not specified"}`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    { responseFormat: "json" }
  );

  try {
    return JSON.parse(response) as MusicMetadata;
  } catch {
    return {};
  }
}

// =============================================================================
// Musician Recommendations
// =============================================================================

interface MusicianProfile {
  id: number;
  name: string;
  genres: string[];
  instruments: string[];
  skills: string[];
  rating: number;
  projectCount: number;
}

/**
 * Generate musician recommendations for a project
 */
export async function recommendMusicians(
  projectGenre: string,
  requiredInstruments: string[],
  availableMusicians: MusicianProfile[],
  maxRecommendations = 5
): Promise<MusicianRecommendation[]> {
  if (availableMusicians.length === 0) {
    return [];
  }

  const systemPrompt = `You are a music industry expert helping to assemble the perfect team for a recording project.
Given the project requirements and available musicians, rank and recommend the best matches.

Respond with JSON array of recommendations, each containing:
- musicianId: the musician's ID
- score: match score from 0 to 100
- reasons: array of 2-3 reasons why they're a good match
- matchingGenres: array of genres they match
- matchingInstruments: array of instruments they can contribute

Return up to ${maxRecommendations} recommendations, sorted by score descending.
Respond ONLY with a valid JSON array.`;

  const userMessage = `Project genre: ${projectGenre}
Required instruments: ${requiredInstruments.join(", ")}

Available musicians:
${availableMusicians.map((m) => `- ID ${m.id}: ${m.name}
  Genres: ${m.genres.join(", ")}
  Instruments: ${m.instruments.join(", ")}
  Skills: ${m.skills.join(", ")}
  Rating: ${m.rating}/5
  Projects: ${m.projectCount}`).join("\n\n")}`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    { responseFormat: "json" }
  );

  try {
    const recommendations = JSON.parse(response) as Array<{
      musicianId: number;
      score: number;
      reasons: string[];
      matchingGenres: string[];
      matchingInstruments: string[];
    }>;

    // Add musician names from input data
    return recommendations.map((rec) => {
      const musician = availableMusicians.find((m) => m.id === rec.musicianId);
      return {
        ...rec,
        name: musician?.name ?? "Unknown",
      };
    });
  } catch {
    return [];
  }
}

// =============================================================================
// Auto-Generated Descriptions
// =============================================================================

/**
 * Generate project description from tracks and metadata
 */
export async function generateProjectDescription(
  projectTitle: string,
  artistName: string,
  genre: string,
  trackTitles: string[],
  additionalContext?: string
): Promise<ProjectDescription> {
  const systemPrompt = `You are a music marketing expert writing compelling descriptions for music releases.
Generate professional descriptions for the project.

Respond with JSON containing:
- title: suggested title (can be same as input or improved)
- shortDescription: 1-2 sentence teaser (max 150 characters)
- longDescription: 2-3 paragraphs for press/marketing (max 500 words)
- tags: array of 5-10 relevant tags/hashtags
- targetAudience: description of ideal listener demographic

Be creative but professional. Avoid clichés.
Respond ONLY with valid JSON.`;

  const userMessage = `Project: "${projectTitle}"
Artist: ${artistName}
Genre: ${genre}
Tracks: ${trackTitles.join(", ")}
${additionalContext ? `Additional context: ${additionalContext}` : ""}`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    { responseFormat: "json" }
  );

  try {
    return JSON.parse(response) as ProjectDescription;
  } catch {
    return {
      title: projectTitle,
      shortDescription: "",
      longDescription: "",
      tags: [],
      targetAudience: "",
    };
  }
}

/**
 * Generate track description from title and context
 */
export async function generateTrackDescription(
  trackTitle: string,
  projectGenre: string,
  lyrics?: string,
  mood?: string
): Promise<string> {
  const systemPrompt = `You are a music industry professional writing track descriptions for streaming platforms and press releases.
Write a compelling 2-3 sentence description that captures the essence of the track.
Be evocative but not over-the-top. Focus on the sonic and emotional qualities.`;

  let userMessage = `Track: "${trackTitle}"
Genre: ${projectGenre}`;

  if (mood) {
    userMessage += `\nMood: ${mood}`;
  }

  if (lyrics) {
    userMessage += `\nLyrics excerpt: "${lyrics.slice(0, 500)}..."`;
  }

  return chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ]);
}

// =============================================================================
// Email/Message Generation
// =============================================================================

/**
 * Generate professional email for client
 */
export async function generateClientEmail(
  type: "invoice" | "session_reminder" | "project_update" | "payment_thank_you",
  context: Record<string, string>
): Promise<{ subject: string; body: string }> {
  const templates: Record<string, string> = {
    invoice: `Generate a professional email for sending an invoice.
Client: ${context.clientName}
Invoice #: ${context.invoiceNumber}
Amount: ${context.amount}
Due date: ${context.dueDate}
Studio: ${context.studioName}`,

    session_reminder: `Generate a friendly session reminder email.
Client: ${context.clientName}
Session: ${context.sessionTitle}
Date/Time: ${context.dateTime}
Room: ${context.room}
Studio: ${context.studioName}`,

    project_update: `Generate a project status update email.
Client: ${context.clientName}
Project: ${context.projectTitle}
Status: ${context.status}
Next steps: ${context.nextSteps}
Studio: ${context.studioName}`,

    payment_thank_you: `Generate a payment confirmation/thank you email.
Client: ${context.clientName}
Invoice #: ${context.invoiceNumber}
Amount: ${context.amount}
Studio: ${context.studioName}`,
  };

  const systemPrompt = `You are a professional studio manager writing client emails.
Be friendly but professional. Keep emails concise.
Respond with JSON containing:
- subject: email subject line
- body: email body (use {{name}} placeholders for personalization)

Respond ONLY with valid JSON.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: templates[type] ?? templates.invoice ?? "" },
    ],
    { responseFormat: "json" }
  );

  try {
    return JSON.parse(response) as { subject: string; body: string };
  } catch {
    return { subject: "", body: "" };
  }
}

// =============================================================================
// Usage Tracking
// =============================================================================

interface AIUsage {
  timestamp: Date;
  operation: string;
  tokens: number;
  cost: number;
}

const usageLog: AIUsage[] = [];

/**
 * Track AI API usage for billing
 */
export function trackUsage(operation: string, tokens: number): void {
  // Approximate cost based on GPT-4 pricing
  const costPer1kTokens = 0.03;
  const cost = (tokens / 1000) * costPer1kTokens;

  usageLog.push({
    timestamp: new Date(),
    operation,
    tokens,
    cost,
  });

  // Keep only last 1000 entries
  if (usageLog.length > 1000) {
    usageLog.shift();
  }
}

/**
 * Get AI usage statistics
 */
export function getUsageStats(): {
  totalTokens: number;
  totalCost: number;
  operationCounts: Record<string, number>;
} {
  const stats = {
    totalTokens: 0,
    totalCost: 0,
    operationCounts: {} as Record<string, number>,
  };

  for (const entry of usageLog) {
    stats.totalTokens += entry.tokens;
    stats.totalCost += entry.cost;
    stats.operationCounts[entry.operation] =
      (stats.operationCounts[entry.operation] ?? 0) + 1;
  }

  return stats;
}
