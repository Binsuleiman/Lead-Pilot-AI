import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { SpeechToTextButton } from '../common/SpeechToTextButton';
import {
  Sparkles,
  MapPin,
  Building2,
  Sliders,
  FileText,
  HelpCircle,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const NewLeadSearch: React.FC = () => {
  const { startNewSearch, dataSourceMode, setDataSourceMode, isDiscoveryConfigured } = useApp();

  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(20);
  const [criteria, setCriteria] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Quick preset criteria for immediate one-click testing
  const presets = [
    {
      label: 'HVAC in Atlanta',
      industry: 'HVAC companies',
      location: 'Atlanta, Georgia',
      quantity: 20,
      criteria: 'Businesses without a website or businesses with outdated websites.',
      additionalInstructions: 'Prioritize commercial and residential contractors with verified phone lines.',
    },
    {
      label: 'Roofers in Austin',
      industry: 'Roofing contractors',
      location: 'Austin, Texas',
      quantity: 15,
      criteria: 'Businesses without a modern website or missing online booking.',
      additionalInstructions: 'Commercial roofing companies with solid ratings.',
    },
    {
      label: 'Plumbers in Denver',
      industry: 'Plumbing services',
      location: 'Denver, Colorado',
      quantity: 10,
      criteria: 'Plumbers without an active website or operating solely via phone dispatch.',
      additionalInstructions: 'Independent local service operators.',
    },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setIndustry(preset.industry);
    setLocation(preset.location);
    setQuantity(preset.quantity);
    setCriteria(preset.criteria);
    setAdditionalInstructions(preset.additionalInstructions);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim()) {
      setError('Please specify the industry or type of business.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the target city and state or region.');
      return;
    }
    if (!criteria.trim()) {
      setError('Please define your lead qualification criteria.');
      return;
    }

    setError(null);
    startNewSearch({
      industry: industry.trim(),
      location: location.trim(),
      quantity,
      criteria: criteria.trim(),
      additionalInstructions: additionalInstructions.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
            <span>Autonomous AI Employee Mission</span>
          </div>

          {/* Mode Switch in Form Header */}
          <div className="flex items-center p-0.5 sm:p-1 bg-zinc-100 rounded-lg border border-zinc-200 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDataSourceMode('real')}
              className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                dataSourceMode === 'real'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dataSourceMode === 'real' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
              <span>Real Data</span>
            </button>
            <button
              type="button"
              onClick={() => setDataSourceMode('demo')}
              className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                dataSourceMode === 'demo'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dataSourceMode === 'demo' ? 'bg-amber-500' : 'bg-zinc-400'}`} />
              <span>Demo Data</span>
            </button>
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Define Your Search Criteria
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
          Tell LeadPilot who you're looking for. It finds them, researches them, qualifies them, and
          prepares them for outreach.
        </p>

        {/* Real Data vs Demo Notice Banner */}
        {dataSourceMode === 'real' ? (
          <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">Real Business Discovery Active</p>
              <p className="text-emerald-800/90 mt-0.5 leading-relaxed text-[11px] sm:text-xs">
                LeadPilot queries real business listings matching your industry and location using
                Google Places business discovery.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Demo Mode — Sample Businesses</p>
              <p className="text-amber-800/90 mt-0.5 leading-relaxed text-[11px] sm:text-xs">
                Currently running in demo testing mode with curated fictional businesses. Switch to
                "Real Data" above to discover live businesses.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Example Missions
          </span>
          <span>Click to populate form instantly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3.5 py-2.5 text-left rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/70 transition-all text-xs group"
            >
              <p className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                {preset.label}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{preset.criteria}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg" className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Industry Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  Industry <span className="text-rose-500">*</span>
                </label>
                <SpeechToTextButton
                  onTranscript={(text) => setIndustry(text)}
                  currentValue={industry}
                  size="xs"
                />
              </div>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. HVAC companies"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
              />
              <p className="text-[11px] text-zinc-400">Target industry, trade, or business niche</p>
            </div>

            {/* Location Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  Location <span className="text-rose-500">*</span>
                </label>
                <SpeechToTextButton
                  onTranscript={(text) => setLocation(text)}
                  currentValue={location}
                  size="xs"
                />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Atlanta, Georgia"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
              />
              <p className="text-[11px] text-zinc-400">City, metropolitan area, or state</p>
            </div>
          </div>

          {/* Number of leads (1-100) */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                Number of Leads to Research
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-zinc-900">{quantity}</span>
                <span className="text-xs text-zinc-400">leads</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer h-2 bg-zinc-200 rounded-lg"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                }
                className="w-20 px-2.5 py-1.5 text-center text-sm font-mono font-semibold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Select between 1 and 100 businesses for this research mission.
            </p>
          </div>

          {/* Lead criteria */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                Lead Criteria <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">AI Qualification Filter</span>
                <SpeechToTextButton
                  onTranscript={(text) => setCriteria(text)}
                  currentValue={criteria}
                  variant="pill"
                  size="xs"
                  label="Dictate"
                />
              </div>
            </div>
            <div className="relative">
              <textarea
                rows={4}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="Describe the type of businesses you want to find..."
                className="w-full px-3.5 py-2.5 pr-9 text-sm bg-white border border-zinc-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 leading-relaxed font-sans"
              />
              <div className="absolute right-2.5 bottom-3">
                <SpeechToTextButton
                  onTranscript={(text) => setCriteria(text)}
                  currentValue={criteria}
                  size="xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
              <span className="font-semibold text-zinc-700">Example:</span>
              <span>"Businesses without a website or businesses with outdated websites."</span>
            </p>
          </div>

          {/* Additional instructions */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                Additional Instructions{' '}
                <span className="text-zinc-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Outreach & research nuances</span>
                <SpeechToTextButton
                  onTranscript={(text) => setAdditionalInstructions(text)}
                  currentValue={additionalInstructions}
                  size="xs"
                />
              </div>
            </div>
            <div className="relative">
              <textarea
                rows={2}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Anything else the AI employee should consider?"
                className="w-full px-3.5 py-2 pr-9 text-sm bg-white border border-zinc-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 leading-relaxed font-sans"
              />
              <div className="absolute right-2.5 bottom-2.5">
                <SpeechToTextButton
                  onTranscript={(text) => setAdditionalInstructions(text)}
                  currentValue={additionalInstructions}
                  size="xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              e.g. "Focus on commercial providers with over 15 reviews, tone should be consultative."
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Qualifies leads & crafts personalized outreach</span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-sm font-semibold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-sm hover:shadow active:scale-[0.99] cursor-pointer min-h-[48px] w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-zinc-300" />
              <span>Find Leads</span>
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
};
