import { useState, useCallback, useRef } from 'react';
import { Message, RegistrationData, ChatStep } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from './useTranslation';

const generateId = () => Math.random().toString(36).substring(2, 9);

const BOT_MESSAGES: Record<ChatStep, string> = {
  welcome: "👋 Welcome to the Photogenic Edition Photo Contest! Registration and voting are FREE. Let's get you registered!",
  email: "What's your email address? 📧",
  firstName: "Great! What's your first name? 😊",
  middleName: "Middle name? (Type 'none' if you don't have one)",
  surname: "What's your surname?",
  age: "How old are you? 🎂",
  stateOfOrigin: "What's your state of origin? 🏠",
  lga: "Which LGA are you from?",
  photo: "Please upload your professional photograph 📸\n\n(Max 5MB, JPG or PNG)",
  video: "Finally, upload your introduction video 🎥\n\n(Max 50MB, MP4 format)",
  confirmation: "",
  complete: "🎉 Registration successful! Your entry has been submitted. Good luck! 🍀\n\nWe'll contact you via email with updates about the contest.",
};

const STEP_ORDER: ChatStep[] = [
  'welcome', 'email', 'firstName', 'middleName', 'surname',
  'age', 'stateOfOrigin', 'lga', 'photo', 'video', 'confirmation', 'complete',
];

