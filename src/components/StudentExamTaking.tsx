import { useState, useEffect, useRef } from "react";
import { Quiz, StudentSubmission } from "../types";
import { Clock, CheckCircle2, AlertCircle, Maximize2, Sparkles, ChevronRight, ChevronLeft, Send, Home, Info, Lock } from "lucide-react";
import ImageOverlay from "./ImageOverlay";

interface StudentExamTakingProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (submission: StudentSubmission) => void;
  onGoHome: () => void;
}

export default function StudentExamTaking({ quiz, studentName, studentClass, onFinish, onGoHome }: StudentExamTakingProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const [isFinishedLocal, setIsFinishedLocal] = useState<boolean>(false);
  const [quizSubmission, setQuizSubmission] = useState<StudentSubmission | null>(null);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  // Store the answers in a mutable ref to prevent stale closures during auto-submission
  const answersRef = useRef(answers);
  const timeSpentRef = useRef(timeSpent);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeSpentRef.current = timeSpent;
  }, [timeSpent]);

  // Handle auto submit when time is up
  const handleAutoSubmitQuiz = () => {
    let correct = 0;
    quiz.questions.forEach(q => {
      if (answersRef.current[q.id] === q.correctIndex) {
        correct++;
      }
    });

    const total = quiz.questions.length;
    // Score scaled out of 10, rounded to 1 decimal
    const rawScore = (correct / total) * 10;
    const finalScore = Math.round(rawScore * 10) / 10;

    const submission: StudentSubmission = {
      id: "sub_auto_" + Date.now(),
      quizId: quiz.id,
      quizCode: quiz.code,
      quizTitle: quiz.title,
      studentName,
      studentClass,
      answers: answersRef.current,
      score: finalScore,
      correctCount: correct,
      totalCount: total,
      submittedAt: new Date().toISOString(),
      durationSeconds: timeSpentRef.current
    };

    setQuizSubmission(submission);
    setIsFinishedLocal(true);
    onFinish(submission);
    alert(`⏳ HẾT GIỜ LÀM BÀI!\nBài thi của bạn học sinh [${studentName}] lớp [${studentClass}] đã được hệ thống tự động lưu và gửi đi.`);
  };

  // Time tracking
  useEffect(() => {
    if (isFinishedLocal) return;

    const limitSeconds = quiz.durationMinutes ? quiz.durationMinutes * 60 : Infinity;

    const interval = setInterval(() => {
      setTimeSpent(p => {
        const next = p + 1;
        if (next >= limitSeconds) {
          clearInterval(interval);
          setTimeout(() => {
            handleAutoSubmitQuiz();
          }, 0);
          return limitSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinishedLocal, quiz.durationMinutes]);

  const activeQuestion = quiz.questions[currentIdx];

  const handleSelectOption = (index: number) => {
    setAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: index
    }));
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitQuiz = () => {
    const unanswered = quiz.questions
      .map((q, idx) => (answers[q.id] === undefined ? idx + 1 : null))
      .filter((n): n is number => n !== null);

    if (unanswered.length > 0) {
      setShowValidationError(true);
      // Automatically redirect current focus to the first unanswered question
      const firstUnansweredIdx = quiz.questions.findIndex(q => answers[q.id] === undefined);
      if (firstUnansweredIdx !== -1) {
        setCurrentIdx(firstUnansweredIdx);
      }
      return;
    }

    // Confirm taking exam
    let correct = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    const total = quiz.questions.length;
    // Score scaled out of 10, rounded to 1 decimal
    const rawScore = (correct / total) * 10;
    const finalScore = Math.round(rawScore * 10) / 10;

    const submission: StudentSubmission = {
      id: "sub_" + Date.now(),
      quizId: quiz.id,
      quizCode: quiz.code,
      quizTitle: quiz.title,
      studentName,
      studentClass,
      answers,
      score: finalScore,
      correctCount: correct,
      totalCount: total,
      submittedAt: new Date().toISOString(),
      durationSeconds: timeSpent
    };

    setQuizSubmission(submission);
    setIsFinishedLocal(true);
    // Raise callback up to update dashboard simulations
    onFinish(submission);
  };

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredIndices = quiz.questions
    .map((q, idx) => (answers[q.id] === undefined ? idx + 1 : null))
    .filter((n): n is number => n !== null);

  if (isFinishedLocal && quizSubmission) {
    // Result review mode (shows correct/incorrect options + large, easily readable letter explanation)
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="submission-result-view">
        {/* Confetti celebration or encouraging banners */}
        <div className="bg-gradient-to-br from-[#4F46E5] via-[#5C54F1] to-[#7C3AED] rounded-[40px] p-8 text-white shadow-xl text-center relative overflow-hidden border border-indigo-200/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex p-3 bg-white/15 rounded-full animate-bounce">
              <Sparkles className="h-8 w-8 text-amber-300" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">KẾT QUẢ ÔN TẬP</h2>
            <p className="text-lg font-medium text-indigo-100">Cố gắng tuyệt vời, {studentName}! Hãy xem lại câu hỏi để nắm chắc kiến thức.</p>
            
            {/* Score Grid with Vibrant Theme */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4 text-slate-900">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Điểm Số</p>
                <p className="text-4xl font-black text-[#4F46E5] mt-1">{quizSubmission.score}/10</p>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số Câu Đúng</p>
                <p className="text-4xl font-black text-emerald-600 mt-1">{quizSubmission.correctCount}/{quizSubmission.totalCount}</p>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thời Gian Làm</p>
                <p className="text-3xl font-black text-slate-700 mt-2">{formatTime(quizSubmission.durationSeconds)}</p>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50 col-span-2 sm:col-span-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỷ Lệ Đúng</p>
                <p className="text-3xl font-black text-[#FF6B35] mt-2">
                  {Math.round((quizSubmission.correctCount / quizSubmission.totalCount) * 100)}%
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onGoHome}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#4F46E5] hover:bg-indigo-50 active:bg-indigo-100 font-extrabold rounded-2xl transition shadow-lg cursor-pointer text-base"
              >
                <Home className="h-5 w-5 text-[#FF6B35]" /> QUAY LẠI TRANG CHỦ
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Question Review List */}
        {quiz.showAnswersAfterCompletion !== false ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 bg-[#0A1435] border border-[#1D3170]/80 p-4.5 rounded-3xl shadow-md select-none">
              <span className="w-3 h-7 bg-[#FF6B35] rounded-full inline-block"></span>
              Xem Giải Thích Chi Tiết Từng Câu Hỏi
            </h3>

            {quiz.questions.map((q, qIndex) => {
              const studentSelected = answers[q.id];
              const isCorrect = studentSelected === q.correctIndex;

              return (
                <div
                  key={q.id}
                  id={`result-q-${qIndex}`}
                  className={`bg-white rounded-[40px] p-6 sm:p-8 border-2 shadow-sm transition-all hover:shadow-md ${
                    isCorrect ? "border-emerald-250 bg-emerald-50/5" : "border-red-150 bg-red-50/5"
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className="flex items-center gap-2.5 mb-4">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs">
                        <CheckCircle2 className="h-4 w-4" /> ĐÚNG
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 text-red-800 font-extrabold rounded-full text-xs">
                        <AlertCircle className="h-4 w-4" /> SAI HOẶC CHƯA CHỌN
                      </span>
                    )}
                    <span className="text-sm text-slate-400 font-bold">Câu hỏi {qIndex + 1}:</span>
                  </div>

                  {/* Big question text */}
                  <h4 className="text-2xl font-extrabold text-slate-900 leading-snug mb-5">
                    {q.questionText}
                  </h4>

                  {/* Question Image with magnifying glass click handler */}
                  {q.image && (
                    <div className="relative max-w-full md:max-w-md bg-slate-100 rounded-3xl p-3 border-4 border-white shadow-md mb-6 group overflow-hidden">
                      <img
                        src={q.image}
                        alt={`Minh họa câu ${qIndex + 1}`}
                        className="w-full h-auto max-h-60 object-contain rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveZoomUrl(q.image || null)}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-extrabold gap-2 cursor-pointer rounded-2xl"
                      >
                        <Maximize2 className="h-6 w-6 text-orange-400" /> Click để phóng to
                      </button>
                    </div>
                  )}

                  {/* Options representation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((option, opIdx) => {
                      const optLetter = String.fromCharCode(65 + opIdx); // Supporting A, B, C, D, E, F etc.
                      const isOptionCorrect = opIdx === q.correctIndex;
                      const isOptionStudentChosen = opIdx === studentSelected;

                      let optBg = "bg-slate-50/60 border-slate-100 text-slate-700";
                      if (isOptionCorrect) {
                        optBg = "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold";
                      } else if (isOptionStudentChosen && !isCorrect) {
                        optBg = "bg-red-50/70 border-red-300 text-red-900 font-bold";
                      }

                      return (
                        <div
                          key={opIdx}
                          className={`p-4.5 border-2 rounded-2xl flex flex-col gap-2.5 transition-colors ${optBg}`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm ${
                              isOptionCorrect 
                                ? "bg-emerald-500 text-white" 
                                : isOptionStudentChosen 
                                  ? "bg-red-500 text-white" 
                                  : "bg-slate-200 text-slate-600"
                            }`}>
                              {optLetter}
                            </span>
                            <span className="text-lg font-bold leading-relaxed">{option}</span>
                          </div>
                          {q.optionImages?.[opIdx] && (
                            <div className="mt-1 relative bg-slate-50 rounded-xl p-1.5 border border-slate-200 max-w-full overflow-hidden self-start">
                              <img
                                src={q.optionImages[opIdx]}
                                alt={`Minh họa phương án ${optLetter}`}
                                className="max-h-24 object-contain rounded-lg"
                              />
                              <div 
                                className="absolute inset-0 bg-black/10 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-150 rounded-lg cursor-zoom-in"
                                onClick={() => {
                                  setActiveZoomUrl(q.optionImages?.[opIdx] || null);
                                }}
                              >
                                <Maximize2 className="h-4 w-4 text-orange-400" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Highly structured, prominent teacher explaination box */}
                  {q.explanation && (
                    <div className="mt-6 p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex gap-3.5">
                      <Info className="h-6 w-6 text-[#4F46E5] shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-lg font-bold text-[#4F46E5]">Hướng dẫn giải & giải thích:</h5>
                        <p className="text-slate-800 text-lg leading-relaxed mt-1 font-semibold">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border hover:shadow-lg border-indigo-100 rounded-[40px] p-8 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100 shadow-sm animate-pulse">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black text-rose-600 uppercase tracking-tight font-sans">KẾT QUẢ ĐÃ ĐƯỢC GHI NHẬN</h3>
            <p className="text-slate-600 text-base leading-relaxed font-bold font-sans">
              Giáo viên đã cấu hình <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Ấn đáp án và giải thích</span> cho đề thi này. Kết quả làm bài thi của học sinh <span className="font-extrabold text-indigo-600">[{studentName}]</span> lớp <span className="font-extrabold text-indigo-600">[{studentClass}]</span> đã được truyền và đồng bộ an toàn về hệ thống!
            </p>
            <p className="text-xs text-slate-400 font-bold">
              * Vui lòng liên hệ giáo viên để nhận phản hồi đánh giá chi tiết về bài thi này !
            </p>
          </div>
        )}

        {/* Lightbox */}
        {activeZoomUrl && (
          <ImageOverlay 
            src={activeZoomUrl} 
            onClose={() => setActiveZoomUrl(null)} 
          />
        )}
      </div>
    );
  }

  // Active testing taker
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" id="exam-dashboard-main">
      {/* Test details stats with Bento/Vibrant style */}
      <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-indigo-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black text-white px-3 py-1 bg-[#4F46E5] rounded-lg uppercase tracking-wider">
            Môn: {quiz.subject} - Lớp {quiz.grade}
          </span>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight mt-3 leading-snug">{quiz.title}</h2>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-500 mt-2 font-bold">
            <span className="text-slate-700">Học sinh: {studentName}</span>
            <span className="text-indigo-200">•</span>
            <span className="text-slate-700">Lớp: {studentClass}</span>
          </div>
        </div>

        {/* Stopwatch / Countdown widget with Vibrant color palette */}
        {quiz.durationMinutes ? (() => {
          const limitSeconds = quiz.durationMinutes * 60;
          const timeLeftSecs = Math.max(0, limitSeconds - timeSpent);
          const isUrgent = timeLeftSecs <= 60;
          return (
            <div 
              id="stopwatch-widget" 
              className={`flex items-center gap-3.5 px-6 py-4 rounded-2xl shrink-0 self-start md:self-auto border shadow-md transition-all duration-300 ${
                isUrgent 
                  ? "bg-rose-950 text-rose-100 border-rose-800 animate-pulse ring-2 ring-rose-500" 
                  : "bg-[#0F172A] text-white border-slate-800"
              }`}
            >
              <Clock className={`h-6.5 w-6.5 ${isUrgent ? "text-red-500" : "text-[#FF6B35] animate-pulse"}`} />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {isUrgent ? "⌛ SẮP HẾT GIỜ" : "⌛ THỜI GIAN CÒN LẠI"}
                </p>
                <p className={`text-2xl font-mono font-black tracking-wider mt-0.5 ${isUrgent ? "text-red-400" : "text-[#FF6B35]"}`}>
                  {formatTime(timeLeftSecs)}
                </p>
              </div>
            </div>
          );
        })() : (
          <div id="stopwatch-widget" className="flex items-center gap-3.5 px-6 py-4 bg-slate-900 text-white rounded-2xl shrink-0 self-start md:self-auto border border-slate-850 shadow-md">
            <Clock className="h-6.5 w-6.5 text-[#FF6B35] animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Thời gian trôi</p>
              <p className="text-2xl font-mono font-black text-[#FF6B35] tracking-wider mt-0.5">
                {formatTime(timeSpent)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of progress indicators with Vibrant theme */}
      <div className="bg-white/80 backdrop-blur border border-indigo-50 py-5 px-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#4F46E5] text-lg">
            Tiến độ: {answeredCount}/{totalQuestions} câu đã làm
          </span>
        </div>
        
        {/* Navigation points circles */}
        <div id="navigation-circles" className="flex flex-wrap gap-2">
          {quiz.questions.map((_, idx) => {
            const isCurrent = idx === currentIdx;
            const isAnswered = answers[quiz.questions[idx].id] !== undefined;

            let circleClass = "bg-[#F0F4FF] border-slate-100 text-slate-600 hover:border-indigo-300";
            if (isCurrent) {
              circleClass = "bg-[#4F46E5] border-[#4F46E5] text-white scale-110 shadow-md ring-4 ring-indigo-100";
            } else if (isAnswered) {
              circleClass = "bg-indigo-100 border-indigo-200 text-[#4F46E5] font-extrabold";
            } else if (showValidationError) {
              circleClass = "bg-rose-50 border-rose-300 text-rose-600 font-extrabold animate-pulse ring-2 ring-rose-300/80";
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-9.5 h-9.5 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all duration-155 cursor-pointer ${circleClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning regarding mandatory questions */}
      {showValidationError && unansweredIndices.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5.5 flex items-start gap-4 shadow-sm text-rose-950 animate-pulse">
          <AlertCircle className="h-6 w-6 text-rose-650 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-rose-900 tracking-tight">CẢNH BÁO: CHƯA HOÀN THÀNH BÀI THI</h4>
            <p className="text-sm font-semibold leading-relaxed text-rose-800">
              Em chưa hoàn thành hết tất cả câu hỏi trong đề ôn tập này. Để nộp bài, em bắt buộc phải tích chọn đáp án cho tất cả câu hỏi dưới đây.
            </p>
            <div className="flex flex-wrap gap-2 items-center mt-3">
              <span className="text-xs font-black text-rose-800 uppercase tracking-widest mr-1">Các câu chưa làm (nhấp để đến ngay):</span>
              {unansweredIndices.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentIdx(num - 1)}
                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold rounded-xl text-xs transition border border-rose-250 hover:border-rose-300 shadow-3xs cursor-pointer"
                >
                  Câu {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Question Slide Area - Large font, highly readable */}
      <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-indigo-100 shadow-sm relative space-y-6">
        <div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">Câu hỏi {currentIdx + 1} / {totalQuestions}</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mt-3">
            {activeQuestion.questionText}
          </h3>
        </div>

        {/* Display question graphic/image if exists */}
        {activeQuestion.image && (
          <div className="relative bg-slate-50 rounded-3xl p-3 border-4 border-slate-100 max-w-xl group overflow-hidden shadow-inner">
            <img
              src={activeQuestion.image}
              alt="Minh họa câu hỏi"
              className="w-full h-auto max-h-72 object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            {/* Super creative hint button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setActiveZoomUrl(activeQuestion.image || null)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] hover:bg-[#3B32C1] active:bg-[#2C249C] text-white rounded-xl shadow-lg font-bold border border-indigo-400 cursor-pointer text-sm"
              >
                <Maximize2 className="h-4 w-4 text-orange-300" /> PHÓNG TO HÌNH VẼ
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium text-center">
              * Nhấp nút "Phóng To" ở góc hoặc nhấp trực tiếp vào hình để xem kính lúp cực sắc nét x4
            </p>
            <div 
              className="absolute inset-0 bg-slate-900/5 cursor-zoom-in"
              onClick={() => setActiveZoomUrl(activeQuestion.image || null)}
            />
          </div>
        )}

        {/* Large sized multiple-choice buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          {activeQuestion.options.map((option, opIdx) => {
            const optLetter = String.fromCharCode(65 + opIdx); // Supporting A, B, C, D...
            const isSelected = answers[activeQuestion.id] === opIdx;

            return (
              <button
                key={opIdx}
                onClick={() => handleSelectOption(opIdx)}
                className={`w-full text-left p-5 border-2 rounded-2xl flex flex-col gap-3 transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#F0F4FF] border-[#4F46E5] ring-2 ring-indigo-200/50 shadow-sm"
                    : "bg-white hover:bg-slate-50 active:bg-indigo-50 border-slate-150 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-4 w-full">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-black transition-all uppercase ${
                    isSelected 
                      ? "bg-[#4F46E5] text-white scale-105" 
                      : "bg-[#F0F4FF] text-[#4F46E5]"
                  }`}>
                    {optLetter}
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-snug">{option}</span>
                </div>
                {activeQuestion.optionImages?.[opIdx] && (
                  <div className="mt-1 relative bg-slate-50 rounded-xl p-1.5 border border-slate-200 max-w-full overflow-hidden self-start">
                    <img
                      src={activeQuestion.optionImages[opIdx]}
                      alt={`Minh họa phương án ${optLetter}`}
                      className="max-h-28 object-contain rounded-lg"
                    />
                    <div 
                      className="absolute inset-0 bg-black/10 hover:bg-black/25 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-150 rounded-lg cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveZoomUrl(activeQuestion.optionImages?.[opIdx] || null);
                      }}
                    >
                      <Maximize2 className="h-4 w-4 text-orange-400" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test taking navigation bar */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-6 py-4 bg-white hover:bg-slate-50 disabled:opacity-45 text-slate-700 font-bold rounded-2xl border border-indigo-100 transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed select-none text-base shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-[#4F46E5]" /> CÂU TRƯỚC
        </button>

        {currentIdx === totalQuestions - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            id="student-submit-quiz-btn"
            className="px-8 py-4 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] text-white font-black rounded-2xl transition shadow-lg shadow-orange-200/50 flex items-center gap-2 cursor-pointer text-lg"
          >
            NỘP BÀI THI <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-7 py-4 bg-[#4F46E5] hover:bg-[#3B32C1] text-white font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer text-base shadow-md shadow-indigo-150/10"
          >
            CÂU KẾ TIẾP <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Lightbox magnification glass */}
      {activeZoomUrl && (
        <ImageOverlay 
          src={activeZoomUrl} 
          onClose={() => setActiveZoomUrl(null)} 
        />
      )}
    </div>
  );
}
