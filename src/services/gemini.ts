import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, PredictionResult } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    riskScore: {
      type: Type.NUMBER,
      description: "A percentage risk score from 0 to 100.",
    },
    riskLevel: {
      type: Type.STRING,
      description: "One of: Low, Moderate, High, Critical.",
    },
    prediction: {
      type: Type.STRING,
      description: "A summary prediction of the patient's health risk.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of medical and lifestyle recommendations.",
    },
    keyFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          impact: { type: Type.STRING, description: "positive, negative, or neutral" },
          description: { type: Type.STRING },
        },
        required: ["factor", "impact", "description"],
      },
      description: "Key medical factors analyzed from the input data.",
    },
    insights: {
      type: Type.STRING,
      description: "Detailed AI insights about the patterns found in the data.",
    },
  },
  required: ["riskScore", "riskLevel", "prediction", "recommendations", "keyFactors", "insights"],
};

export async function analyzePatientData(data: PatientData): Promise<PredictionResult> {
  const prompt = `
    Analyze the following patient health data and predict the risk of cardiovascular and metabolic diseases.
    Provide a detailed medical profile and recommendations.
    
    Patient Data:
    - Age: ${data.age}
    - Gender: ${data.gender}
    - Blood Pressure: ${data.systolicBP}/${data.diastolicBP} mmHg
    - Cholesterol: ${data.cholesterol} mg/dL
    - Blood Sugar: ${data.bloodSugar} mg/dL
    - Heart Rate: ${data.heartRate} bpm
    - BMI: ${data.bmi}
    - Smoking: ${data.smoking ? 'Yes' : 'No'}
    - Physical Activity: ${data.physicalActivity}
    
    Return the analysis in the specified JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to get analysis from AI.");
  }

  return JSON.parse(text) as PredictionResult;
}
