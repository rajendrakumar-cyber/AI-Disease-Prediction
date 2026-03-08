import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Heart, 
  User, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  History,
  Trash2,
  Save,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PatientData, PredictionResult, SavedAnalysis } from './types';
import { analyzePatientData } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const InputField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
      <Icon size={12} />
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
    />
  </div>
);

const SelectField = ({ label, icon: Icon, options, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
      <Icon size={12} />
      {label}
    </label>
    <select
      {...props}
      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-zinc-900">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const CheckboxField = ({ label, icon: Icon, checked, onChange }: any) => (
  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors" onClick={() => onChange(!checked)}>
    <div className={cn(
      "w-5 h-5 rounded border flex items-center justify-center transition-all",
      checked ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 bg-zinc-800"
    )}>
      {checked && <CheckCircle2 size={14} className="text-zinc-900" />}
    </div>
    <span className="text-sm text-zinc-300 flex items-center gap-2">
      <Icon size={14} className="text-zinc-500" />
      {label}
    </span>
  </div>
);

const MetricCard = ({ label, value, unit, status, icon: Icon }: any) => (
  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
      <Icon size={14} className="text-zinc-600" />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-semibold text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-500">{unit}</span>
    </div>
    <div className={cn(
      "text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mt-1",
      status === 'Normal' ? "bg-emerald-500/10 text-emerald-400" : 
      status === 'Warning' ? "bg-amber-500/10 text-amber-400" : 
      "bg-rose-500/10 text-rose-400"
    )}>
      {status}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData>({
    age: 45,
    gender: 'male',
    systolicBP: 120,
    diastolicBP: 80,
    cholesterol: 190,
    bloodSugar: 95,
    heartRate: 72,
    bmi: 24.5,
    smoking: false,
    physicalActivity: 'moderate',
  });

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('disease_prediction_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('disease_prediction_history', JSON.stringify(history));
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const analysis = await analyzePatientData(patientData);
      setResult(analysis);
      
      // Automatically save to history
      const newId = crypto.randomUUID();
      const newEntry: SavedAnalysis = {
        id: newId,
        timestamp: Date.now(),
        patientData: { ...patientData },
        result: analysis
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 20)); // Keep last 20
      setSelectedHistoryId(newId);
    } catch (error) {
      console.error(error);
      alert("Error analyzing data. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: SavedAnalysis) => {
    setPatientData(entry.patientData);
    setResult(entry.result);
    setSelectedHistoryId(entry.id);
    setShowHistory(false);
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedHistoryId === id) setSelectedHistoryId(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-emerald-400';
      case 'Moderate': return 'text-amber-400';
      case 'High': return 'text-orange-400';
      case 'Critical': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  const chartData = [
    { name: 'Blood Pressure', value: patientData.systolicBP, normal: 120, unit: 'mmHg' },
    { name: 'Cholesterol', value: patientData.cholesterol, normal: 200, unit: 'mg/dL' },
    { name: 'Blood Sugar', value: patientData.bloodSugar, normal: 100, unit: 'mg/dL' },
    { name: 'Heart Rate', value: patientData.heartRate, normal: 75, unit: 'bpm' },
    { name: 'BMI', value: patientData.bmi, normal: 22, unit: '' },
  ];

  const radarData = [
    { subject: 'BP', A: (patientData.systolicBP / 120) * 100, fullMark: 150 },
    { subject: 'Chol', A: (patientData.cholesterol / 200) * 100, fullMark: 150 },
    { subject: 'Sugar', A: (patientData.bloodSugar / 100) * 100, fullMark: 150 },
    { subject: 'HR', A: (patientData.heartRate / 75) * 100, fullMark: 150 },
    { subject: 'BMI', A: (patientData.bmi / 22) * 100, fullMark: 150 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <header className="relative border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Activity className="text-emerald-500" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">AI Disease Prediction</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Medical Analysis System v2.1</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-300 transition-colors"
            >
              <History size={16} />
              History
              {history.length > 0 && (
                <span className="bg-emerald-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] font-medium text-zinc-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              AI Engine Online
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* History Sidebar Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[70] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="text-emerald-500" size={20} />
                    <h2 className="text-lg font-semibold">Analysis History</h2>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Clock size={40} className="text-zinc-800 mb-4" />
                      <p className="text-zinc-500 text-sm">No past analyses found.</p>
                    </div>
                  ) : (
                    history.map((entry) => (
                      <div 
                        key={entry.id}
                        onClick={() => loadFromHistory(entry)}
                        className={cn(
                          "group p-4 border rounded-2xl cursor-pointer transition-all relative overflow-hidden",
                          selectedHistoryId === entry.id 
                            ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20" 
                            : "bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 hover:border-emerald-500/30"
                        )}
                      >
                        {selectedHistoryId === entry.id && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-mono text-zinc-500 mb-1">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm font-semibold text-zinc-200">
                              Patient, {entry.patientData.age}y {entry.patientData.gender}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => deleteFromHistory(entry.id, e)}
                            className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            entry.result.riskLevel === 'Low' ? "bg-emerald-500/10 text-emerald-400" :
                            entry.result.riskLevel === 'Moderate' ? "bg-amber-500/10 text-amber-400" :
                            entry.result.riskLevel === 'High' ? "bg-orange-500/10 text-orange-400" :
                            "bg-rose-500/10 text-rose-400"
                          )}>
                            {entry.result.riskLevel} Risk
                          </div>
                          <div className="text-[10px] font-mono text-zinc-600">
                            Score: {entry.result.riskScore}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {history.length > 0 && (
                  <div className="p-4 border-t border-zinc-800">
                    <button 
                      onClick={() => {
                        if(confirm('Clear all history?')) setHistory([]);
                      }}
                      className="w-full py-2 text-xs font-medium text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      Clear All History
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-emerald-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Patient Indicators</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Age" 
                  name="age" 
                  type="number" 
                  icon={User} 
                  value={patientData.age} 
                  onChange={handleInputChange} 
                />
                <SelectField 
                  label="Gender" 
                  name="gender" 
                  icon={User} 
                  value={patientData.gender} 
                  onChange={handleInputChange}
                  options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Other', value: 'other' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Systolic BP" 
                  name="systolicBP" 
                  type="number" 
                  icon={Activity} 
                  value={patientData.systolicBP} 
                  onChange={handleInputChange} 
                />
                <InputField 
                  label="Diastolic BP" 
                  name="diastolicBP" 
                  type="number" 
                  icon={Activity} 
                  value={patientData.diastolicBP} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Cholesterol" 
                  name="cholesterol" 
                  type="number" 
                  icon={Heart} 
                  value={patientData.cholesterol} 
                  onChange={handleInputChange} 
                />
                <InputField 
                  label="Blood Sugar" 
                  name="bloodSugar" 
                  type="number" 
                  icon={Activity} 
                  value={patientData.bloodSugar} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Heart Rate" 
                  name="heartRate" 
                  type="number" 
                  icon={Heart} 
                  value={patientData.heartRate} 
                  onChange={handleInputChange} 
                />
                <InputField 
                  label="BMI" 
                  name="bmi" 
                  type="number" 
                  step="0.1"
                  icon={Activity} 
                  value={patientData.bmi} 
                  onChange={handleInputChange} 
                />
              </div>

              <SelectField 
                label="Physical Activity" 
                name="physicalActivity" 
                icon={Activity} 
                value={patientData.physicalActivity} 
                onChange={handleInputChange}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Moderate', value: 'moderate' },
                  { label: 'High', value: 'high' },
                ]}
              />

              <CheckboxField 
                label="Smoking History" 
                icon={AlertCircle} 
                checked={patientData.smoking} 
                onChange={(val: boolean) => setPatientData(p => ({ ...p, smoking: val }))} 
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-900/20"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <>
                    Analyze Risk Profile
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Info className="text-blue-400" size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-zinc-300">Data Privacy</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                This system uses advanced AI to analyze medical patterns. Data is processed in real-time and not stored permanently.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-zinc-950/50 border border-zinc-800 rounded-3xl relative overflow-hidden"
              >
                {/* AI Pulse Animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px]"
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 relative">
                    <Activity size={40} className="text-emerald-500" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-4px] border-2 border-emerald-500/30 border-t-emerald-500 rounded-2xl"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-zinc-100">Analyzing Medical Patterns</h3>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Processing Clinical Data</span>
                    </div>
                  </div>

                  {/* Skeleton Preview */}
                  <div className="mt-12 w-full max-w-md space-y-4 opacity-20">
                    <div className="h-8 bg-zinc-800 rounded-lg w-3/4 mx-auto animate-pulse" />
                    <div className="h-4 bg-zinc-800 rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-zinc-800 rounded-lg w-5/6 mx-auto animate-pulse" />
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : !result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-3xl"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                  <Activity size={40} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-300 mb-2">Ready for Analysis</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  Enter patient medical data on the left to generate a comprehensive AI-powered disease risk assessment.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Risk Summary Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Activity size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Risk Assessment Result</span>
                        <div className="h-[1px] flex-1 bg-zinc-800" />
                      </div>
                      <h2 className="text-4xl font-bold tracking-tight mb-4">
                        {result.prediction}
                      </h2>
                      <p className="text-zinc-400 leading-relaxed max-w-2xl">
                        {result.insights}
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={364}
                          strokeDashoffset={364 - (364 * result.riskScore) / 100}
                          strokeLinecap="round"
                          className={cn(
                            "transition-all duration-1000 ease-out",
                            result.riskScore < 30 ? "text-emerald-500" :
                            result.riskScore < 60 ? "text-amber-500" :
                            "text-rose-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{result.riskScore}%</span>
                        <span className="text-[10px] font-mono uppercase text-zinc-500">Risk Score</span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-sm font-bold uppercase tracking-widest",
                      getRiskColor(result.riskLevel)
                    )}>
                      {result.riskLevel} Risk
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard 
                    label="Blood Pressure" 
                    value={`${patientData.systolicBP}/${patientData.diastolicBP}`} 
                    unit="mmHg" 
                    status={patientData.systolicBP > 140 ? 'Critical' : patientData.systolicBP > 130 ? 'Warning' : 'Normal'}
                    icon={Activity} 
                  />
                  <MetricCard 
                    label="Cholesterol" 
                    value={patientData.cholesterol} 
                    unit="mg/dL" 
                    status={patientData.cholesterol > 240 ? 'Critical' : patientData.cholesterol > 200 ? 'Warning' : 'Normal'}
                    icon={Heart} 
                  />
                  <MetricCard 
                    label="Blood Sugar" 
                    value={patientData.bloodSugar} 
                    unit="mg/dL" 
                    status={patientData.bloodSugar > 126 ? 'Critical' : patientData.bloodSugar > 100 ? 'Warning' : 'Normal'}
                    icon={Activity} 
                  />
                  <MetricCard 
                    label="Body Mass Index" 
                    value={patientData.bmi} 
                    unit="BMI" 
                    status={patientData.bmi > 30 ? 'Critical' : patientData.bmi > 25 ? 'Warning' : 'Normal'}
                    icon={User} 
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Metric Comparison
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#52525b', fontSize: 10 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#52525b', fontSize: 10 }} 
                          />
                          <Tooltip 
                            cursor={{ fill: '#18181b' }}
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value > entry.normal * 1.2 ? '#f43f5e' : entry.value > entry.normal ? '#f59e0b' : '#10b981'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Health Profile Radar
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525b', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                          <Radar
                            name="Patient"
                            dataKey="A"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Key Factors & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Key Risk Factors
                    </h3>
                    <div className="space-y-4">
                      {result.keyFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                          <div className={cn(
                            "p-1.5 rounded-lg mt-0.5",
                            factor.impact === 'negative' ? "bg-rose-500/10 text-rose-400" :
                            factor.impact === 'positive' ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-zinc-500/10 text-zinc-400"
                          )}>
                            {factor.impact === 'negative' ? <TrendingDown size={14} /> : 
                             factor.impact === 'positive' ? <TrendingUp size={14} /> : 
                             <Minus size={14} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-zinc-200">{factor.factor}</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">{factor.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Medical Recommendations
                    </h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <ArrowRight size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-xs text-zinc-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-zinc-600">
            <Activity size={16} />
            <span className="text-xs font-mono uppercase tracking-widest">Disease Prediction System</span>
          </div>
          <p className="text-[10px] text-zinc-600 max-w-md text-center md:text-right leading-relaxed">
            Disclaimer: This application is for educational and research purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
