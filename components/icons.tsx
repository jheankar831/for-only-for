import { GoogleGenAI, Type } from "@google/genai";
import { JobDescription, MatchResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        jobId: {
          type: Type.STRING,
        },
        jobTitle: {
          type: Type.STRING,
        },
        matchPercentage: {
          type: Type.NUMBER,
        },
        summary: {
          type: Type.STRING,
        },
        matchingSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
        missingSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
                skill: { type: Type.STRING },
                context: { 
                    type: Type.STRING,
                    description: "A brief explanation of why this skill is important for the job role."
                }
            },
            required: ['skill', 'context']
          },
        },
      },
      required: ['jobId', 'jobTitle', 'matchPercentage', 'summary', 'matchingSkills', 'missingSkills'],
    },
};

export const analyzeJobMatches = async (
  resumeText: string,
  jobs: JobDescription[]
): Promise<MatchResult[]> => {
    
    const jobDescriptionsJson = JSON.stringify(jobs.map(j => ({id: j.id, title: j.title, description: j.description})));

    const prompt = `
    You are an expert AI career advisor and talent acquisition specialist. Your task is to analyze a candidate's resume and compare it against several job descriptions to determine the best fit.

    **Candidate's Resume:**
    ---
    ${resumeText}
    ---
    
    **Job Descriptions:**
    ---
    ${jobDescriptionsJson}
    ---
    
    For each job description, please perform the following analysis:
    1.  Identify the key skills, technologies, and qualifications required by the job.
    2.  Identify the key skills, technologies, and experience present in the candidate's resume.
    3.  Compare the two and calculate a "match percentage" from 0 to 100. This score should reflect how well the candidate's skills and experience align with the job's core requirements. A higher score means a better match.
    4.  Provide a concise summary explaining the match score.
    5.  List the top 5 most relevant skills from the resume that match the job description.
    6.  List the top 5 most critical skills or qualifications from the job description that are missing from the resume. For each missing skill, provide a brief (1-sentence) explanation of its importance or context within the job role.
    
    Return your analysis as a JSON object that adheres to the provided schema. The output should be a JSON array where each object corresponds to one of the provided jobs. Do not include any introductory text, explanations, or markdown formatting outside of the JSON object itself.
    `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const jsonText = response.text.trim();
    const results = JSON.parse(jsonText);
    return results as MatchResult[];

  } catch (error) {
    console.error("Error analyzing job matches:", error);
    throw new Error("Failed to analyze job matches. The Gemini API call failed.");
  }
};
