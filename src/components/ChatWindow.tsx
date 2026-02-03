import { useEffect, useRef } from 'react';
import { useChatBot } from '@/hooks/useChatBot';
import { ChatHeader } from './ChatHeader';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const {
    messages,
    currentStep,
    isTyping,
    startChat,
    processUserInput,
    handleFileUpload,
  } = useChatBot();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startChat();
    }
  }, [startChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="h-screen flex flex-col chat-container max-w-lg mx-auto">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={processUserInput}
        onFileUpload={handleFileUpload}
        currentStep={currentStep}
        disabled={isTyping}
      />
    </div>
  );
}
