import { Camera } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="chat-header px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Camera className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h1 className="font-semibold text-base">Photogenic Edition</h1>
        <p className="text-xs opacity-80">Photo Contest Registration</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
        <span className="text-xs opacity-80">Online</span>
      </div>
    </header>
  );
}
