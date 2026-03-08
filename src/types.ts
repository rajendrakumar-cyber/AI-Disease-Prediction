export interface PatientData {
  age: number;
  gender: 'male' | 'female' | 'other';
  systolicBP: number;
  diastolicBP: number;
  cholesterol: number;
  bloodSugar: number;
  heartRate: number;
  bmi: number;
  smoking: boolean;
  physicalActivity: 'low' | 'moderate' | 'high';
}

export interface PredictionResult {
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  prediction: string;
  recommendations: string[];
  keyFactors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  insights: string;
}

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  patientData: PatientData;
  result: PredictionResult;
}
