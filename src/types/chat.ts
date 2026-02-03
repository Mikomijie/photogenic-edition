export interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isFile?: boolean;
  fileName?: string;
  fileType?: 'image' | 'video';
  fileUrl?: string;
}

export interface RegistrationData {
  email: string;
  firstName: string;
  middleName: string;
  surname: string;
  age: string;
  stateOfOrigin: string;
  lga: string;
  photo: File | null;
  photoUrl: string;
  video: File | null;
  videoUrl: string;
  submittedAt?: Date;
}

export type ChatStep = 
  | 'welcome'
  | 'email'
  | 'firstName'
  | 'middleName'
  | 'surname'
  | 'age'
  | 'stateOfOrigin'
  | 'lga'
  | 'photo'
  | 'video'
  | 'confirmation'
  | 'complete';
