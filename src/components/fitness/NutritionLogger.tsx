'use client';

import { useState, useRef } from 'react';
import type { NutritionLog } from '@/lib/types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type AnalysisResult = {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export default function NutritionLogger({
  onSave,
}: {
  onSave: (log: Omit<NutritionLog, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [step, setStep] = useState<'idle' | 'analyzing' | 'review'>('idle');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStep('analyzing');

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Analyze with AI
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/fitness/nutrition/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await res.json();
      setAnalysis(result);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('idle');
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await onSave({
        date: new Date().toISOString().slice(0, 10),
        meal_type: mealType,
        description: analysis.description,
        calories: analysis.calories,
        protein_g: analysis.protein_g,
        carbs_g: analysis.carbs_g,
        fat_g: analysis.fat_g,
        photo_url: null,
      });
      // Reset
      setStep('idle');
      setPreview(null);
      setAnalysis(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setPreview(null);
    setAnalysis(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        Log Meal
      </p>

      {/* Meal type selector */}
      <div className="flex gap-2 mb-3">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mealType === type
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'text-zinc-500 border border-white/5 hover:text-zinc-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Photo upload area */}
      {step === 'idle' && (
        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/10 p-6 cursor-pointer hover:border-green-500/30 transition">
          <span className="text-2xl">📷</span>
          <span className="text-sm text-zinc-400">Tap to snap or upload a photo</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
        </label>
      )}

      {/* Analyzing state */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center gap-3 py-6">
          {preview && (
            <img src={preview} alt="Food" className="w-32 h-32 object-cover rounded-lg" />
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="animate-spin">⏳</span>
            Analyzing your meal...
          </div>
        </div>
      )}

      {/* Review & edit */}
      {step === 'review' && analysis && (
        <div className="space-y-3">
          {preview && (
            <img src={preview} alt="Food" className="w-full h-40 object-cover rounded-lg" />
          )}
          <p className="text-sm text-zinc-300">{analysis.description}</p>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Cal', key: 'calories' as const, unit: '' },
              { label: 'Protein', key: 'protein_g' as const, unit: 'g' },
              { label: 'Carbs', key: 'carbs_g' as const, unit: 'g' },
              { label: 'Fat', key: 'fat_g' as const, unit: 'g' },
            ].map(({ label, key, unit }) => (
              <div key={key} className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</p>
                <input
                  type="number"
                  value={analysis[key]}
                  onChange={(e) => setAnalysis({ ...analysis, [key]: Number(e.target.value) })}
                  className="w-full text-center text-lg font-bold text-zinc-100 bg-transparent border-b border-white/10 focus:border-green-500/50 outline-none py-1"
                />
                {unit && <p className="text-[9px] text-zinc-600">{unit}</p>}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-green-500/15 border border-green-500/20 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500/25 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
