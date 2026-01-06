/**
 * Hallucination Detection System
 *
 * Validates AI responses against actual data to prevent hallucinations.
 * Based on the Python implementation (hallucination_detector.py).
 *
 * Phase 2.3 - Day 1
 */

import type { ToolCall } from "./llmProvider";

/**
 * Validation result for a single check
 */
export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  issue?: string;
  suggestion?: string;
}

/**
 * Complete hallucination detection result
 */
export interface HallucinationDetectionResult {
  hasHallucination: boolean;
  confidence: number; // Overall confidence score 0-100
  issues: string[];
  warnings: string[];
  validationResults: Record<string, ValidationResult>;
}

/**
 * Hallucination Detector
 *
 * Validates AI responses by checking:
 * 1. Numbers mentioned match tool results
 * 2. Names/entities mentioned exist in tool results
 * 3. Dates/times are consistent
 * 4. No invented details beyond tool results
 */
export class HallucinationDetector {
  /**
   * Detect hallucinations in AI response
   *
   * @param aiResponse The AI's text response
   * @param toolCalls The tools that were called
   * @param toolResults The results from executing tools
   * @returns Hallucination detection result
   */
  async detect(
    aiResponse: string,
    toolCalls: ToolCall[],
    toolResults: any[]
  ): Promise<HallucinationDetectionResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    const validationResults: Record<string, ValidationResult> = {};

    // If no tools were called, we can't validate against data
    if (toolCalls.length === 0 || toolResults.length === 0) {
      return {
        hasHallucination: false,
        confidence: 100,
        issues: [],
        warnings: ["No tools called - cannot validate response against data"],
        validationResults: {},
      };
    }

    // Validation 1: Check numbers in response match tool results
    const numberValidation = this.validateNumbers(aiResponse, toolResults);
    validationResults.numbers = numberValidation;
    if (!numberValidation.isValid) {
      issues.push(numberValidation.issue!);
    }

    // Validation 2: Check entities (names, IDs) exist in tool results
    const entityValidation = this.validateEntities(aiResponse, toolResults);
    validationResults.entities = entityValidation;
    if (!entityValidation.isValid) {
      issues.push(entityValidation.issue!);
    }

    // Validation 3: Check for sources citation
    const sourceValidation = this.validateSourceCitation(aiResponse, toolCalls);
    validationResults.sources = sourceValidation;
    if (!sourceValidation.isValid) {
      warnings.push(sourceValidation.issue!);
    }

    // Validation 4: Check for approximations (forbidden in anti-hallucination prompt)
    const approximationValidation = this.validateNoApproximations(aiResponse);
    validationResults.approximations = approximationValidation;
    if (!approximationValidation.isValid) {
      issues.push(approximationValidation.issue!);
    }

