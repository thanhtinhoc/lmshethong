import React, { useState } from "react";
import { Quiz, Question, StudentSubmission } from "../types";
import { Plus, Trash, Pencil, Search, Download, Printer, User, BookOpen, AlertCircle, Sparkles, Filter, Check, ListChecks, ArrowLeft, RefreshCw, Layers, Upload, FileText, Key, ShieldCheck } from "lucide-react";

interface TeacherDashboardProps {
  quizzes: Quiz[];
  submissions: StudentSubmission[];
  onAddQuiz: (newQuiz: Quiz) => void;
  onUpdateQuiz: (updatedQuiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onLogout: () => void;
  gmailEmail: string;
}

export const getSubjectsForGrade = (grade: string): string[] => {
  const gNum = parseInt(grade, 10);
  if (isNaN(gNum)) return ["Toán Học", "Tiếng Anh", "Tiếng Việt"];
  if (gNum >= 1 && gNum <= 5) {
    return [
      "Toán Học",
      "Tiếng Việt",
      "Tiếng Anh",
      "Tự nhiên và Xã hội",
      "Khoa học",
      "Lịch sử và Địa lý",
      "Tin học",
      "Công nghệ",
      "Đạo đức",
      "Mỹ thuật",
      "Âm nhạc",
      "Giáo dục thể chất",
      "Hoạt động trải nghiệm"
    ];
  } else if (gNum >= 6 && gNum <= 9) {
    return [
      "Toán Học",
      "Ngữ văn",
      "Tiếng Anh",
      "Khoa học tự nhiên",
      "Lịch sử và Địa lý",
      "Vật Lý",
      "Hóa Học",
      "Sinh Học",
      "Giáo dục công dân",
      "Tin học",
      "Công nghệ",
      "Mỹ thuật",
      "Âm nhạc",
      "Hoạt động trải nghiệm, hướng nghiệp"
    ];
  } else {
    return [
      "Toán Học",
      "Ngữ văn",
      "Tiếng Anh",
      "Vật Lý",
      "Hóa Học",
      "Sinh Học",
      "Lịch Sử",
      "Địa Lý",
      "Giáo dục kinh tế và pháp luật",
      "Tin học",
      "Công nghệ",
      "Mỹ thuật",
      "Âm nhạc",
      "Hoạt động trải nghiệm, hướng nghiệp",
      "Quốc phòng và An ninh"
    ];
  }
};

export default function TeacherDashboard({ quizzes, submissions, onAddQuiz, onUpdateQuiz, onDeleteQuiz, onLogout, gmailEmail }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<"tests" | "reports" | "create">("tests");
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  
  // Create exam state
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Toán Học");
  const [newGrade, setNewGrade] = useState("10");
  const [newDescription, setNewDescription] = useState("");
  const [newCode, setNewCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [newDuration, setNewDuration] = useState<string>("15");
  const [showAnswersAfterCompletion, setShowAnswersAfterCompletion] = useState<boolean>(true);

  // API Key management states
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("gemini_user_api_key") || "");
  const [isApiKeyVerified, setIsApiKeyVerified] = useState<boolean>(() => localStorage.getItem("gemini_user_api_key_verified") === "true");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [validationSuccess, setValidationSuccess] = useState<string>("");

  const handleValidateAndSaveApiKey = async (keyToValidate: string) => {
    if (!keyToValidate.trim()) {
      setValidationError("Vui lòng nhập khóa API!");
      return;
    }
    setIsValidatingKey(true);
    setValidationError("");
    setValidationSuccess("");
    try {
      const response = await fetch("/api/validate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToValidate.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Khóa API không hợp lệ. Vui lòng kiểm tra lại kết nối.");
      }
      localStorage.setItem("gemini_user_api_key", keyToValidate.trim());
      localStorage.setItem("gemini_user_api_key_verified", "true");
      setApiKey(keyToValidate.trim());
      setIsApiKeyVerified(true);
      setValidationSuccess("Xác thực thành công! Khóa API Gemini của bạn đã được lưu cấu hình sử dụng lâu dài.");
    } catch (err: any) {
      setValidationError(err.message || "Xác thực thất bại. Vui lòng kiểm tra kỹ khóa API.");
      setIsApiKeyVerified(false);
      localStorage.removeItem("gemini_user_api_key_verified");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_user_api_key");
    localStorage.removeItem("gemini_user_api_key_verified");
    setApiKey("");
    setIsApiKeyVerified(false);
    setTempApiKey("");
    setValidationSuccess("");
    setValidationError("");
  };

  // Individual draft question form state
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qOptionImages, setQOptionImages] = useState<string[]>(["", "", "", ""]);
  const [qCorrectIdx, setQCorrectIdx] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qImage, setQImage] = useState("");

  const handleAddOptionField = () => {
    setQOptions(prev => [...prev, ""]);
    setQOptionImages(prev => [...prev, ""]);
  };

  const handleRemoveOptionField = (indexToRemove: number) => {
    if (qOptions.length <= 2) {
      alert("Câu hỏi trắc nghiệm cần tối thiểu 2 phương án trả lời!");
      return;
    }
    setQOptions(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setQOptionImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (qCorrectIdx === indexToRemove) {
      setQCorrectIdx(0);
    } else if (qCorrectIdx > indexToRemove) {
      setQCorrectIdx(prev => prev - 1);
    }
  };

  // AI generator panel state
  const [aiSubject, setAiSubject] = useState("Toán Học");
  const [aiTopic, setAiTopic] = useState("");
  const [aiGrade, setAiGrade] = useState("10");
  const [aiQuantity, setAiQuantity] = useState(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");
  const [aiErrorMessage, setAiErrorMessage] = useState("");

  // Word/PDF Document parser state
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [docErrorMessage, setDocErrorMessage] = useState("");
  const [docSuccessMessage, setDocSuccessMessage] = useState("");
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Custom confirmation modal states for running in sandboxed web views safely
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  const handleDownloadSampleTemplate = () => {
    const sampleText = `ĐỀ THI ÔN TẬP MẪU CHUẨN ĐẦU VÀO
Môn: Toán Học - Lớp: 10

Câu 1: Cho phương trình x^2 - 5x + 6 = 0. Nghiệm của phương trình là gì?
A. x = 2 và x = 3
B. x = 1 và x = 6
C. x = -2 và x = -3
D. x = 0 và x = 5
Đáp án đúng: A

Câu 2: Công thức tính chu vi hình tròn có bán kính R là gì?
A. C = pi * R
B. C = 2 * pi * R
C. C = pi * R^2
D. C = 4 * pi * R
Đáp án đúng: B

Câu 3: Đâu là một số nguyên tố?
A. 4
B. 6
C. 9
D. 11
Đáp án đúng: D`;

    const blob = new Blob([sampleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "De_Thi_Trac_Nghiem_Mau.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Search and Filter states for student submissions
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterQuizCode, setFilterQuizCode] = useState("ALL");

  // Search and Filter states for compiled quiz listing
  const [quizSearchQuery, setQuizSearchQuery] = useState("");
  const [quizFilterSubject, setQuizFilterSubject] = useState("ALL");
  const [quizFilterGrade, setQuizFilterGrade] = useState("ALL");

  // Reset Create Form
  const resetCreateForm = () => {
    setNewTitle("");
    setNewSubject("Toán Học");
    setNewGrade("10");
    setNewDescription("");
    setNewCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    setDraftQuestions([]);
    setNewDuration("15");
    setShowAnswersAfterCompletion(true);
    setQText("");
    setQOptions(["", "", "", ""]);
    setQOptionImages(["", "", "", ""]);
    setQCorrectIdx(0);
    setQExplanation("");
    setQImage("");
    setDocErrorMessage("");
    setDocSuccessMessage("");
    setIsParsingDoc(false);
    setEditingQuizId(null);
    setEditingQuestionIdx(null);
  };

  // Derived state for teacher quizzes filtering
  const teacherUniqueSubjects = Array.from(new Set(quizzes.map(q => q.subject).filter(Boolean) as string[])).sort();
  const teacherUniqueGrades = Array.from(new Set(quizzes.map(q => q.grade).filter(Boolean) as string[])).sort((a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const teacherFilteredQuizzes = quizzes.filter(quiz => {
    if (quizFilterSubject !== "ALL" && quiz.subject !== quizFilterSubject) {
      return false;
    }
    if (quizFilterGrade !== "ALL" && quiz.grade !== quizFilterGrade) {
      return false;
    }
    if (quizSearchQuery.trim()) {
      const q = quizSearchQuery.toLowerCase().trim();
      const codeMatches = quiz.code.toLowerCase().includes(q);
      const titleMatches = quiz.title.toLowerCase().includes(q);
      const subjectMatches = quiz.subject.toLowerCase().includes(q);
      const gradeMatches = quiz.grade.toLowerCase().includes(q);
      if (!codeMatches && !titleMatches && !subjectMatches && !gradeMatches) {
        return false;
      }
    }
    return true;
  });

  // Add a manual question to the draft
  const handleAddQuestionToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    const emptyOptionIndex = qOptions.findIndex(opt => !opt.trim());
    if (emptyOptionIndex !== -1) {
      alert(`Vui lòng nhập đầy đủ các phương án đáp án (Phương án ${String.fromCharCode(65 + emptyOptionIndex)} đang bị trống)!`);
      return;
    }

    const question: Question = {
      id: editingQuestionIdx !== null && draftQuestions[editingQuestionIdx] ? draftQuestions[editingQuestionIdx].id : "draft_q_" + Date.now(),
      questionText: qText,
      options: qOptions.map(opt => opt.trim()),
      correctIndex: qCorrectIdx,
      explanation: qExplanation.trim() || "Chọn đáp án đúng theo quy tắc kiến thức.",
      image: qImage.trim() || undefined,
      optionImages: qOptionImages.map(img => img.trim())
    };

    if (editingQuestionIdx !== null) {
      setDraftQuestions(prev => prev.map((q, idx) => idx === editingQuestionIdx ? question : q));
      setEditingQuestionIdx(null);
    } else {
      setDraftQuestions(prev => [...prev, question]);
    }
    
    // reset question fields
    setQText("");
    setQOptions(["", "", "", ""]);
    setQOptionImages(["", "", "", ""]);
    setQCorrectIdx(0);
    setQExplanation("");
    setQImage("");
  };

  // Remove question from draft
  const handleRemoveDraftQuestion = (index: number) => {
    setDraftQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  // Call server proxy to trigger Gemini question generation
  const handleGenerateQuestionsFromAI = async () => {
    if (!aiTopic) {
      setAiErrorMessage("Vui lòng nhập chủ đề ôn tập để AI có căn cứ soạn câu hỏi!");
      return;
    }

    setIsGeneratingAI(true);
    setAiErrorMessage("");
    setAiSuccessMessage("");

    try {
      const hMap: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        hMap["x-gemini-api-key"] = apiKey;
      }

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: hMap,
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
          grade: aiGrade,
          quantity: aiQuantity,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể khởi tạo kết nối Gemini.");
      }

      const generatedQuestions = result.data.map((q: any, idx: number) => ({
        id: `ai_${Date.now()}_${idx}`,
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        // Preset high resolution illustration reference or placeholder
        image: "" 
      }));

      setDraftQuestions(prev => [...prev, ...generatedQuestions]);
      setAiSuccessMessage(`Đã soạn thành công ${generatedQuestions.length} câu hỏi chất lượng cao bằng Gemini AI!`);
      setAiTopic(""); // Clear draft
    } catch (err: any) {
      console.log("[AI generator err_tag]", err);
      setAiErrorMessage(err.message || "Không thể gọi Gemini AI. Kiểm tra xem GEMINI_API_KEY đã được định cấu hình chưa.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle local file parsing via backend + Gemini AI
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileInput = e.target;
    setDocErrorMessage("");
    setDocSuccessMessage("");
    setAiErrorMessage("");
    setAiSuccessMessage("");

    // 1. Check file extension
    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValidExt) {
      setDocErrorMessage("Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .pdf, .docx, .doc hoặc .txt.");
      fileInput.value = "";
      return;
    }

    setIsParsingDoc(true);
    console.log(`[File Upload] Đang tiến hành đọc tệp: ${file.name}, kích thước: ${file.size} bytes`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (!result) {
          throw new Error("Không thể cấu trúc dữ liệu thô nhị phân từ tệp tin.");
        }
        const commaIndex = result.indexOf(",");
        const base64Data = commaIndex !== -1 ? result.substring(commaIndex + 1) : result;

        // AbortController for a client-side timeout of 50 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log("[File Upload Timeout_tag] Đã hết thời gian chờ phản hồi từ máy chủ (50 giây).");
        }, 50000);

        try {
          const hMap: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (apiKey) {
            hMap["x-gemini-api-key"] = apiKey;
          }

          const response = await fetch("/api/parse-document-questions", {
            method: "POST",
            headers: hMap,
            signal: controller.signal,
            body: JSON.stringify({
              fileBase64: base64Data,
              fileName: file.name,
              fileMimeType: file.type,
              subject: newSubject,
              grade: newGrade,
              apiKey: apiKey
            }),
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const data = await response.json().catch(() => ({ error: "Hệ thống phản hồi không đúng cấu trúc." }));
            throw new Error(data.error || "Gặp lỗi khi bóc tách thông tin từ tệp.");
          }

          const res = await response.json();
          if (res.success && res.data && Array.isArray(res.data)) {
            const parsedQuestions = res.data.map((q: any, index: number) => ({
              id: "parsed_q_" + Date.now() + "_" + index,
              questionText: q.questionText,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation || "",
              image: ""
            }));

            setDraftQuestions((prev) => [...prev, ...parsedQuestions]);
            
            if (res.isFallback) {
              setDocSuccessMessage(`⚠️ Đã tự động dùng bộ lọc thô dự phòng do máy chủ AI bận. Đã bóc tách thành công ${parsedQuestions.length} câu hỏi từ tệp "${file.name}"!`);
            } else {
              setDocSuccessMessage(`✨ Đã dùng Gemini AI bóc tách và phân loại thành công ${parsedQuestions.length} câu hỏi trắc nghiệm từ tệp "${file.name}"!`);
            }
          } else {
            throw new Error("Không nhận diện được nội dung cấu trúc câu hỏi khả dụng từ file.");
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          console.log("[Parser Fetch Fail_tag]:", fetchErr);
          if (fetchErr.name === "AbortError") {
            setDocErrorMessage("Thời gian xử lý tệp quá lâu (Vượt quá 50 giây). Vui lòng thử lại hoặc rút gọn tệp tin.");
          } else {
            setDocErrorMessage(fetchErr.message || "Đã xảy ra lỗi khi gửi yêu cầu phân tích tệp.");
          }
        } finally {
          setIsParsingDoc(false);
          fileInput.value = "";
        }
      };

      reader.onerror = (readErr) => {
        console.log("[FileReader Err_tag]:", readErr);
        setDocErrorMessage("Lỗi trong quá trình đọc dữ liệu tệp từ trình duyệt.");
        setIsParsingDoc(false);
        fileInput.value = "";
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.log("[File Handler Outer Fail_tag]:", err);
      setDocErrorMessage(err.message || "Lỗi tải tệp tin và chuẩn hóa dữ liệu.");
      setIsParsingDoc(false);
      fileInput.value = "";
    }
  };

  // Finalize exam creation or update
  const handleSaveQuiz = () => {
    if (!newTitle.trim() || !newCode.trim()) {
      alert("Vui lòng điền tiêu đề và mã đề thi!");
      return;
    }

    if (draftQuestions.length === 0) {
      alert("Đề thi cần có ít nhất 1 câu hỏi ôn tập!");
      return;
    }

    const parsedDuration = newDuration.trim() ? parseInt(newDuration, 10) : undefined;
    if (parsedDuration !== undefined && (isNaN(parsedDuration) || parsedDuration <= 0)) {
      alert("Thời gian đếm ngược phải là số phút hợp lệ lớn hơn 0!");
      return;
    }

    if (editingQuizId) {
      const existing = quizzes.find(q => q.id === editingQuizId);
      const updatedQuiz: Quiz = {
        id: editingQuizId,
        code: newCode.trim().toUpperCase(),
        title: newTitle.trim(),
        subject: newSubject,
        grade: newGrade,
        description: newDescription.trim() || `Tài liệu ôn tập môn ${newSubject} lớp ${newGrade}.`,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        questions: draftQuestions,
        durationMinutes: parsedDuration,
        showAnswersAfterCompletion: showAnswersAfterCompletion
      };
      onUpdateQuiz(updatedQuiz);
      alert(`Đã cập nhật thành công đề kiểm tra: ${updatedQuiz.title}!`);
    } else {
      const newQuiz: Quiz = {
        id: "quiz_" + Date.now(),
        code: newCode.trim().toUpperCase(),
        title: newTitle.trim(),
        subject: newSubject,
        grade: newGrade,
        description: newDescription.trim() || `Tài liệu ôn tập môn ${newSubject} lớp ${newGrade}.`,
        createdAt: new Date().toISOString(),
        questions: draftQuestions,
        durationMinutes: parsedDuration,
        showAnswersAfterCompletion: showAnswersAfterCompletion
      };
      onAddQuiz(newQuiz);
      alert(`Đã lưu thành công đề kiểm tra: ${newQuiz.title} với mã đề là [${newQuiz.code}]!`);
    }

    resetCreateForm();
    setActiveTab("tests");
  };

  // Extract all unique subjects from the actual created quizzes & prepopulated items
  const activeQuizSubjects = Array.from(new Set([
    ...quizzes.map(q => q.subject),
    "Toán Học",
    "Tiếng Việt"
  ]));

  // Filter Submissions Logic
  const filteredSubmissions = submissions.filter(sub => {
    const sTerm = searchTerm.trim().toLowerCase();
    const matchSearch = sTerm === "" || 
      sub.studentName.toLowerCase().includes(sTerm) ||
      sub.studentClass.toLowerCase().includes(sTerm);

    const targetQuiz = quizzes.find(q => q.id === sub.quizId || q.code === sub.quizCode);
    const quizSub = targetQuiz ? targetQuiz.subject : "";
    const matchSubject = filterSubject === "ALL" || 
      quizSub === filterSubject || 
      (quizSub === "" && sub.quizTitle.toLowerCase().includes(filterSubject.toLowerCase()));

    const matchClass = filterClass === "ALL" || sub.studentClass === filterClass;
    const matchQuizCode = filterQuizCode === "ALL" || sub.quizCode === filterQuizCode;

    return matchSearch && matchSubject && matchClass && matchQuizCode;
  });

  // Unique Classes list for reports filter dropdowns
  const availableClasses = Array.from(new Set(submissions.map(s => s.studentClass)));
  const availableCodes = Array.from(new Set(submissions.map(s => s.quizCode)));

  // Analytical Calculation values
  const totalCompletedCount = submissions.length;
  const avgScore = totalCompletedCount > 0 
    ? (submissions.reduce((sum, s) => sum + s.score, 0) / totalCompletedCount).toFixed(1)
    : "0.0";
  const passCount = submissions.filter(s => s.score >= 5.0).length;
  const passRate = totalCompletedCount > 0 
    ? Math.round((passCount / totalCompletedCount) * 100)
    : 0;

  // Custom SVG Chart Stats Calculations
  // Score range distribution: 0-2 (Yếu), 3-4 (Kém), 5-6 (Trung Bình), 7-8 (Khá), 9-10 (Giỏi)
  const scoreBuckets = {
    yeu: submissions.filter(s => s.score < 3.5).length,
    tb: submissions.filter(s => s.score >= 3.5 && s.score < 6.5).length,
    kha: submissions.filter(s => s.score >= 6.5 && s.score < 8.5).length,
    gioi: submissions.filter(s => s.score >= 8.5).length,
  };
  const maxBucketValue = Math.max(scoreBuckets.yeu, scoreBuckets.tb, scoreBuckets.kha, scoreBuckets.gioi, 1);

  // Triggering text CSV download directly
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert("Không có dữ liệu để xuất file!");
      return;
    }

    const headers = ["Tên Học Sinh", "Lớp", "Mã Đề", "Tên Đề Thi", "Số Câu Đúng", "Tổng Câu", "Điểm", "Thời Gian Làm (giây)", "Ngày Nộp"];
    const rows = filteredSubmissions.map(sub => [
      `"${sub.studentName}"`,
      `"${sub.studentClass}"`,
      `"${sub.quizCode}"`,
      `"${sub.quizTitle}"`,
      sub.correctCount,
      sub.totalCount,
      sub.score,
      sub.durationSeconds,
      `"${new Date(sub.submittedAt).toLocaleDateString('vi-VN')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_Diem_On_Tap_LMS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple in-app sheet view print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="teacher-dashboard-view" className="space-y-8 select-none">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-indigo-100 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-150">
            GV
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Cổng Quản Trị Giáo Viên</h2>
            <p className="text-sm font-semibold text-slate-500">
              Đăng nhập bằng tài khoản: <code className="bg-[#F0F4FF] text-[#4F46E5] px-2 py-0.5 rounded-lg font-mono font-bold text-xs">{gmailEmail}</code>
            </p>
          </div>
        </div>

        {/* Tabs switcher styled according to the beautiful design guidelines */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-5 py-3 rounded-2xl font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer text-sm ${
              activeTab === "tests"
                ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-150"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-indigo-50 shadow-sm"
            }`}
          >
            <Layers className="h-4 w-4" /> ĐỀ KIỂM TRA ({quizzes.length})
          </button>
          
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-5 py-3 rounded-2xl font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer text-sm ${
              activeTab === "reports"
                ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-150"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-indigo-50 shadow-sm"
            }`}
          >
            <ListChecks className="h-4 w-4" /> BÁO CÁO KẾT QUẢ ({submissions.length})
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setActiveTab("create");
            }}
            className={`px-5 py-3 bg-[#FF6B35] hover:bg-[#E05A2A] text-white rounded-2xl font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer text-sm shadow-md shadow-orange-100`}
          >
            <Plus className="h-5 w-5 text-white" /> SOẠN ĐỀ MỚI
          </button>

          <button
            type="button"
            onClick={() => {
              setTempApiKey(apiKey);
              setValidationError("");
              setValidationSuccess("");
              setIsApiKeyModalOpen(true);
            }}
            className={`px-4 py-3 rounded-2xl font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer text-xs ${
              isApiKeyVerified
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 shadow-sm"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-250 shadow-sm animate-pulse"
            }`}
            title="Cấu hình Gemini API Key sử dụng lâu dài"
          >
            <Key className="h-3.5 w-3.5" />
            {isApiKeyVerified ? (
              <span className="flex items-center gap-1.5 font-black uppercase">
                Khóa Cá Nhân <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
              </span>
            ) : (
              "NHẬP API KEY (LÂU DÀI)"
            )}
          </button>

          <button
            onClick={onLogout}
            id="gv-logout-btn"
            className="px-4 py-3 bg-red-55 hover:bg-red-60 text-red-650 hover:bg-red-50 font-bold rounded-2xl transition border border-red-100 text-xs cursor-pointer"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>

      {/* Primary Panels tabs routing */}
      {activeTab === "tests" && (
        <div className="space-y-6 animate-fade-in" id="teacher-tests-tab">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-[#4F46E5] tracking-tight">Kế hoạch thi trắc nghiệm đã tạo</h3>
            <button
              onClick={() => {
                resetCreateForm();
                setActiveTab("create");
              }}
              className="px-4 h-11 bg-[#4F46E5] hover:bg-[#3B32C1] text-white font-extrabold rounded-2xl transition text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4.5 w-4.5" /> THÊM ĐỀ MỚI
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-indigo-100 rounded-[40px] space-y-3 shadow-sm">
              <BookOpen className="h-12 w-12 text-[#4F46E5] mx-auto opacity-70" />
              <p className="text-slate-800 font-extrabold text-xl">Chưa có đề thi trắc nghiệm nào được tạo!</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">Bắt đầu soạn đề thi mới hoặc sinh tự động bằng trí trí khôn nhân tạo Gemini để học sinh bắt đầu làm bài.</p>
              <button
                onClick={() => {
                  resetCreateForm();
                  setActiveTab("create");
                }}
                className="mt-3 px-6 py-3 bg-[#FF6B35] text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                + Bắt đầu soạn đề
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Teacher Quiz Filter Row - Elegant Light Theme matching the Teacher Console */}
              <div className="bg-indigo-50/30 p-5 border border-indigo-100 rounded-3xl space-y-3.5 shadow-sm">
                <div className="text-2xs font-extrabold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-indigo-500" /> BỘ LỌC TÌM KIẾM ĐỀ THI ĐÃ TẠO
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Search bar */}
                  <div className="sm:col-span-6 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={quizSearchQuery}
                      onChange={(e) => setQuizSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên đề thi, mã truy cập..."
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-indigo-100 hover:border-indigo-300 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-bold text-slate-800 placeholder-slate-400 transition shadow-xs"
                    />
                  </div>

                  {/* Subject Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={quizFilterSubject}
                      onChange={(e) => setQuizFilterSubject(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-indigo-100 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
                    >
                      <option value="ALL">Môn học (Tất cả)</option>
                      {teacherUniqueSubjects.map(subj => (
                        <option key={subj} value={subj}>Môn: {subj}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={quizFilterGrade}
                      onChange={(e) => setQuizFilterGrade(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-indigo-150 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
                    >
                      <option value="ALL">Lớp học (Tất cả)</option>
                      {teacherUniqueGrades.map(grade => (
                        <option key={grade} value={grade}>Lớp: {grade}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Pills */}
                {(quizSearchQuery || quizFilterSubject !== "ALL" || quizFilterGrade !== "ALL") && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-1">Đang lọc:</span>
                    
                    {quizSearchQuery && (
                      <span className="px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        Từ khóa: {quizSearchQuery}
                        <button onClick={() => setQuizSearchQuery("")} className="hover:text-red-500 font-black cursor-pointer text-slate-400">×</button>
                      </span>
                    )}

                    {quizFilterSubject !== "ALL" && (
                      <span className="px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        Môn: {quizFilterSubject}
                        <button onClick={() => setQuizFilterSubject("ALL")} className="hover:text-red-500 font-black cursor-pointer text-slate-400">×</button>
                      </span>
                    )}

                    {quizFilterGrade !== "ALL" && (
                      <span className="px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                        Lớp: {quizFilterGrade}
                        <button onClick={() => setQuizFilterGrade("ALL")} className="hover:text-red-500 font-black cursor-pointer text-slate-400">×</button>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setQuizSearchQuery("");
                        setQuizFilterSubject("ALL");
                        setQuizFilterGrade("ALL");
                      }}
                      className="text-[10px] text-orange-500 font-black hover:text-orange-600 cursor-pointer underline ml-auto uppercase tracking-wider"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>

              {/* Master Quizzes Grid */}
              {teacherFilteredQuizzes.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-indigo-100 rounded-[40px] space-y-2 shadow-sm">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">Không tìm thấy kế hoạch thi trắc nghiệm nào phù hợp!</p>
                  <p className="text-2xs text-slate-400 font-semibold">Thay đổi từ khóa tìm kiếm đề, môn học, hoặc lớp khác để tìm thấy kết quả.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teacherFilteredQuizzes.map((quiz) => {
                    const subCount = submissions.filter(s => s.quizId === quiz.id).length;
                    return (
                      <div
                        key={quiz.id}
                        id={`quiz-card-${quiz.id}`}
                        className="bg-white rounded-[40px] p-7 border border-indigo-50 shadow-sm hover:shadow-md transition-all space-y-4 group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-wider text-white bg-[#4F46E5] px-2.5 py-1 rounded-md uppercase">
                              MÔN: {quiz.subject} • LỚP {quiz.grade}
                            </span>
                            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug pt-2">
                              {quiz.title}
                            </h4>
                          </div>
                          
                          {/* Code Tag & Edit/Delete Actions */}
                          <div className="flex items-center gap-2">
                            <span className="bg-[#FF6B35] text-white text-xs font-black px-3 py-1.5 rounded-xl tracking-wider font-mono shadow-sm">
                              MÃ: {quiz.code}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingQuizId(quiz.id);
                                setNewTitle(quiz.title);
                                setNewSubject(quiz.subject);
                                setNewGrade(quiz.grade);
                                setNewDescription(quiz.description || "");
                                setNewCode(quiz.code);
                                setDraftQuestions(quiz.questions);
                                setNewDuration(quiz.durationMinutes !== undefined ? String(quiz.durationMinutes) : "");
                                setShowAnswersAfterCompletion(quiz.showAnswersAfterCompletion !== false);
                                setActiveTab("create");
                              }}
                              className="p-2.5 bg-indigo-50 hover:bg-[#4F46E5] hover:text-white text-[#4F46E5] border border-indigo-100 rounded-xl transition duration-150 cursor-pointer"
                              title="Chỉnh sửa đề thi"
                            >
                              <Pencil className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuizToDelete(quiz);
                              }}
                              className="p-2.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-100 rounded-xl transition duration-150 cursor-pointer"
                              title="Xóa đề thi này"
                            >
                              <Trash className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-500 text-sm font-semibold line-clamp-2 leading-relaxed">
                          {quiz.description}
                        </p>

                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs font-bold text-slate-400">
                          <div className="flex flex-col gap-1">
                            <span>Cơ số câu hỏi: {quiz.questions.length} câu</span>
                            <span className="text-[10px] text-indigo-600 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-md inline-block w-fit font-bold font-sans">
                              ⏳ {quiz.durationMinutes ? `${quiz.durationMinutes} phút` : "Không giới hạn thời gian"}
                            </span>
                          </div>
                          <span className="text-[#4F46E5] bg-[#F0F4FF] px-2.5 py-1 rounded-lg">{subCount} lượt học sinh đã làm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in" id="teacher-reports-tab">
          {/* Quick Statistics Panels card Row precisely formatted in Bento grid like the Design HTML */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bg-white p-6 rounded-[40px] shadow-sm border border-indigo-50 flex flex-col justify-center items-center text-center">
              <p className="text-[#4F46E5] font-black uppercase text-xs tracking-wider mb-2">Học sinh tham gia</p>
              <p className="text-6xl font-black text-[#4F46E5] tracking-tight">{totalCompletedCount}</p>
              <p className="text-xs text-slate-400 mt-2 font-bold">Lượt làm bài đã ghi nhận</p>
            </div>

            <div className="md:col-span-4 bg-[#7C3AED] p-6 rounded-[40px] shadow-lg text-white flex flex-col justify-center items-center text-center">
              <span className="opacity-80 font-black uppercase text-xs tracking-wider mb-2 text-indigo-100">Điểm số trung bình</span>
              <p className="text-7xl font-black tracking-tight">{avgScore}</p>
              <p className="mt-2 font-bold text-sm text-indigo-100 opacity-90">Từ tất cả đề ôn thi đã mở</p>
            </div>

            <div className="md:col-span-4 bg-white p-6 rounded-[40px] shadow-sm border border-indigo-50 flex flex-col justify-center items-center text-center">
              <p className="text-[#FF6B35] font-black uppercase text-xs tracking-wider mb-2">Tỷ lệ đạt (Điểm ≥ 5.0)</p>
              <p className="text-6xl font-black text-[#FF6B35] tracking-tight">{passRate}%</p>
              <p className="text-xs text-slate-400 mt-2 font-bold">{passCount} trên {totalCompletedCount} đạt chuẩn</p>
            </div>
          </div>

          {/* SVG Custom Charts Dashboard */}
          {submissions.length > 0 && (
            <div className="bg-white p-6 border border-slate-200/90 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
              <div>
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full inline-block" />
                  PHÂN PHỐI ĐIỂM SỐ (%)
                </h4>
                {/* SVG Bar Chart representing scores mapping */}
                <div className="w-full h-48 bg-slate-50/60 rounded-2xl p-4 flex items-end justify-between relative border border-slate-100">
                  {/* Grid Lines mockup */}
                  <div className="absolute inset-x-0 bottom-1/4 h-px border-t border-dashed border-slate-200 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-2/4 h-px border-t border-dashed border-slate-200 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-3/4 h-px border-t border-dashed border-slate-200 pointer-events-none" />
                  
                  {/* Yếu column < 3.5 */}
                  <div className="flex flex-col items-center flex-1 gap-2 z-10">
                    <span className="text-xs font-bold text-red-500">{scoreBuckets.yeu} HS</span>
                    <div 
                      style={{ height: `${(scoreBuckets.yeu / maxBucketValue) * 110 + 5}px` }} 
                      className="w-8 sm:w-12 bg-red-400 rounded-t-lg transition-all duration-500" 
                    />
                    <span className="text-2xs font-extrabold text-slate-400 uppercase">Dưới 3.5</span>
                  </div>

                  {/* Trung Bình column 3.5 -> 6.5 */}
                  <div className="flex flex-col items-center flex-1 gap-2 z-10">
                    <span className="text-xs font-bold text-amber-500">{scoreBuckets.tb} HS</span>
                    <div 
                      style={{ height: `${(scoreBuckets.tb / maxBucketValue) * 110 + 5}px` }} 
                      className="w-8 sm:w-12 bg-amber-400 rounded-t-lg transition-all duration-500" 
                    />
                    <span className="text-2xs font-extrabold text-slate-400 uppercase">Từ 3.5 - 6.5</span>
                  </div>

                  {/* Khá column 6.5 -> 8.5 */}
                  <div className="flex flex-col items-center flex-1 gap-2 z-10">
                    <span className="text-xs font-bold text-blue-500">{scoreBuckets.kha} HS</span>
                    <div 
                      style={{ height: `${(scoreBuckets.kha / maxBucketValue) * 110 + 5}px` }} 
                      className="w-8 sm:w-12 bg-blue-400 rounded-t-lg transition-all duration-500" 
                    />
                    <span className="text-2xs font-extrabold text-slate-400 uppercase">Từ 6.5 - 8.5</span>
                  </div>

                  {/* Giỏi column >= 8.5 */}
                  <div className="flex flex-col items-center flex-1 gap-2 z-10">
                    <span className="text-xs font-bold text-emerald-500">{scoreBuckets.gioi} HS</span>
                    <div 
                      style={{ height: `${(scoreBuckets.gioi / maxBucketValue) * 110 + 5}px` }} 
                      className="w-8 sm:w-12 bg-emerald-400 rounded-t-lg transition-all duration-500" 
                    />
                    <span className="text-2xs font-extrabold text-slate-400 uppercase">Trên 8.5</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Statistics list */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block" />
                  Tỷ lệ học lực lớp học (%)
                </h4>
                <div className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Đạt Loại Giỏi (≥ 8.5)</span>
                      <span>{totalCompletedCount > 0 ? Math.round((scoreBuckets.gioi / totalCompletedCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(scoreBuckets.gioi / (totalCompletedCount || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Đạt Loại Khá (6.5 - 8.5)</span>
                      <span>{totalCompletedCount > 0 ? Math.round((scoreBuckets.kha / totalCompletedCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(scoreBuckets.kha / (totalCompletedCount || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Đạt Loại Trung Bình (3.5 - 6.5)</span>
                      <span>{totalCompletedCount > 0 ? Math.round((scoreBuckets.tb / totalCompletedCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(scoreBuckets.tb / (totalCompletedCount || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Loại Yếu / Cần Ôn Tập (Dưới 3.5)</span>
                      <span>{totalCompletedCount > 0 ? Math.round((scoreBuckets.yeu / totalCompletedCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${(scoreBuckets.yeu / (totalCompletedCount || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter block container */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/50 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Filter className="h-5 w-5 text-indigo-500" />
              <span>CÔNG CỤ TÌM KIẾM & PHÂN LOẠI REPORT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Search text input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-800 font-semibold"
                  placeholder="Học sinh hoặc Lớp học..."
                />
              </div>

              {/* Subject Select */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả môn học</option>
                {activeQuizSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              {/* Class Select */}
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Mọi Lớp học (Tất cả)</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>

              {/* Test Code Select */}
              <select
                value={filterQuizCode}
                onChange={(e) => setFilterQuizCode(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Mọi Mã Đề thi</option>
                {availableCodes.map(code => (
                  <option key={code} value={code}>Đề [{code}]</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-500">
                Lọc ra được: {filteredSubmissions.length} kết quả phù hợp
              </span>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSubject("ALL");
                    setFilterClass("ALL");
                    setFilterQuizCode("ALL");
                  }}
                  className="px-3.5 h-9 bg-slate-200 hover:bg-slate-300 transition rounded-xl text-xs text-slate-700 font-bold"
                >
                  XÓA BỘ LỌC
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 h-9 bg-indigo-600 hover:bg-indigo-700 transition font-bold text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> XUẤT CSV (EXCEL)
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 h-9 bg-slate-800 hover:bg-slate-900 transition font-bold text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> IN DIỂM SỐ
                </button>
              </div>
            </div>
          </div>

          {/* Results Table Grid */}
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 rounded-3xl border border-slate-100 text-slate-400 text-sm font-semibold">
              Không tìm thấy kết quả làm bài nào phù hợp với điều kiện tìm kiếm.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="printable-score-table">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-widest font-extrabold text-[10px]">
                    <th className="px-6 py-4">TÊN HỌC SINH</th>
                    <th className="px-6 py-4">LỚP MẠNG</th>
                    <th className="px-6 py-4">MÃ ĐỀ THI</th>
                    <th className="px-6 py-4 text-center">SỐ CÂU ĐÚNG</th>
                    <th className="px-6 py-4 text-center">ĐIỂM SỐ (10)</th>
                    <th className="px-6 py-4 text-center">THỜI GIAN LÀM BÀI</th>
                    <th className="px-6 py-4 text-right">NGÀY THI/NỘP BÀI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredSubmissions.map((sub) => {
                    const submissionDate = new Date(sub.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    // Format seconds to text
                    const formattedMin = Math.floor(sub.durationSeconds / 60);
                    const formattedSec = sub.durationSeconds % 60;
                    const timeRep = `${formattedMin}p ${formattedSec}g`;

                    return (
                      <tr key={sub.id} className="hover:bg-indigo-50/20 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400 shrink-0" />
                          {sub.studentName}
                        </td>
                        <td className="px-6 py-4">{sub.studentClass}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-xs">
                            {sub.quizCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">{sub.correctCount} / {sub.totalCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-base ${sub.score >= 8.5 ? 'text-emerald-600' : sub.score >= 5.0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {sub.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono">{timeRep}</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs font-normal">{submissionDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="space-y-8 animate-fade-in" id="teacher-create-tab">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (draftQuestions.length > 0) {
                  setShowDiscardConfirm(true);
                } else {
                  setActiveTab("tests");
                }
              }}
              className="group p-3 bg-slate-700/90 hover:bg-[#4F46E5] active:bg-[#3B32C1] text-white rounded-2xl transition-all duration-150 border border-slate-600/80 hover:border-transparent shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center cursor-pointer transform hover:-translate-x-0.5 active:translate-x-0"
              title="Quay lại danh sách đề thi"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight font-display">
                {editingQuizId ? "Chỉnh sửa đề thi trắc nghiệm" : "Soạn đề thi bài kiểm tra trắc nghiệm"}
              </h3>
              <p className="text-xs text-slate-300 font-bold mt-1 tracking-wide">
                {editingQuizId ? "Cập nhật thông tin đề thi và danh sách câu hỏi" : "Điền thông tin và chèn câu hỏi thủ công hoặc sử dụng AI Gemini trợ giúp soạn nhanh"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Col - Core Exam Info */}
            <div className="bg-white p-7 border border-indigo-50 rounded-[40px] space-y-6 shadow-sm">
              <h4 className="text-xs font-black text-[#4F46E5] uppercase tracking-wider border-b border-indigo-50 pb-2.5">THÔNG TIN CHUNG ĐỀ THI</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">TIÊU ĐỀ ĐỀ THI</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-2xl outline-none font-bold transition text-black placeholder-slate-400 text-sm"
                    placeholder="Ví dụ: Ôn Tập Cuối Học Kỳ 2 Môn Hóa Học"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">MÔN HỌC</label>
                    <select
                      value={newSubject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSubject(val);
                        setAiSubject(val);
                      }}
                      className="w-full px-4.5 py-4 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-2xl outline-none font-extrabold transition text-slate-700 text-sm cursor-pointer"
                    >
                      {getSubjectsForGrade(newGrade).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">KHỐI LỚP</label>
                    <select
                      value={newGrade}
                      onChange={(e) => {
                        const grade = e.target.value;
                        setNewGrade(grade);
                        setAiGrade(grade);
                        const available = getSubjectsForGrade(grade);
                        if (!available.includes(newSubject)) {
                          setNewSubject(available[0]);
                          setAiSubject(available[0]);
                        }
                      }}
                      className="w-full px-4.5 py-4 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-2xl outline-none font-extrabold transition text-slate-700 text-sm cursor-pointer"
                    >
                      <option value="1">Lớp 1 (Tiểu học)</option>
                      <option value="2">Lớp 2 (Tiểu học)</option>
                      <option value="3">Lớp 3 (Tiểu học)</option>
                      <option value="4">Lớp 4 (Tiểu học)</option>
                      <option value="5">Lớp 5 (Tiểu học)</option>
                      <option value="6">Lớp 6 (THCS)</option>
                      <option value="7">Lớp 7 (THCS)</option>
                      <option value="8">Lớp 8 (THCS)</option>
                      <option value="9">Lớp 9 (THCS)</option>
                      <option value="10">Lớp 10 (THPT)</option>
                      <option value="11">Lớp 11 (THPT)</option>
                      <option value="12">Lớp 12 (THPT)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-2xs font-black text-slate-500 uppercase tracking-wider">MÃ ĐỀ TRUY CẬP</label>
                      <button
                        type="button"
                        onClick={() => setNewCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                        className="text-[10px] text-[#4F46E5] font-black hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Sinh mới
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-[#F0F4FF] focus:bg-white border-2 border-indigo-100 focus:border-[#4F46E5] rounded-2xl outline-none font-black transition text-[#4F46E5] font-mono tracking-widest text-center text-sm"
                      placeholder="MÃ ĐỀ"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-black text-slate-500 uppercase tracking-wider mb-2">HẠN GIỜ ĐẾM NGƯỢC</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-2xl outline-none font-black transition text-slate-800 text-center text-sm"
                        placeholder="Không giới hạn"
                      />
                      {newDuration && (
                        <button
                          type="button"
                          onClick={() => setNewDuration("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded"
                        >
                          Tắt
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1 justify-center">
                      {["15", "30", "45", "60"].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setNewDuration(m)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                            newDuration === m 
                              ? "bg-[#4F46E5] border-[#4F46E5] text-white" 
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {m}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Show/Hide Answer keys toggle after completion */}
                <div className="bg-[#F0F4FF]/30 p-5 border border-indigo-50/50 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full inline-block" />
                      🔑 Cấu hình hiển thị đáp án sau làm bài
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      Quyết định học sinh có được xem đáp án & giải thích lời giải chi tiết ngay khi nhấn hoàn thành hay không.
                    </p>
                  </div>
                  <div className="flex bg-[#F0F4FF]/70 p-1 rounded-xl self-start md:self-auto gap-1">
                    <button
                      type="button"
                      onClick={() => setShowAnswersAfterCompletion(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        showAnswersAfterCompletion
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      BẬT (Hiện đáp án)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAnswersAfterCompletion(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        !showAnswersAfterCompletion
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      TẮT (Ẩn đáp án)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">MÔ TẢ CHI TIẾT</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                    className="w-full px-5 py-3 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-2xl outline-none font-bold transition text-black placeholder-slate-400 text-sm"
                    placeholder="Mô tả tóm tắt nội dung ôn tập..."
                  />
                </div>
              </div>

              {/* Draft Questions List */}
              <div className="space-y-4 pt-5 border-t border-indigo-50">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-[#4F46E5] rounded-full inline-block" />
                    CÁC CÂU HỎI TRONG ĐỀ ({draftQuestions.length})
                  </h5>
                </div>

                {draftQuestions.length === 0 ? (
                  <div className="text-center py-8 bg-[#F0F4FF]/30 border border-indigo-50 rounded-2xl flex flex-col justify-center text-slate-400 font-bold">
                    <span className="text-sm text-slate-600">Chưa có câu hỏi nào trong danh sách.</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Sử dụng form soạn thủ công bên tay phải hoặc Trí Tuệ Nhân Tạo để soạn câu hỏi!</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {draftQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setEditingQuestionIdx(idx);
                          setQText(q.questionText);
                          setQOptions(q.options || ["", "", "", ""]);
                          setQOptionImages(q.optionImages || q.options.map(() => "") || ["", "", "", ""]);
                          setQCorrectIdx(q.correctIndex);
                          setQExplanation(q.explanation || "");
                          setQImage(q.image || "");
                        }}
                        className={`p-4 rounded-2xl flex items-start justify-between border transition cursor-pointer text-left ${
                          editingQuestionIdx === idx
                            ? "bg-indigo-50 border-[#4F46E5] ring-2 ring-indigo-100"
                            : "bg-[#F0F4FF]/40 hover:bg-[#F0F4FF]/80 border-indigo-50"
                        }`}
                      >
                        <div className="space-y-1 pr-2 flex-grow">
                          <div className="flex items-center gap-1.5">
                            <p className="text-2xs font-extrabold text-[#4F46E5] uppercase tracking-wide font-sans">Câu hỏi {idx + 1}:</p>
                            {editingQuestionIdx === idx && (
                              <span className="bg-emerald-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase font-sans">Đang sửa</span>
                            )}
                          </div>
                          <p className="text-slate-800 font-extrabold text-xs leading-relaxed line-clamp-2">{q.questionText}</p>
                          <p className="text-[10px] font-black text-emerald-600 font-sans">Đáp án chính xác: {String.fromCharCode(65 + q.correctIndex)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestionIdx(idx);
                              setQText(q.questionText);
                              setQOptions(q.options || ["", "", "", ""]);
                              setQOptionImages(q.optionImages || q.options.map(() => "") || ["", "", "", ""]);
                              setQCorrectIdx(q.correctIndex);
                              setQExplanation(q.explanation || "");
                              setQImage(q.image || "");
                            }}
                            className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition cursor-pointer flex items-center justify-center"
                            title="Chỉnh sửa câu hỏi này"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveDraftQuestion(idx);
                              if (editingQuestionIdx === idx) {
                                setEditingQuestionIdx(null);
                                setQText("");
                                setQOptions(["", "", "", ""]);
                                setQOptionImages(["", "", "", ""]);
                                setQCorrectIdx(0);
                                setQExplanation("");
                                setQImage("");
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 hover:text-red-650 rounded-lg text-red-500 transition cursor-pointer flex items-center justify-center"
                            title="Xóa câu hỏi này"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Save button */}
                <button
                  type="button"
                  onClick={handleSaveQuiz}
                  className="w-full py-4 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] text-white font-black rounded-2xl shadow-lg shadow-orange-100 transition cursor-pointer flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                >
                  <Check className="h-5 w-5" /> {editingQuizId ? "HOÀN THÀNH & CẬP NHẬT ĐỀ THI" : "HOÀN THÀNH & LƯU ĐỀ KIỂM TRA MỚI"}
                </button>
              </div>
            </div>

            {/* Right Col - Question Creators (Manual or AI-based) */}
            <div className="space-y-6">
              {/* Part A: Smart AI writing assistant using server proxy */}
              <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-7 rounded-[40px] text-white space-y-5 shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-2xl">
                    <Sparkles className="h-6 w-6 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight font-display">TỰ ĐỘNG SOẠN ĐỀ BẰNG GEMINI AI</h4>
                    <p className="text-2xs text-indigo-100 font-extrabold uppercase tracking-wider">Tạo câu hỏi trắc nghiệm tự động theo mẫu chuẩn của Bộ</p>
                  </div>
                </div>

                {aiErrorMessage && (
                  <div className="p-3.5 bg-red-900/40 border border-red-500/30 text-red-200 text-xs rounded-xl font-medium">
                    {aiErrorMessage}
                  </div>
                )}

                {aiSuccessMessage && (
                  <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl font-medium">
                    {aiSuccessMessage}
                  </div>
                )}

                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-indigo-100 font-black tracking-wide pb-1.5">MÔN HỌC AI</label>
                      <select
                        value={aiSubject}
                        onChange={(e) => setAiSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl outline-none transition text-white font-extrabold cursor-pointer"
                      >
                        {getSubjectsForGrade(newGrade).map((sub) => (
                          <option key={sub} className="text-slate-800 font-bold" value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-indigo-100 font-black tracking-wide pb-1.5">SỐ LƯỢNG CÂU HỎI</label>
                      <select
                        value={aiQuantity}
                        onChange={(e) => setAiQuantity(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl outline-none transition text-white font-extrabold cursor-pointer"
                      >
                        <option className="text-slate-800 font-bold" value={3}>Soạn 3 câu hỏi</option>
                        <option className="text-slate-800 font-bold" value={5}>Soạn 5 câu hỏi</option>
                        <option className="text-slate-800 font-bold" value={10}>Soạn 10 câu hỏi</option>
                      </select>
                    </div>
                  </div>

                  {/* Status of API key for generator */}
                  <div className="bg-[#120B2A]/70 px-4 py-3 rounded-2xl border border-indigo-500/25 flex items-center justify-between text-xs font-sans">
                    <span className="text-indigo-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-indigo-300" /> KHÓA API Gemini:
                    </span>
                    {isApiKeyVerified ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <Check className="h-3 w-3" /> ĐÃ XÁC THỰC (LÂU DÀI)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTempApiKey(apiKey);
                          setValidationError("");
                          setValidationSuccess("");
                          setIsApiKeyModalOpen(true);
                        }}
                        className="text-[#FF6B35] font-black hover:underline cursor-pointer uppercase text-xs animate-bounce"
                      >
                        Khóa dự phòng: Thêm khóa cá nhân của bạn ⚡
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-indigo-100 font-black tracking-wide pb-1.5">CHỦ ĐỀ ĐỀ KIỂM TRA (GIẢI THÍCH CHI TIẾT ĐỂ AI SOẠN CHUẨN)</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white/10 focus:bg-white/20 border border-white/15 focus:border-white/40 rounded-2xl outline-none transition text-white placeholder-indigo-200 font-extrabold"
                      placeholder="Ví dụ: Ròng rọc động lý học lớp 8, hoặc hệ thống so sánh hơn tiếng anh..."
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateQuestionsFromAI}
                    className="w-full py-4 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] disabled:bg-indigo-900/40 disabled:text-indigo-200 text-white font-black rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    {isGeneratingAI ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                         Gemini AI đang biên soạn nội dung...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-amber-300" />
                        Kích Hoạt Sinh Câu Hỏi Bằng AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Part A.2: Import exam from PDF/Word Document */}
              <div className="bg-gradient-to-br from-[#16122C] via-[#1E193C] to-[#0E0B1F] p-7 border-2 border-dashed border-purple-500/30 rounded-[40px] space-y-5 shadow-xl shadow-purple-950/35">
                {/* Status of API key for parser */}
                <div className="bg-[#0D0A1C]/95 px-4 py-3 rounded-2xl border border-purple-500/20 flex items-center justify-between text-xs font-sans">
                  <span className="text-purple-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400" /> PHỤC VỤ BỞI GEMINI:
                  </span>
                  {isApiKeyVerified ? (
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                      <Check className="h-3 w-3" /> ĐÃ XÁC THỰC
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempApiKey(apiKey);
                        setValidationError("");
                        setValidationSuccess("");
                        setIsApiKeyModalOpen(true);
                      }}
                      className="text-[#FF6B35] font-black hover:underline cursor-pointer uppercase text-xs"
                    >
                      NHẬP API KEY ĐỂ SOẠN LÂU DÀI ⚡
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-950/70 border border-purple-800/50 rounded-2xl text-purple-400 shadow-sm">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight text-white font-display">NHẬP ĐỀ THI TỪ FILE (WORD / PDF)</h4>
                      <p className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider">Bóc tách & Nhận dạng bằng trí khôn Gemini AI</p>
                    </div>
                  </div>

                  {/* Sample File Guides download triggers */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#3B32C1] rounded-xl text-white text-[10px] font-black tracking-wide uppercase shadow-sm cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                      title="Tải tệp tin thiết kế đề chuẩn"
                    >
                      <Download className="h-3 w-3" /> TẢI ĐỀ MẪU .TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSamplePreview(!showSamplePreview)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-[10px] font-black tracking-wide uppercase border border-slate-700/80 cursor-pointer transition"
                    >
                      {showSamplePreview ? "ĐÓNG XEM" : "XEM ĐỊNH DẠNG"}
                    </button>
                  </div>
                </div>

                {/* Inline interactive formatting preview instructions if toggled */}
                {showSamplePreview && (
                  <div className="p-5 bg-slate-950/80 border border-purple-900/40 rounded-2xl space-y-3 animate-fade-in font-mono text-[11px] leading-relaxed text-purple-200">
                    <p className="text-white font-black uppercase text-2xs tracking-widest border-b border-purple-950 pb-1.5 text-purple-300">
                      Cấu Trúc Đề Lý Tưởng Để AI Nhận Diện Câu Hỏi:
                    </p>
                    <div className="bg-slate-900 px-3 py-2 rounded-lg border border-purple-950 text-slate-300 whitespace-pre-line tracking-tight leading-snug">
                      {`Câu 1: Nội dung câu hỏi thứ nhất ví dụ nguyên tử là gì?
A. Định nghĩa phương án A
B. Định nghĩa phương án B
C. Định nghĩa phương án C
D. Định nghĩa phương án D
Đáp án đúng: A

Câu 2: Nội dung câu thứ hai...`}
                    </div>
                    <p className="text-[10px] text-purple-400 font-bold leading-normal">
                      * Mẹo: Tài liệu WORD hay PDF cần chứa văn bản thô rõ chữ (chữ viết thật, không phải ảnh scan mờ) để mô hình bóc tách hiệu quả nhất.
                    </p>
                  </div>
                )}

                {docErrorMessage && (
                  <div className="p-3.5 bg-red-950/40 border border-red-500/25 text-red-200 text-xs rounded-xl font-bold flex items-start gap-2 animate-shake">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{docErrorMessage}</span>
                  </div>
                )}

                {docSuccessMessage && (
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/25 text-emerald-200 text-xs rounded-xl font-bold flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{docSuccessMessage}</span>
                  </div>
                )}

                <div className="relative">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-800 hover:border-purple-500 bg-[#0F0C1D] hover:bg-purple-950/20 rounded-2xl p-6 cursor-pointer transition text-center group shadow-inner">
                    <Upload className="h-8 w-8 text-purple-500 group-hover:text-purple-400 mb-2 transition-transform group-hover:-translate-y-0.5" />
                    <span className="text-xs font-black text-purple-200">Kéo thả file đề thi vào đây hoặc <span className="text-purple-400 underline group-hover:text-purple-300">Nhấn để chọn</span></span>
                    <span className="text-[10px] text-purple-500 font-bold mt-1">Hỗ trợ định dạng .pdf, .docx, .doc, .txt tài liệu chữ</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileChange}
                      disabled={isParsingDoc}
                      className="hidden"
                    />
                  </label>
                </div>

                {isParsingDoc && (
                  <div className="flex items-center justify-center gap-2.5 py-2.5 bg-purple-950/50 border border-purple-900/60 rounded-xl text-xs font-black text-purple-300 animate-pulse">
                    <span className="h-4 w-4 border-2 border-purple-500 border-t-purple-300 rounded-full animate-spin"></span>
                    <span>Gemini AI đang bóc tách nội dung thô và phân loại trắc nghiệm...</span>
                  </div>
                )}
              </div>

              {/* Part B: Manual question form editor */}
              <div className="bg-white p-7 border border-indigo-50 rounded-[40px] space-y-5 shadow-sm">
                <h4 className="text-xs font-black text-[#4F46E5] uppercase tracking-wider border-b border-indigo-50 pb-2.5">
                  {editingQuestionIdx !== null ? `CHỈNH SỬA CÂU HỎI THỨ ${editingQuestionIdx + 1}` : "CHÈN CÂU HỎI THỦ CÔNG"}
                </h4>
                
                <form onSubmit={handleAddQuestionToDraft} className="space-y-4">
                  {/* Question Text */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nội dung câu hỏi</label>
                    <textarea
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      rows={2.5}
                      className="w-full px-4 py-3.5 bg-[#F0F4FF]/50 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-bold text-black placeholder-slate-400"
                      placeholder="Nhập nội dung chính của câu hỏi..."
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-indigo-50">
                      <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider">
                        Các phương án trả lời ({qOptions.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-2xs font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer uppercase font-sans"
                      >
                        <Plus className="h-3 w-3" /> THÊM ĐÁP ÁN
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      {qOptions.map((optionText, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D, E, F etc.
                        return (
                          <div key={optIdx} className="space-y-1.5 p-3 px-3.5 bg-[#F0F4FF]/25 hover:bg-[#F0F4FF]/40 border border-indigo-100/40 rounded-2xl relative group">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-[#4F46E5] uppercase bg-[#F0F4FF] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                {optLetter}
                              </span>
                              
                              {/* Delete option button */}
                              {qOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionField(optIdx)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                  title={`Xóa phương án ${optLetter}`}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            
                            <input
                              type="text"
                              value={optionText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQOptions(prev => prev.map((item, i) => i === optIdx ? val : item));
                              }}
                              className="w-full px-3 py-2 bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-xl outline-none text-black font-semibold placeholder-slate-400"
                              placeholder={`Nhập phương án ${optLetter}...`}
                              required
                            />
                            
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <label className="p-1 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 transition">
                                <Upload className="h-3 w-3" />
                                <span>Ảnh {optLetter}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        if (typeof reader.result === "string") {
                                          const base64 = reader.result;
                                          setQOptionImages(prev => {
                                            const copy = [...prev];
                                            while (copy.length <= optIdx) copy.push("");
                                            copy[optIdx] = base64;
                                            return copy;
                                          });
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {qOptionImages[optIdx] && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-emerald-600 font-bold">✓ Có ảnh</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQOptionImages(prev => prev.map((img, i) => i === optIdx ? "" : img));
                                    }}
                                    className="text-red-500 hover:text-red-650 text-[9px] font-bold underline cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                            {qOptionImages[optIdx] && (
                              <div className="mt-1 relative max-w-20 bg-slate-50 border border-slate-200 rounded p-0.5 overflow-hidden">
                                <img src={qOptionImages[optIdx]} alt={`Preview ${optLetter}`} className="max-h-12 object-contain rounded" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Correct Index Choice & Image attachment URL */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 font-bold">Đáp án đúng</label>
                      <select
                        value={qCorrectIdx}
                        onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                        className="w-full px-3.5 py-3 bg-[#F0F4FF]/30 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-bold text-black font-sans"
                      >
                        {qOptions.map((_, idx) => (
                          <option key={idx} value={idx} className="text-black font-semibold">
                            Đáp án {String.fromCharCode(65 + idx)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Ảnh câu hỏi (URL hoặc Tải lên)</label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={qImage.startsWith("data:") ? "[Ảnh đã tải từ máy tính]" : qImage}
                          onChange={(e) => {
                            if (!e.target.value.startsWith("[Ảnh")) {
                              setQImage(e.target.value);
                            }
                          }}
                          disabled={qImage.startsWith("data:")}
                          className="w-full px-3.5 py-2.5 bg-[#F0F4FF]/30 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-xl outline-none text-xs text-black font-semibold placeholder-slate-400"
                          placeholder="Dán mã URL ảnh hoặc tải từ máy tính..."
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-[#4F46E5] rounded-xl text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 transition">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Tải ảnh từ máy tính</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === "string") {
                                      setQImage(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {qImage && (
                            <button
                              type="button"
                              onClick={() => setQImage("")}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-bold border border-red-100 transition"
                            >
                              Xóa ảnh
                            </button>
                          )}
                        </div>
                        {qImage && (
                          <div className="mt-1 relative max-w-28 bg-slate-50 border border-slate-200 rounded p-1 overflow-hidden">
                            <img
                              src={qImage}
                              alt="Xem trước ảnh câu hỏi"
                              className="max-h-16 object-contain rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanation for answers */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Lời giải thích chi tiết</label>
                    <textarea
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      rows={2.5}
                      className="w-full px-4 py-3 bg-[#F0F4FF]/30 hover:bg-white focus:bg-white border-2 border-indigo-50 focus:border-[#4F46E5] rounded-xl outline-none text-xs font-semibold text-black placeholder-slate-400"
                      placeholder="Ví dụ: Theo định luật bảo toàn khối lượng..."
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingQuestionIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionIdx(null);
                          setQText("");
                          setQOptions(["", "", "", ""]);
                          setQOptionImages(["", "", "", ""]);
                          setQCorrectIdx(0);
                          setQExplanation("");
                          setQImage("");
                        }}
                        className="w-1/3 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[#555] hover:text-black text-xs sm:text-sm rounded-2xl cursor-pointer transition uppercase tracking-wide font-sans border border-slate-200"
                      >
                        HỦY BỎ
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`font-black text-sm md:text-base py-5 rounded-2xl cursor-pointer flex items-center justify-center gap-2.5 shadow-lg uppercase tracking-wider transition-all duration-150 active:scale-98 ${
                        editingQuestionIdx !== null
                          ? "w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                          : "w-full bg-[#4F46E5] hover:bg-[#3B32C1] text-white shadow-indigo-100"
                      }`}
                    >
                      {editingQuestionIdx !== null ? (
                        <>
                          <Check className="h-5 w-5" /> LƯU CẬP NHẬT CÂU HỎI
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" /> Thêm câu này vào Đề tuyển chọn
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modals for iframe/sandbox safety */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in animate-duration-150" id="delete-quiz-modal">
          <div className="bg-white rounded-[32px] border border-red-100 max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up">
            <div className="h-14 w-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Xác nhận xóa đề thi</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Bạn chắc chắn muốn xóa hẳn đề thi <span className="font-extrabold text-slate-800">"{quizToDelete.title}"</span>? Thao tác này không thể hoàn tác, kết quả bài thi của học sinh liên quan cũng sẽ bị loại bỏ.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-755 font-extrabold text-xs rounded-xl cursor-pointer transition uppercase"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteQuiz(quizToDelete.id);
                  setQuizToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition uppercase shadow-md shadow-red-200"
              >
                XÁC NHẬN XÓA
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in animate-duration-150" id="discard-draft-modal">
          <div className="bg-white rounded-[32px] border border-amber-100 max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up">
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Hủy bỏ câu hỏi nháp?</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Đề thi hiện đang có các câu hỏi đang được soạn thảo dở dang. Nếu quay lại, toàn bộ các câu hỏi nháp này sẽ bị hủy bỏ hoàn toàn.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-755 font-extrabold text-xs rounded-xl cursor-pointer transition uppercase"
              >
                TIẾP TỤC SOẠN
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftQuestions([]);
                  setActiveTab("tests");
                  setShowDiscardConfirm(false);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition uppercase shadow-md shadow-amber-200"
              >
                BỎ QUA & RỜI ĐI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic API Key Configuration Modal with Real-time Verification */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in" id="api-key-config-modal">
          <div className="bg-white rounded-[32px] border border-indigo-50 max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up">
            <div className="h-14 w-14 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto">
              <Key className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">🔑 Cấu hình Gemini API Key</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Sử dụng khóa API riêng của bạn để đảm bảo trải nghiệm sinh câu hỏi và bóc tách tài liệu bằng AI ổn định, lâu dài. Khóa sẽ được kiểm tra thực tế và lưu tại thiết bị của bạn.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wider pb-1.5">NHẬP GEMINI API KEY CHÍNH CHỦ:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-mono text-sm placeholder-slate-400 border border-slate-200 focus:border-[#4F46E5] outline-none rounded-xl transition"
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>

              {validationError && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl flex gap-2.5 text-xs font-semibold leading-relaxed">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-50" />
                  <span>{validationError}</span>
                </div>
              )}

              {validationSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex gap-2.5 text-xs font-semibold leading-relaxed">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{validationSuccess}</span>
                </div>
              )}

              {isApiKeyVerified && apiKey && !validationSuccess && !validationError && (
                <div className="p-4 bg-slate-50 text-slate-600 border border-slate-150 rounded-2xl flex gap-2 text-xs font-medium">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Hiện đang cấu hình sử dụng khóa API kết thúc bằng: <strong className="font-mono text-[#4F46E5]">...{apiKey.slice(-6)}</strong>. Khóa đã được xác minh thành công.</span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-xs rounded-xl cursor-pointer transition uppercase"
                >
                  XÓA KHÓA HIỆN TẠI
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition uppercase"
              >
                ĐÓNG LẠI
              </button>
              <button
                type="button"
                disabled={isValidatingKey || !tempApiKey.trim()}
                onClick={() => handleValidateAndSaveApiKey(tempApiKey)}
                className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#3B32C1] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl cursor-pointer transition uppercase shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isValidatingKey ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ĐANG KIỂM TRA...
                  </>
                ) : (
                  "KIỂM TRA & LƯU LẠI"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
