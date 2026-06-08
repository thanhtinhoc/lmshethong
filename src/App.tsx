import React, { useState, useEffect } from "react";
import { Quiz, StudentSubmission } from "./types";
import { SAMPLE_QUIZZES, SAMPLE_SUBMISSIONS } from "./sampleData";
import { School, User, Lock, ArrowRight, ShieldCheck, PlayCircle, Sparkles, HelpCircle, BookOpen, Layers, Info, ChevronRight, Search, Filter, Trash2 } from "lucide-react";
import StudentExamTaking from "./components/StudentExamTaking";
import TeacherDashboard from "./components/TeacherDashboard";
import AuthModal from "./components/AuthModal";
import { db, auth, OperationType, handleFirestoreError, cleanUndefined } from "./firebase";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

export default function App() {
  // Load initial states from localStorage if available, else use custom datasets
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem("lms_quizzes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.log("[LMS State Quiz Parsing Error]", e); }
    }
    return SAMPLE_QUIZZES;
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const saved = localStorage.getItem("lms_submissions");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.log("[LMS State Submissions Parsing Error]", e); }
    }
    return SAMPLE_SUBMISSIONS;
  });

  const [userRole, setUserRole] = useState<"LANDING" | "STUDENT" | "TEACHER">("LANDING");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  
  // Student registration values
  const [examCodeInput, setExamCodeInput] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentValidationError, setStudentValidationError] = useState("");

  // Filtering for Quizzes on Landing screen
  const [filterQuery, setFilterQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");

  // Auth modal management for Teacher gateway
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authenticatedTeacherEmail, setAuthenticatedTeacherEmail] = useState("");

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("lms_quizzes", JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem("lms_submissions", JSON.stringify(submissions));
  }, [submissions]);

  // Sync state with Firebase Authentication dynamically
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setAuthenticatedTeacherEmail(user.email);
        setUserRole("TEACHER");
      } else {
        setAuthenticatedTeacherEmail("");
        setUserRole((prev) => (prev === "TEACHER" ? "LANDING" : prev));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load database collection from Firebase Firestore on Mount
  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        // Fetch Quizzes from Firebase
        let quizSnapshot;
        try {
          quizSnapshot = await getDocs(collection(db, "quizzes"));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "quizzes");
          return;
        }
        let fetchedQuizzes: Quiz[] = [];
        quizSnapshot.forEach((doc) => {
          fetchedQuizzes.push(doc.data() as Quiz);
        });

        if (fetchedQuizzes.length > 0) {
          fetchedQuizzes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setQuizzes(fetchedQuizzes);
        } else {
          // If Firestore is empty, seed it with initial default quizzes
          for (const q of SAMPLE_QUIZZES) {
            try {
              await setDoc(doc(db, "quizzes", q.id), cleanUndefined(q));
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `quizzes/${q.id}`);
            }
          }
          setQuizzes(SAMPLE_QUIZZES);
        }

        // Fetch Submissions from Firebase
        let subSnapshot;
        try {
          subSnapshot = await getDocs(collection(db, "submissions"));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "submissions");
          return;
        }
        let fetchedSubmissions: StudentSubmission[] = [];
        subSnapshot.forEach((doc) => {
          fetchedSubmissions.push(doc.data() as StudentSubmission);
        });

        if (fetchedSubmissions.length > 0) {
          fetchedSubmissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
          setSubmissions(fetchedSubmissions);
        } else {
          // Seed submissions if empty
          for (const s of SAMPLE_SUBMISSIONS) {
            try {
              await setDoc(doc(db, "submissions", s.id), cleanUndefined(s));
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `submissions/${s.id}`);
            }
          }
          setSubmissions(SAMPLE_SUBMISSIONS);
        }
      } catch (err) {
        console.error("Lỗi khi kết nối hoặc đồng bộ Firebase Firestore:", err);
      }
    };

    fetchFirestoreData();
  }, []);

  // Handle addition of newly created quizzes
  const handleAddQuiz = async (newQuiz: Quiz) => {
    setQuizzes(prev => [newQuiz, ...prev]);
    try {
      await setDoc(doc(db, "quizzes", newQuiz.id), cleanUndefined(newQuiz));
    } catch (err) {
      console.error("Lỗi khi thêm quiz lên Firebase:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `quizzes/${newQuiz.id}`);
      } catch (e) {
        // Handled & logged in the helper
      }
    }
  };

  // Handle quiz update
  const handleUpdateQuiz = async (updatedQuiz: Quiz) => {
    setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
    try {
      await setDoc(doc(db, "quizzes", updatedQuiz.id), cleanUndefined(updatedQuiz));
    } catch (err) {
      console.error("Lỗi khi cập nhật quiz lên Firebase:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `quizzes/${updatedQuiz.id}`);
      } catch (e) {
        // Handled & logged in the helper
      }
    }
  };

  // Handle quiz deletion
  const handleDeleteQuiz = async (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    setSubmissions(prev => prev.filter(s => s.quizId !== quizId));
    try {
      try {
        await deleteDoc(doc(db, "quizzes", quizId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `quizzes/${quizId}`);
      }
      
      // Clean corresponding student submissions as well
      let subSnapshot;
      try {
        subSnapshot = await getDocs(collection(db, "submissions"));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, "submissions");
        return;
      }
      subSnapshot.forEach(async (subDoc) => {
        const subData = subDoc.data() as StudentSubmission;
        if (subData.quizId === quizId) {
          try {
            await deleteDoc(doc(db, "submissions", subDoc.id));
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, `submissions/${subDoc.id}`);
          }
        }
      });
    } catch (err) {
      console.error("Lỗi khi xóa quiz/submission khỏi Firebase:", err);
    }
  };

  // Student completes exam handler
  const handleStudentSubmissionFinished = async (newSubmission: StudentSubmission) => {
    setSubmissions(prev => [newSubmission, ...prev]);
    try {
      await setDoc(doc(db, "submissions", newSubmission.id), cleanUndefined(newSubmission));
    } catch (err) {
      console.error("Lỗi khi đồng bộ kết quả bài làm lên Firebase:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `submissions/${newSubmission.id}`);
      } catch (e) {
        // Handled & logged in the helper
      }
    }
  };

  // Validate exam code input and start
  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentValidationError("");

    const targetCode = examCodeInput.trim().toUpperCase();
    if (!targetCode) {
      setStudentValidationError("Vui lòng điền mã đề thi truy cập!");
      return;
    }

    const matchedQuiz = quizzes.find(q => q.code === targetCode);
    if (!matchedQuiz) {
      setStudentValidationError("Không tìm thấy mã đề thi này trên hệ thống! Vui lòng thử lại.");
      return;
    }

    if (!studentName.trim()) {
      setStudentValidationError("Vui lòng điền họ và tên học sinh!");
      return;
    }

    if (!studentClass.trim()) {
      setStudentValidationError("Vui lòng điền thông tin lớp học!");
      return;
    }

    // Load active exam taker
    setActiveQuiz(matchedQuiz);
    setUserRole("STUDENT");
  };

  // Fast shortcut to input exam codes in demo mode
  const handleDirectSelectQuiz = (quizCode: string) => {
    setExamCodeInput(quizCode);
    setStudentValidationError("");
    // Focus or prepare layout
    const regForm = document.getElementById("student-reg-form");
    if (regForm) {
      regForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Derived state for quizzes filtering on landing page
  const uniqueSubjects = Array.from(new Set(quizzes.map(q => q.subject).filter(Boolean) as string[])).sort();
  const uniqueGrades = Array.from(new Set(quizzes.map(q => q.grade).filter(Boolean) as string[])).sort((a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return a.localeCompare(b);
  });

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filterSubject !== "ALL" && quiz.subject !== filterSubject) {
      return false;
    }
    if (filterGrade !== "ALL" && quiz.grade !== filterGrade) {
      return false;
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
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

  return (
    <div className="min-h-screen bg-[#040C2A] text-white font-sans" id="lms-application-viewport">
      {/* Universal Global Header Brand */}
      <header className="border-b border-[#1D3170]/80 bg-[#0A1435]/95 backdrop-blur shadow-lg sticky top-0 z-30 select-none">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            onClick={() => {
              if (userRole === "STUDENT") {
                if (!confirm("Bạn đang làm bài thi kiểm tra. Quay lại trang chủ sẽ hủy bỏ tiến độ hiện tại!")) return;
              }
              setUserRole("LANDING");
              setActiveQuiz(null);
            }}
            id="brand-logo-btn"
            className="flex items-center gap-3 cursor-pointer hover:opacity-95 active:scale-98 transition-all"
          >
            <div className="h-11 w-11 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-lg shadow-indigo-950/40">
              <School className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-[#6366F1] block leading-tight">EduQuiz Pro</span>
              <span className="text-[10px] font-black tracking-wider text-[#FF7A45] uppercase block">Hệ thống ôn luyện trắc nghiệm</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === "LANDING" ? (
              authenticatedTeacherEmail ? (
                <div className="flex items-center gap-3" id="active-teacher-indicator">
                  <div className="hidden sm:flex flex-col items-end text-right text-xs pr-1">
                    <span className="font-extrabold text-[#6366F1] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      ĐÃ ĐĂNG NHẬP
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[180px]">{authenticatedTeacherEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserRole("TEACHER")}
                    id="dashboard-access-btn"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#3B32C1] text-white rounded-2xl transition duration-155 text-xs md:text-sm font-extrabold cursor-pointer border border-[#6366F1]/25 shadow-md shadow-indigo-950/45"
                  >
                    VÀO QUẢN TRỊ
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await auth.signOut();
                      } catch (e) {
                        console.error("Lỗi khi đăng xuất khỏi Firebase:", e);
                      }
                      setAuthenticatedTeacherEmail("");
                      setUserRole("LANDING");
                    }}
                    id="header-logout-btn"
                    className="px-4 py-2.5 bg-red-900/10 hover:bg-red-900/30 text-red-300 hover:text-red-100 rounded-2xl border border-red-900/20 transition text-xs font-bold cursor-pointer"
                  >
                    ĐĂNG XUẤT
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  id="portal-teacher-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#3B32C1] active:bg-indigo-900 text-white rounded-2xl transition-all duration-155 text-sm font-extrabold cursor-pointer shadow-md shadow-indigo-950/55"
                >
                  <Lock className="h-4 w-4 text-orange-300" /> CỔNG GIÁO VIÊN
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (userRole === "STUDENT") {
                    if (!confirm("Hủy bỏ tiến độ ôn tập và quay về trang chủ?")) return;
                  }
                  setUserRole("LANDING");
                  setActiveQuiz(null);
                }}
                className="px-6 py-3 bg-[#1F2937] hover:bg-[#374151] text-slate-100 rounded-2xl border border-slate-700 shadow-sm transition text-sm font-bold cursor-pointer"
              >
                QUAY LẠI TRANG CHỦ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary layout views router */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {userRole === "LANDING" && (
          <div className="space-y-10 animate-fade-in" id="landing-page-container">
            {/* Beautiful visual greeting card banner */}
            <div className="bg-gradient-to-br from-[#4F46E5] via-[#5C54F1] to-[#7C3AED] text-white rounded-[40px] p-8 sm:p-12 relative overflow-hidden shadow-xl border border-indigo-200/10">
              {/* Subtle design additions for premium feels */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF6B35]" />
                  Học Tập Linh Hoạt - Đánh Giá Tức Thì
                </div>
                <h1 className="text-4xl sm:text-5xl font-black leading-tight sm:leading-none tracking-tight">
                  Hệ Thống Ôn Tập & <br />Kiểm Tra Trắc Nghiệm Mới
                </h1>
                <p className="text-base sm:text-lg font-medium text-indigo-100 leading-relaxed">
                  Thiết kế đề kiểm tra thông minh, dễ dàng phóng to xem hình vẽ chi tiết, nhận ngay gợi ý giải thích sư phạm cặn kẽ sau mỗi câu trả lời.
                </p>
                <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-bold text-indigo-100">
                  <span className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">• Chữ to rõ, dễ tiếp cận</span>
                  <span className="bg-white/15 px-3 py-2 rounded-xl border border-white/10">• Kính lúp phóng to hình ảnh x4</span>
                  <span className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">• Sinh câu hỏi tự động bằng Gemini AI</span>
                </div>
              </div>
            </div>

            {/* Split row - Student entry vs. Demo Tests */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Student registry entry form (Take 5 cols) */}
              <div className="lg:col-span-5 bg-[#0A1435] border border-[#1D3170]/80 rounded-[40px] p-6 sm:p-8 shadow-xl space-y-6" id="student-reg-form">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 bg-[#0F1D4A] rounded-2xl text-cyan-400">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-white tracking-tight">Vào Làm Bài Ôn Tập</h3>
                    <p className="text-sm font-semibold text-slate-300 mt-0.5">Dành cho học sinh làm bài kiểm tra trắc nghiệm</p>
                  </div>
                </div>

                {studentValidationError && (
                  <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-200 text-xs rounded-2xl font-bold flex gap-2 items-center">
                    <Info className="h-5 w-5 text-red-400 shrink-0" />
                    <span>{studentValidationError}</span>
                  </div>
                )}

                <form onSubmit={handleStartExam} className="space-y-4">
                  {/* Step 1: Exam Code */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-350 uppercase tracking-widest mb-2">MÃ ĐỀ THI TRUY CẬP (6 ký tự)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={examCodeInput}
                      onChange={(e) => {
                        setExamCodeInput(e.target.value.toUpperCase());
                        setStudentValidationError("");
                      }}
                      className="w-full text-center py-4 bg-[#060E29] hover:bg-[#0D163F] focus:bg-[#02071A] border-2 border-[#1E3375] focus:border-[#4F46E5] rounded-2.5xl outline-none font-black text-2xl tracking-wider text-cyan-400 font-mono transition text-white"
                      placeholder="MÃ ĐỀ"
                      required
                    />
                  </div>

                  {/* Step 2: Student Full Name */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-355 uppercase tracking-widest mb-2">HỌ VÀ TÊN HỌC SINH (CHỮ TO RÕ)</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        setStudentValidationError("");
                      }}
                      className="w-full px-4 py-3.5 bg-[#060E29] focus:bg-[#02071A] border-2 border-[#1E3375] focus:border-[#4F46E5] rounded-2xl outline-none text-base font-bold transition text-white placeholder-slate-400"
                      placeholder="Nhập tên của em..."
                      required
                    />
                  </div>

                  {/* Step 3: Class info */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-355 uppercase tracking-widest mb-2">LỚP HỌC</label>
                    <input
                      type="text"
                      value={studentClass}
                      onChange={(e) => {
                        setStudentClass(e.target.value);
                        setStudentValidationError("");
                      }}
                      className="w-full px-4 py-3.5 bg-[#060E29] focus:bg-[#02071A] border-2 border-[#1E3375] focus:border-[#4F46E5] rounded-2xl outline-none text-base font-bold transition text-white placeholder-slate-400"
                      placeholder="Ví dụ: 10A1, 9B, 8C"
                      required
                    />
                  </div>

                  {/* Submit trigger button - Vibrant Orange Accent */}
                  <button
                    type="submit"
                    id="student-exam-start-btn"
                    className="w-full py-4 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] text-white text-base font-extrabold rounded-2xl shadow-lg shadow-orange-950/40 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    BẮT ĐẦU ÔN BÀI THI NGAY
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

                {/* GV Võ Châu Thanh contact / support block */}
                <div className="pt-5 border-t border-[#1D3170]/85 space-y-2.5">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                    Thông tin hỗ trợ & Quản trị hệ thống:
                  </div>
                  <div className="bg-[#060E29]/60 rounded-2xl p-3.5 border border-[#1E3375]/80 flex flex-col gap-2 text-xs font-semibold text-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Giáo viên quản trị:</span>
                      <span className="font-extrabold text-white">GV. Võ Châu Thanh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Hỗ trợ nhanh Zalo:</span>
                      <a 
                        href="https://zalo.me/0974754446" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-black text-orange-400 hover:text-orange-300 underline transition flex items-center gap-1"
                      >
                        0974 754 446
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: List of current test cards available for demo testing (Take 7 cols) */}
              <div className="lg:col-span-7 bg-[#0A1435] border border-[#1D3170]/80 rounded-[40px] p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-950/60 rounded-xl text-indigo-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-white tracking-tight">Danh Sách Đề Ôn Tập Hiện Có</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Nhấp vào một đề bất kỳ để nạp mã tự động</p>
                  </div>
                </div>

                {/* Visual Premium Filters Row */}
                <div className="bg-[#060E29]/50 p-4 border border-[#1E3375]/80 rounded-3xl space-y-3.5 shadow-inner">
                  <div className="text-2xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="h-3 w-3" /> BỘ LỌC TÌM KIẾM ĐỀ THI
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Search query box */}
                    <div className="sm:col-span-6 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder="Tìm theo tên đề, mã đề..."
                        className="w-full pl-10 pr-3 py-2.5 bg-[#06102F] hover:bg-[#0D1945] focus:bg-[#02071C] border border-[#1E3579] focus:border-cyan-400 rounded-xl outline-none text-xs font-semibold text-white placeholder-slate-400 transition-all font-sans shadow-xs"
                      />
                    </div>

                    {/* Subject Filter Dropdown */}
                    <div className="sm:col-span-3">
                      <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#06102F] border border-[#1E3579] focus:border-cyan-400 rounded-xl outline-none text-xs font-semibold text-white transition-all font-sans cursor-pointer focus:bg-[#06102F]"
                      >
                        <option value="ALL" className="bg-[#06102F]">Môn học (Tất cả)</option>
                        {uniqueSubjects.map(subj => (
                          <option key={subj} value={subj} className="bg-[#06102F]">Môn: {subj}</option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Level Filter Dropdown */}
                    <div className="sm:col-span-3">
                      <select
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#06102F] border border-[#1E3579] focus:border-cyan-400 rounded-xl outline-none text-xs font-semibold text-white transition-all font-sans cursor-pointer focus:bg-[#06102F]"
                      >
                        <option value="ALL" className="bg-[#06102F]">Lớp học (Tất cả)</option>
                        {uniqueGrades.map(grade => (
                          <option key={grade} value={grade} className="bg-[#06102F]">Lớp: {grade}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter Status Pills - allow easy reset! */}
                  {(filterQuery || filterSubject !== "ALL" || filterGrade !== "ALL") && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-300 font-bold uppercase mr-1">Đang áp dụng:</span>
                      
                      {filterQuery && (
                        <span className="px-2.5 py-1 bg-[#13245B]/75 border border-[#1D357A] rounded-lg text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          Từ khóa: {filterQuery}
                          <button onClick={() => setFilterQuery("")} className="hover:text-white font-black cursor-pointer ml-1 text-slate-400">×</button>
                        </span>
                      )}

                      {filterSubject !== "ALL" && (
                        <span className="px-2.5 py-1 bg-[#13245B]/75 border border-[#1D357A] rounded-lg text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          Môn: {filterSubject}
                          <button onClick={() => setFilterSubject("ALL")} className="hover:text-white font-black cursor-pointer ml-1 text-slate-400">×</button>
                        </span>
                      )}

                      {filterGrade !== "ALL" && (
                        <span className="px-2.5 py-1 bg-[#13245B]/75 border border-[#1D357A] rounded-lg text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          Lớp: {filterGrade}
                          <button onClick={() => setFilterGrade("ALL")} className="hover:text-white font-black cursor-pointer ml-1 text-slate-400">×</button>
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setFilterQuery("");
                          setFilterSubject("ALL");
                          setFilterGrade("ALL");
                        }}
                        className="text-[10px] text-orange-400 font-black hover:text-orange-300 cursor-pointer underline ml-auto uppercase tracking-wider"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredQuizzes.length === 0 ? (
                    <div className="py-12 bg-[#060E29]/40 border border-dashed border-[#1E3375] rounded-3xl text-center space-y-2">
                      <HelpCircle className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
                      <p className="text-sm font-bold text-slate-300">Không tìm thấy đề ôn tập nào phù hợp!</p>
                      <p className="text-2xs font-semibold text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm đề, lớp, môn học khác.</p>
                    </div>
                  ) : (
                    filteredQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        onClick={() => handleDirectSelectQuiz(quiz.code)}
                        className="p-5 bg-[#0C173F]/75 hover:bg-[#11235F] active:bg-[#081232] border border-[#1E3782] hover:border-[#38bdf8] rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-150 group shadow-md"
                      >
                        <div className="space-y-1.5 pr-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-white bg-[#4F46E5] px-2.5 py-0.5 rounded-md">
                              {quiz.subject} • LỚP {quiz.grade}
                            </span>
                            {quiz.questions.some(q => q.image) && (
                              <span className="text-[9px] font-bold text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-900/30">
                                Có hình vẽ dạng ảnh
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-[#EDF2F7] text-sm md:text-base leading-snug group-hover:text-cyan-300 transition-colors">
                            {quiz.title}
                          </h4>
                          <p className="text-slate-300 text-2xs font-bold flex items-center gap-1.5 mt-0.5">
                            <span>Cơ cấu: {quiz.questions.length} câu hỏi ôn tập</span>
                            <span className="text-indigo-200 font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                              ⏳ {quiz.durationMinutes ? `${quiz.durationMinutes} phút` : "Không giới hạn"}
                            </span>
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2.5">
                          {authenticatedTeacherEmail && (quiz.teacherEmail === authenticatedTeacherEmail || authenticatedTeacherEmail === "linh0704chatgpt@gmail.com") ? (
                            <span className="bg-[#FF6B35] text-white font-mono font-black text-xs px-3 py-1.5 rounded-xl shadow-sm">
                              MÃ: {quiz.code}
                            </span>
                          ) : (
                            <span className="bg-[#0A1231] text-slate-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700/50 shadow-inner select-none" title="Mã đề thi được bảo mật bởi giáo viên">
                              MÃ: ******
                            </span>
                          )}

                          {authenticatedTeacherEmail === "linh0704chatgpt@gmail.com" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đề ôn tập "${quiz.title}" (Mã: ${quiz.code}) khỏi hệ thống không?`)) {
                                  handleDeleteQuiz(quiz.id);
                                }
                              }}
                              className="h-9 w-9 bg-red-950/80 border border-red-800 hover:bg-red-800/95 rounded-xl flex items-center justify-center transition-all shadow-sm z-10 cursor-pointer text-red-400 hover:text-white"
                              title="Xóa đề ôn tập này khỏi hệ thống"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          <div className="h-9 w-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                            <ChevronRight className="h-5 w-5 text-cyan-400" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Active taker layout */}
        {userRole === "STUDENT" && activeQuiz && (
          <StudentExamTaking
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleStudentSubmissionFinished}
            onGoHome={() => {
              setUserRole("LANDING");
              setActiveQuiz(null);
            }}
          />
        )}

        {/* Teacher Active Dashboard controller console */}
        {userRole === "TEACHER" && (
          <div className="bg-slate-50 text-slate-900 rounded-[40px] p-6 sm:p-10 shadow-2xl border border-indigo-150 relative animate-fade-in">
            <TeacherDashboard
              quizzes={quizzes.filter(q => q.teacherEmail === authenticatedTeacherEmail || (!q.teacherEmail && authenticatedTeacherEmail === "linh0704chatgpt@gmail.com"))}
              submissions={submissions.filter(s => {
                const quiz = quizzes.find(item => item.id === s.quizId || item.code === s.quizCode);
                if (!quiz) return false;
                return quiz.teacherEmail === authenticatedTeacherEmail || (!quiz.teacherEmail && authenticatedTeacherEmail === "linh0704chatgpt@gmail.com");
              })}
              onAddQuiz={handleAddQuiz}
              onUpdateQuiz={handleUpdateQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              gmailEmail={authenticatedTeacherEmail}
              onLogout={async () => {
                try {
                  await auth.signOut();
                } catch (e) {
                  console.error("Lỗi khi đăng xuất khỏi Firebase:", e);
                }
                setUserRole("LANDING");
                setAuthenticatedTeacherEmail("");
              }}
            />
          </div>
        )}
      </main>

      {/* Universal premium custom footer with educator and system info */}
      <footer className="border-t border-[#1D3170]/60 bg-[#0A1435]/80 backdrop-blur py-8 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <p className="text-xs font-bold text-slate-300">
              <span className="text-cyan-400 font-extrabold text-sm tracking-tight">EduQuiz Pro</span> - Hệ Thống Ôn Luyện Trắc Nghiệm Thông Minh
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              © 2026 Toàn bộ bản quyền tài liệu và đề thi thuộc về ban quản trị và các giáo viên bộ môn.
            </p>
          </div>
          
          <div className="bg-[#060E29]/80 px-5 py-3 rounded-2.5xl border border-[#1E3375]/80 shadow-md flex flex-col sm:flex-row items-center gap-x-6 gap-y-1.5 text-xs font-semibold text-slate-200">
            <span className="text-cyan-400 font-bold text-2xs uppercase tracking-wider">Hỗ trợ kỹ thuật & Đề thi:</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-300">👤 GV:</span>
              <span className="font-extrabold text-[#F8FAFC]">Võ Châu Thanh</span>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">💬 Zalo:</span>
              <a 
                href="https://zalo.me/0974754446" 
                target="_blank" 
                rel="noreferrer" 
                className="font-black text-[#FF7A45] hover:text-orange-300 underline transition tracking-wide"
              >
                0974 754 446
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Embedded Teacher Portal Gate Access Validation Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          userEmail="linh0704chatgpt@gmail.com"
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(email) => {
            setAuthenticatedTeacherEmail(email);
            setUserRole("TEACHER");
            setIsAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}