    // Calculate overall confidence
    const confidenceScores = Object.values(validationResults).map((r) => r.confidence);
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    return {
      hasHallucination: issues.length > 0,
      confidence: Math.round(avgConfidence),
      issues,
      warnings,
      validationResults,
    };
  }

  /**
   * Validate that numbers mentioned in response match tool results
   */
  private validateNumbers(aiResponse: string, toolResults: any[]): ValidationResult {
    // Extract all numbers from AI response
    const numbersInResponse = this.extractNumbers(aiResponse);

    if (numbersInResponse.length === 0) {
      return {
        isValid: true,
        confidence: 100,
      };
    }

    // Extract all numbers from tool results
    const numbersInData = this.extractNumbersFromData(toolResults);

    // Check if all numbers in response exist in data
    const unmatchedNumbers: number[] = [];
    for (const num of numbersInResponse) {
      if (!numbersInData.includes(num)) {
        unmatchedNumbers.push(num);
      }
    }

    if (unmatchedNumbers.length > 0) {
      return {
        isValid: false,
        confidence: 50,
        issue: `Numbers not found in data: ${unmatchedNumbers.join(", ")}`,
        suggestion: "AI may have invented these numbers",
      };
    }

    return {
      isValid: true,
      confidence: 100,
    };
  }

  /**
   * Validate that entities (names, emails) mentioned exist in tool results
   */
  private validateEntities(aiResponse: string, toolResults: any[]): ValidationResult {
    // Extract potential entity names (capitalized words)
    const entities = this.extractEntities(aiResponse);

    if (entities.length === 0) {
      return {
        isValid: true,
        confidence: 100,
      };
    }

    // Convert tool results to searchable strings
    const dataString = JSON.stringify(toolResults).toLowerCase();

    // Check if entities exist in data
    const unmatchedEntities: string[] = [];
    for (const entity of entities) {
      if (!dataString.includes(entity.toLowerCase())) {
        unmatchedEntities.push(entity);
      }
    }

    // Allow some unmatched entities (might be generic terms)
    const matchRate = (entities.length - unmatchedEntities.length) / entities.length;

    if (matchRate < 0.5 && unmatchedEntities.length > 2) {
      return {
        isValid: false,
        confidence: Math.round(matchRate * 100),
        issue: `Many entities not found in data: ${unmatchedEntities.slice(0, 3).join(", ")}...`,
        suggestion: "AI may have invented names or details",
      };
    }

    return {
      isValid: true,
      confidence: Math.round(matchRate * 100),
    };
  }

  /**
   * Validate that AI cites sources (tool names)
   */
  private validateSourceCitation(aiResponse: string, toolCalls: ToolCall[]): ValidationResult {
    // Check if response contains source citations
    const lowerResponse = aiResponse.toLowerCase();

    // Look for citations like "(source: tool_name)" or "D'après tool_name"
    const hasCitation =
      lowerResponse.includes("source:") ||
      lowerResponse.includes("d'après") ||
      lowerResponse.includes("selon");

    // Check if tool names are mentioned
    const toolNamesMentioned = toolCalls.some((tc) =>
      lowerResponse.includes(tc.name.toLowerCase())
    );

    if (!hasCitation && !toolNamesMentioned) {
      return {
        isValid: false,
        confidence: 70,
        issue: "No source citation found",
        suggestion: "AI should cite the tools used (per anti-hallucination prompt)",
      };
    }

    return {
      isValid: true,
      confidence: 100,
    };
  }

  /**
   * Validate that AI doesn't use approximations
   */
  private validateNoApproximations(aiResponse: string): ValidationResult {
    const lowerResponse = aiResponse.toLowerCase();

    // Forbidden approximation words (from anti-hallucination prompt)
    const approximations = ["environ", "à peu près", "approximativement", "autour de"];

    const foundApproximations = approximations.filter((word) => lowerResponse.includes(word));

    if (foundApproximations.length > 0) {
      return {
        isValid: false,
        confidence: 40,
        issue: `Approximation words found: ${foundApproximations.join(", ")}`,
        suggestion: "AI should use exact numbers from tool results",
      };
    }

    return {
      isValid: true,
      confidence: 100,
    };
  }

  /**
   * Extract all numbers from text
   */
  private extractNumbers(text: string): number[] {
    const matches = text.match(/\b\d+(?:[.,]\d+)?\b/g);
    if (!matches) return [];

    return matches.map((m) => parseFloat(m.replace(",", ".")));
  }

  /**
   * Extract all numbers from data structure
   */
  private extractNumbersFromData(data: any[]): number[] {
    const numbers: number[] = [];

    const extract = (obj: any) => {
      if (typeof obj === "number") {
        numbers.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(extract);
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach(extract);
      }
    };

    data.forEach(extract);
    return numbers;
  }

  /**
   * Extract potential entity names (capitalized words, emails)
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Extract capitalized words (potential names)
    const capitalizedWords = text.match(/\b[A-Z][a-zàéèêëïîôùûç]+(?:\s+[A-Z][a-zàéèêëïîôùûç]+)*\b/g);
    if (capitalizedWords) {
      entities.push(...capitalizedWords);
    }

    // Extract emails
    const emails = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
    if (emails) {
      entities.push(...emails);
    }

    return entities;
  }
}
