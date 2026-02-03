import { useState, useRef } from 'react';
import { Send, Paperclip, Image, Video } from 'lucide-react';
import { ChatStep } from '@/types/chat';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload: (file: File, type: 'image' | 'video') => void;
  currentStep: ChatStep;
  disabled?: boolean;
}

export function ChatInput({ onSend, onFileUpload, currentStep, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showFileOptions, setShowFileOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isFileStep = currentStep === 'photo' || currentStep === 'video';
  const isComplete = currentStep === 'complete';

  const handleSend = () => {
    if (message.trim() && !isFileStep) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/jpg']
      : ['video/mp4'];

    if (file.size > maxSize) {
      toast.error(`File too large! Max size is ${type === 'image' ? '5MB' : '50MB'}`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type! Please upload ${type === 'image' ? 'JPG or PNG' : 'MP4'}`);
      return;
    }

    onFileUpload(file, type);
    setShowFileOptions(false);
    e.target.value = '';
  };

  if (isComplete) {
    return (
      <div className="chat-input-container px-4 py-3 border-t border-border">
        <p className="text-center text-muted-foreground text-sm">
          ✨ Registration complete! Thank you for participating.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-input-container px-3 py-3 border-t border-border sticky bottom-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleFileChange(e, 'video')}
        accept="video/mp4"
        className="hidden"
      />

      {showFileOptions && (
        <div className="absolute bottom-full left-3 mb-2 bg-card rounded-xl shadow-lg p-2 flex gap-2 animate-message-in">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Image className="w-5 h-5 text-primary" />
            <span className="text-sm">Photo</span>
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Video className="w-5 h-5 text-primary" />
            <span className="text-sm">Video</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isFileStep && (
          <button
            onClick={() => setShowFileOptions(!showFileOptions)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isFileStep ? "Tap 📎 to upload file..." : "Type a message..."}
            disabled={disabled || isFileStep}
            className="w-full px-4 py-2.5 rounded-full bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isFileStep}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
