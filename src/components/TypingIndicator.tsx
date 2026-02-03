export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-message-in">
      <div className="chat-bubble-bot px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-chat-typing rounded-full animate-typing"></span>
          <span className="w-2 h-2 bg-chat-typing rounded-full animate-typing animate-typing-delay-1"></span>
          <span className="w-2 h-2 bg-chat-typing rounded-full animate-typing animate-typing-delay-2"></span>
        </div>
      </div>
    </div>
  );
}
