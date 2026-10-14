import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export interface SpeechToTextButtonProps {
  /** Current text value in the associated input/textarea (for smart append) */
  value?: string;
  /** Alias for value */
  currentValue?: string;
  /** Callback fired whenever speech is transcribed (receives full updated text) */
  onChange?: (newText: string) => void;
  /** Direct callback that receives the transcribed text chunk/session or combined text */
  onTranscript?: (transcript: string) => void;
  /** Visual variant */
  variant?: 'pill' | 'icon' | 'default';
  /** Button visual size */
  size?: 'xs' | 'sm' | 'md';
  /** Additional custom class names */
  className?: string;
  /** Custom tooltip / title */
  title?: string;
  /** Language for speech recognition (default: 'en-US') */
  lang?: string;
  /** Whether to show a compact text label alongside the icon */
  showLabel?: boolean;
  /** Optional custom label text */
  label?: string;
  /** Minimalist icon-only mode with subtle borderless styling */
  minimal?: boolean;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  value,
  currentValue,
  onChange,
  onTranscript,
  variant = 'default',
  size = 'sm',
  className = '',
  title,
  lang = 'en-US',
  showLabel = false,
  label = 'Dictate',
  minimal = false,
}) => {
  const effectiveValue = currentValue !== undefined ? currentValue : (value || '');
  const isPill = variant === 'pill' || showLabel;
  const isIconOnly = variant === 'icon' || (!isPill && !showLabel);
  const isMinimal = minimal || variant === 'icon';

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>(effectiveValue);
  const isListeningRef = useRef<boolean>(false);
  const animIntervalRef = useRef<any>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSupport =
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window ||
      'mozSpeechRecognition' in window ||
      'msSpeechRecognition' in window;
    setIsSupported(hasSupport);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      baseValueRef.current = effectiveValue || '';

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      // Simulated audio waveform feedback animation
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      animIntervalRef.current = setInterval(() => {
        setAudioLevel((prev) => (prev + 1) % 4);
      }, 250);

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const transcriptChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            sessionFinal += (sessionFinal ? ' ' : '') + transcriptChunk.trim();
          } else {
            interim += (interim ? ' ' : '') + transcriptChunk.trim();
          }
        }

        const fullSpoken = (sessionFinal + (interim ? (sessionFinal ? ' ' : '') + interim : '')).trim();

        if (fullSpoken) {
          const base = baseValueRef.current.trim();
          const combined = base ? `${base} ${fullSpoken}` : fullSpoken;

          if (onTranscript) {
            onTranscript(base ? combined : fullSpoken);
          }

          if (onChange) {
            onChange(combined);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        if (error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
          stopListening();
        } else if (error === 'no-speech') {
          // Normal timeout if user was quiet, don't crash
        } else if (error === 'network') {
          setErrorMessage('Network connection error during voice transcription.');
          stopListening();
        } else if (error === 'audio-capture') {
          setErrorMessage('No microphone was detected. Please plug in or select a microphone.');
          stopListening();
        } else {
          console.warn('Speech recognition warning:', error);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          // If ended without explicit stop, stop gracefully
          stopListening();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(err?.message || 'Could not access speech recognition service.');
      stopListening();
    }
  }, [value, onChange, onTranscript, lang, stopListening]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Dimensions based on size prop
  const sizeClasses = {
    xs: 'p-1 text-[11px] h-6',
    sm: 'p-1.5 text-xs h-7.5',
    md: 'px-2.5 py-1.5 text-xs h-9',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  const defaultTitle = isListening
    ? 'Listening to speech... Click to stop dictation'
    : isSupported
    ? 'Transcribe speech to text — Click and speak'
    : 'Speech to text is not supported in this browser (Use Chrome/Edge/Safari)';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={title || defaultTitle}
        aria-label={isListening ? 'Stop speech-to-text dictation' : 'Start speech-to-text dictation'}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer ${sizeClasses} ${
          isListening
            ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/50 animate-pulse'
            : isMinimal
            ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 active:bg-zinc-200/80'
            : isPill
            ? 'border border-zinc-200/90 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs active:bg-zinc-100 px-2'
            : 'border border-zinc-200/90 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs active:bg-zinc-100'
        } ${className}`}
      >
        {isListening ? (
          <>
            <Mic className={`${iconSizes} text-white animate-bounce`} />
            {/* Live animated waveform wave bars */}
            <span className="flex items-center gap-0.5 h-3 px-0.5" aria-hidden="true">
              <span
                className={`w-0.5 bg-white rounded-full transition-all duration-150 ${
                  audioLevel === 0 ? 'h-1.5' : audioLevel === 1 ? 'h-3' : audioLevel === 2 ? 'h-2' : 'h-1'
                }`}
              />
              <span
                className={`w-0.5 bg-white rounded-full transition-all duration-150 ${
                  audioLevel === 1 ? 'h-1.5' : audioLevel === 2 ? 'h-3' : audioLevel === 3 ? 'h-2' : 'h-1'
                }`}
              />
              <span
                className={`w-0.5 bg-white rounded-full transition-all duration-150 ${
                  audioLevel === 2 ? 'h-1.5' : audioLevel === 3 ? 'h-3' : audioLevel === 0 ? 'h-2' : 'h-1.5'
                }`}
              />
            </span>
            <span className="text-[11px] font-semibold text-white">Listening...</span>
          </>
        ) : (
          <>
            <Mic className={`${iconSizes} text-zinc-600 transition-colors group-hover:text-zinc-900`} />
            {isPill && <span className="text-[11px] font-medium">{label}</span>}
          </>
        )}
      </button>

      {/* Floating error notification if permission denied or unsupported */}
      {errorMessage && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs shadow-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[11px] text-rose-950">Dictation Notice</p>
            <p className="text-[10px] text-rose-800 leading-tight mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setErrorMessage(null);
            }}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold px-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