export function useChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<ChatStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: '', firstName: '', middleName: '', surname: '',
    age: '', stateOfOrigin: '', lga: '',
    photo: null, photoUrl: '', video: null, videoUrl: '',
  });
  
  const hasStarted = useRef(false);
  const isFirstUserMessage = useRef(true);
  const { detectedLanguage, detectAndTranslate, translate, resetLanguage, setLanguage } = useTranslation();

  const addBotMessageRaw = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: generateId(), type: 'bot', content, timestamp: new Date(),
    }]);
  }, []);

  const addBotMessage = useCallback(async (content: string, userInput?: string) => {
    setIsTyping(true);

    let translatedContent = content;
    try {
      if (userInput) {
        // Always re-detect language from user input so switching languages works
        translatedContent = await detectAndTranslate(content, userInput);
      } else {
        translatedContent = await translate(content);
      }
    } catch {
      // Fallback to original
    }

    setIsTyping(false);
    addBotMessageRaw(translatedContent);
  }, [detectAndTranslate, translate, addBotMessageRaw]);

  const addBotMessageNoTranslate = useCallback((content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessageRaw(content);
    }, 1000 + Math.random() * 500);
  }, [addBotMessageRaw]);

  const addUserMessage = useCallback((content: string, isFile = false, fileName?: string, fileType?: 'image' | 'video', fileUrl?: string) => {
    setMessages(prev => [...prev, {
      id: generateId(), type: 'user', content, timestamp: new Date(),
      isFile, fileName, fileType, fileUrl,
    }]);
  }, []);

  const generateConfirmationMessage = (data: RegistrationData) => {
    return `📋 Here's a summary of your registration:\n\n` +
      `📧 Email: ${data.email}\n` +
      `👤 Name: ${data.firstName} ${data.middleName === 'none' ? '' : data.middleName} ${data.surname}\n` +
      `🎂 Age: ${data.age}\n` +
      `🏠 State: ${data.stateOfOrigin}\n` +
      `📍 LGA: ${data.lga}\n` +
      `📸 Photo: Uploaded ✅\n` +
      `🎥 Video: Uploaded ✅\n\n` +
      `Is everything correct? Reply YES to submit or NO to start over`;
  };

  const startChat = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    // Welcome messages don't get translated (no user input yet)
    addBotMessageNoTranslate(BOT_MESSAGES.welcome);
    
    setTimeout(() => {
      setCurrentStep('email');
      addBotMessageNoTranslate(BOT_MESSAGES.email);
    }, 2000);
  }, [addBotMessageNoTranslate]);

  const validateInput = (step: ChatStep, value: string): string | null => {
    switch (step) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address 📧";
        break;
      }
      case 'age': {
        const age = parseInt(value);
        if (isNaN(age) || age < 5 || age > 99) return "Please enter a valid age between 5 and 99 🎂";
        break;
      }
      case 'firstName':
        if (value.trim().includes(' ')) return "Please enter only your first name (one word) 😊";
        if (value.trim().length < 2) return "Please enter at least 2 characters";
        break;
      case 'surname':
      case 'stateOfOrigin':
      case 'lga':
        if (value.trim().length < 2) return "Please enter at least 2 characters";
        break;
    }
    return null;
  };

  const uploadFileToStorage = async (file: File, folder: string, email: string): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
      const ext = file.name.split('.').pop() || (folder === 'photos' ? 'jpg' : 'mp4');
      const fileName = `${folder}/${sanitizedEmail}_${timestamp}.${ext}`;

      const { error } = await supabase.storage
        .from('registrations')
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (error) { console.error(`Upload ${folder} error:`, error); return null; }

      const { data: urlData } = supabase.storage
        .from('registrations')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading ${folder}:`, error);
      return null;
    }
  };

  const submitToAirtable = async (data: RegistrationData): Promise<boolean> => {
    try {
      // Upload files directly to storage from client
      let photoUrl = '';
      let videoUrl = '';
      if (data.photo) {
        const url = await uploadFileToStorage(data.photo, 'photos', data.email);
        if (url) photoUrl = url;
      }
      if (data.video) {
        const url = await uploadFileToStorage(data.video, 'videos', data.email);
        if (url) videoUrl = url;
      }

      const { data: response, error } = await supabase.functions.invoke('submit-registration', {
        body: {
          email: data.email, firstName: data.firstName, middleName: data.middleName,
          surname: data.surname, age: data.age, stateOfOrigin: data.stateOfOrigin,
          lga: data.lga, photoUrl, videoUrl,
        },
      });

      if (error) { console.error('Edge function error:', error); return false; }
      return response?.success === true;
    } catch (error) {
      console.error('Error submitting:', error);
      return false;
    }
  };

  const processUserInput = useCallback(async (input: string) => {
    const trimmedInput = input.trim();
    addUserMessage(trimmedInput);

    if (currentStep === 'confirmation') {
      if (trimmedInput.toUpperCase() === 'YES') {
        const finalData = { ...registrationData, submittedAt: new Date() };
        await addBotMessage("⏳ Submitting your registration...", trimmedInput);
        const success = await submitToAirtable(finalData);
        
        if (success) {
          const existingData = JSON.parse(localStorage.getItem('registrations') || '[]');
          existingData.push(finalData);
          localStorage.setItem('registrations', JSON.stringify(existingData));
          setCurrentStep('complete');
          await addBotMessage(BOT_MESSAGES.complete, trimmedInput);
        } else {
          await addBotMessage("❌ Something went wrong. Please try again by typing YES to resubmit.", trimmedInput);
        }
        return;
      } else if (trimmedInput.toUpperCase() === 'NO') {
        hasStarted.current = false;
        isFirstUserMessage.current = true;
        setMessages([]);
        setRegistrationData({
          email: '', firstName: '', middleName: '', surname: '',
          age: '', stateOfOrigin: '', lga: '',
          photo: null, photoUrl: '', video: null, videoUrl: '',
        });
        setCurrentStep('welcome');
        resetLanguage();
        setTimeout(() => startChat(), 500);
        return;
      } else {
        await addBotMessage("Please reply YES to confirm or NO to start over 🤔", trimmedInput);
        return;
      }
    }

    // Validate input
    const error = validateInput(currentStep, trimmedInput);
    if (error) {
      await addBotMessage(error, trimmedInput);
      return;
    }

    // Update registration data
    const fieldMap: Record<string, keyof RegistrationData> = {
      email: 'email', firstName: 'firstName', middleName: 'middleName',
      surname: 'surname', age: 'age', stateOfOrigin: 'stateOfOrigin', lga: 'lga',
    };

    const field = fieldMap[currentStep];
    if (field) {
      setRegistrationData(prev => ({ ...prev, [field]: trimmedInput }));
    }

    // Move to next step
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const nextStep = STEP_ORDER[currentIndex + 1];
    
    if (nextStep && nextStep !== 'confirmation' && nextStep !== 'complete') {
      setCurrentStep(nextStep);
      await addBotMessage(BOT_MESSAGES[nextStep], trimmedInput);
    }
  }, [currentStep, addUserMessage, addBotMessage, registrationData, startChat, resetLanguage]);

  const handleFileUpload = useCallback(async (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const maxSizeLabel = type === 'image' ? '5MB' : '50MB';
    
    if (file.size > maxSize) {
      await addBotMessage(`❌ File too large! Maximum size is ${maxSizeLabel}. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please upload a smaller file.`);
      return;
    }

    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/jpg']
      : ['video/mp4'];
    
    if (!allowedTypes.includes(file.type)) {
      await addBotMessage(`❌ Invalid file type! Please upload ${type === 'image' ? 'a JPG or PNG image' : 'an MP4 video'}.`);
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    
    addUserMessage(
      type === 'image' ? '📸 Photo uploaded' : '🎥 Video uploaded',
      true, file.name, type, fileUrl
    );

    if (type === 'image') {
      setRegistrationData(prev => ({ ...prev, photo: file, photoUrl: fileUrl }));
      setCurrentStep('video');
      await addBotMessage(BOT_MESSAGES.video);
    } else {
      setRegistrationData(prev => ({ ...prev, video: file, videoUrl: fileUrl }));
      setCurrentStep('confirmation');
      
      setIsTyping(true);
      const updatedData = { ...registrationData, video: file, videoUrl: fileUrl };
      const confirmMsg = generateConfirmationMessage(updatedData);
      const translated = await translate(confirmMsg);
      setIsTyping(false);
      addBotMessageRaw(translated);
    }
  }, [addUserMessage, addBotMessage, registrationData, translate, addBotMessageRaw]);

  const resetChat = useCallback(() => {
    hasStarted.current = false;
    isFirstUserMessage.current = true;
    setMessages([]);
    setRegistrationData({
      email: '', firstName: '', middleName: '', surname: '',
      age: '', stateOfOrigin: '', lga: '',
      photo: null, photoUrl: '', video: null, videoUrl: '',
    });
    setCurrentStep('welcome');
    resetLanguage();
  }, [resetLanguage]);

  return {
    messages, currentStep, isTyping, registrationData, detectedLanguage,
    startChat, processUserInput, handleFileUpload, resetChat,
  };
}
