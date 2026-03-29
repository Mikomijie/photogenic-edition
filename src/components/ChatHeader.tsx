import { Camera, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  detectedLanguage?: string | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', es: 'Español', pt: 'Português',
  ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', ar: 'العربية',
  sw: 'Kiswahili', zu: 'isiZulu', pcm: 'Pidgin', de: 'Deutsch',
  it: 'Italiano', zh: ' 中文', ja: '日本語', ko: '한국어',
  hi: 'हिन्दी', ru: 'Русский', tr: 'Türkçe', nl: 'Nederlands',
};

export function ChatHeader({ detectedLanguage }: ChatHeaderProps) {
  const langLabel = detectedLanguage
    ? LANGUAGE_NAMES[detectedLanguage] || detectedLanguage.toUpperCase()
    : null;

  return (
    <header className="chat-header px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Camera className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h1 className="font-semibold text-base">Photogenic Edition</h1>
        <p className="text-xs opacity-80">Photo Contest Registration</p>
      </div>
      {langLabel && (
        <Badge variant="secondary" className="flex items-center gap-1 bg-white/20 text-white border-white/30 text-xs">
          <Globe className="w-3 h-3" />
          {langLabel}
        </Badge>
      )}
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
        <span className="text-xs opacity-80">Online</span>
      </div>
    </header>
  );
}
