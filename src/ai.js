// ============================================
// MANIFESTO — AI Engine
// Powered by Google Gemini API
// ============================================

import { getApiKey } from './store.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export async function generateGoalBreakdown(goalTitle) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const prompt = `
You are a highly efficient productivity assistant. 
The user wants to achieve this goal: "${goalTitle}"
Break this goal down into EXACTLY 5 actionable, bite-sized sub-tasks.
Each task should have a title (max 6 words), a short description (1 sentence), a priority (high, medium, or low), and a category (fitness, study, work, personal, health, finance, or other).

Respond ONLY with a valid JSON array containing the 5 tasks. Do NOT wrap the JSON in markdown blocks (e.g. \`\`\`json). Just the raw array.

Example format:
[
  { "title": "Read chapter 1", "description": "Focus on the introduction.", "priority": "high", "category": "study" }
]
  `;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gemini-3.6-flash",
        input: prompt
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || 'API_ERROR';
      console.error('Gemini API Error Response:', errData);
      throw new Error(`API_ERROR: ${errMsg}`);
    }

    const data = await response.json();
    
    // Interactions API response format: data.steps array
    const modelStep = data.steps?.find(step => step.type === 'model_output');
    const text = modelStep?.content?.[0]?.text;
    
    if (!text) {
      console.error('Failed to find model output step:', data);
      throw new Error('PARSE_ERROR');
    }
    
    try {
      // Sometimes models add markdown block even if told not to
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('PARSE_ERROR');
    }

  } catch (err) {
    console.error('Gemini API Error:', err);
    throw err;
  }
}
