import { Camera, Globe, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  detectedLanguage?: string | null;
  onLanguageChange?: (lang: string) => void;
}

const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'pcm', label: 'Pidgin' },
  { code: 'ar', label: 'العربية' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
];

const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map(l => [l.code, l.label])
);

export function ChatHeader({ detectedLanguage, onLanguageChange }: ChatHeaderProps) {
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors text-white border border-white/30 rounded-full px-2.5 py-1 text-xs cursor-pointer">
            <Globe className="w-3 h-3" />
            {langLabel || 'Language'}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
          {LANGUAGE_OPTIONS.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange?.(lang.code)}
              className={detectedLanguage === lang.code ? 'bg-accent font-medium' : ''}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
        <span className="text-xs opacity-80">Online</span>
      </div>
    </header>
  );
}
