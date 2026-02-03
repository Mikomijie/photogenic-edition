import { Message } from '@/types/chat';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isBot = message.type === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-message-in`}>
      <div className={`max-w-[85%] ${isBot ? 'chat-bubble-bot' : 'chat-bubble-user'} px-4 py-2.5 shadow-sm`}>
        {message.isFile && message.fileUrl && (
          <div className="mb-2">
            {message.fileType === 'image' ? (
              <img 
                src={message.fileUrl} 
                alt={message.fileName} 
                className="max-w-full h-auto rounded-lg max-h-48 object-cover"
              />
            ) : (
              <video 
                src={message.fileUrl}
                controls
                className="max-w-full h-auto rounded-lg max-h-48"
              />
            )}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isBot ? 'chat-timestamp' : 'opacity-70'} text-right`}>
          {format(message.timestamp, 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
