/**
 * @license
 * Copyright © 2026 Ashraf Morningstar
 * https://github.com/AshrafMorningstar
 * 
 * Licensed under the MIT License.
 * This is a personal educational recreation.
 * Original concepts remain property of their respective creators.
 * 
 * @author Ashraf Morningstar
 * @see https://github.com/AshrafMorningstar
 */
import { GoogleGenAI, Type } from "@google/genai";
import { UserConfig, GitEvent } from "../types";

// Initialize Gemini
// Note: In a real production app, ensure strict backend validation. 
// Here we use the environment variable as instructed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSimulationPlan = async (config: UserConfig): Promise<GitEvent[]> => {
  const prompt = `
    Act as a "GitHub History Architect". I need to generate a realistic JSON history of Git events for a repository.
    
    Configuration:
    - User: ${config.username}
    - Repo: ${config.targetRepo}
    - Tech Stack: ${config.techStack}
    - Branching Strategy: ${config.strategy}
    - Date Range: ${config.startDate} to ${config.endDate}
    - Intensity (1-10): ${config.intensity}
    - Target Achievements: ${config.achievements.join(', ')}
    - Include LFS: ${config.includeLfs}

    Generate a strictly chronological list of approximately 20-30 representative events (scaling down for demo purposes, normally would be hundreds) that tells a story of development.
    Include a mix of:
    1. Initial commit
    2. Feature branches creation
    3. Commits (feat, fix, chore, docs) with realistic messages.
    4. Issues created and closed.
    5. Pull Requests created, reviewed (simulated), and merged.
    6. Tag releases (e.g., v1.0.0).

    Ensure "Pair Extraordinaire" (Co-authored-by) is present if requested.
    Ensure "Pull Shark" (Merges) is present if requested.
    
    The dates must be distributed realistically (more on weekdays, less on weekends).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a Git simulation engine. You output strictly structured JSON data representing a repository history.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING, description: "ISO 8601 Date string" },
              type: { type: Type.STRING, enum: ["commit", "branch", "merge", "issue", "pr", "tag"] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              branch: { type: Type.STRING },
              filesChanged: { type: Type.INTEGER },
              author: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "date", "type", "title", "branch", "author"]
          }
        }
      }
    });

    const text = response.text || "";
    // Clean markdown code blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (jsonStr) {
      return JSON.parse(jsonStr) as GitEvent[];
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("AI Generation failed:", error);
    // Fallback data in case of error (or missing API key in dev environment)
    return [
      {
        id: "evt_1",
        date: config.startDate,
        type: "commit",
        title: "feat: Initial project scaffold",
        description: "Initialize project structure with standard boilerplate",
        branch: "main",
        filesChanged: 12,
        author: config.username,
        tags: ["init"]
      },
      {
        id: "evt_2",
        date: new Date(new Date(config.startDate).getTime() + 86400000).toISOString(),
        type: "branch",
        title: "Create branch feature/auth-system",
        description: "Branching for authentication system",
        branch: "feature/auth-system",
        filesChanged: 0,
        author: config.username,
        tags: ["flow"]
      }
    ];
  }
};

export const generateReviewComment = async (prTitle: string, codeSnippet: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a constructive, technical code review comment for a Pull Request titled "${prTitle}".`,
            config: {
                maxOutputTokens: 100
            }
        });
        return response.text || "LGTM! Code structure looks solid.";
    } catch (e) {
        return "Reviewed. Looks good to merge.";
    }
}