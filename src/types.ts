export interface Question {
  id: string;
  questionText: string;
  options: string[]; // 4 options
  correctIndex: number; // 0, 1, 2, 3 representing A, B, C, D
  explanation: string;
  image?: string; // Image URL or base64
  optionImages?: string[]; // Array of 4 elements corresponding to opt A, B, C, D (base64 or empty)
}

export interface Quiz {
  id: string; // Internal id
  code: string; // Vietnamese "Mã đề" (6-digit alphanumeric)
  title: string;
  subject: string;
  grade: string;
  description: string;
  createdAt: string;
  questions: Question[];
  durationMinutes?: number; // Time limit in minutes (optional, e.g. 15, 45, 90 mins or undefined for no limit)
  showAnswersAfterCompletion?: boolean; // Show correct answers and explanations after finishing (default is true)
  teacherEmail?: string; // Teacher's Gmail of the creator
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  studentName: string;
  studentClass: string;
  answers: { [questionId: string]: number }; // questionId -> chosen index
  score: number; // calculated scale of 10
  correctCount: number;
  totalCount: number;
  submittedAt: string;
  durationSeconds: number;
}
