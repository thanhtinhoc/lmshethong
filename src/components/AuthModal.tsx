import React, { useState } from "react";
import { Lock, Mail, ShieldAlert, ArrowRight, X } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

interface AuthModalProps {
  onSuccess: (email: string) => void;
  onClose: () => void;
  userEmail?: string;
}

export default function AuthModal({ onSuccess, onClose, userEmail }: AuthModalProps) {
  // Autofill if provided in our metadata
  const [email, setEmail] = useState(userEmail || "linh0704chatgpt@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user && result.user.email) {
        onSuccess(result.user.email);
      } else {
        setError("Không thể xác thực email từ tài khoản Google của bạn.");
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Đã xảy ra lỗi khi đăng nhập bằng tài khoản Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ Gmail hợp lệ!");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu quản trị!");
      return;
    }

    // Default simulated password for demonstration: "admin123" or generic check
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (password === "admin123" || password === "123456" || email === userEmail) {
        onSuccess(email);
      } else {
        setError("Mật khẩu không chính xác! Hãy thử lại với mật khẩu: admin123");
      }
    }, 1000);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div 
        id="auth-modal-card"
        className="w-full max-w-md bg-[#0A1435] rounded-3xl shadow-2xl border border-[#1D3170] overflow-hidden relative"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-br from-[#0A1435] to-[#12225B] border-b border-[#1D3170]/80 px-7 py-9 text-white relative">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 bg-[#0F1D4A] border border-[#1E3375] rounded-2xl">
              <Lock className="h-6 w-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight font-display text-white">Cổng Giáo Viên</h2>
          </div>
          <p className="text-sm text-cyan-400 font-extrabold pb-1">Bảo mật hệ thống đề ôn tập & Báo cáo kết quả</p>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-4 bg-red-950/40 border border-red-500/25 text-red-200 rounded-2xl text-sm leading-relaxed animate-shake">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Lỗi đăng nhập</p>
                <p className="text-red-300 font-bold text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Real Google Auth integration */}
          <div>
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 px-5 bg-[#06102F] hover:bg-[#0D1945] disabled:opacity-50 text-white border border-[#1E3579] font-black rounded-2xl transition transition-all flex items-center justify-center gap-3 cursor-pointer text-xs md:text-sm tracking-wide uppercase"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.21 -0.16,-1.7c0,0 0,0 0,0Z" fill="#4285F4" />
                  <path d="M12,20.5c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.91,0.61 -2.08,0.98 -3.3,0.98c-2.35,0 -4.33,-1.58 -5.04,-3.71H0.91v2.65C2.39,18.63 6.91,20.5 12,20.5Z" fill="#34A853" />
                  <path d="M6.96,13.02C6.78,12.48 6.68,11.9 6.68,11.3c0,-0.6 0.1,-1.18 0.28,-1.72V6.93H0.91C0.33,8.08 0,9.45 0,10.9s0.33,2.82 0.91,3.97l5.14,-3.91c0.16,0.1 0.44,0.16 0.91,0.16Z" fill="#FBBC05" />
                  <path d="M11.9,6.5c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.36,3.75 14.33,3.1 11.9,3.1C6.81,3.1 2.29,4.97 0.81,8.08l5.14,3.91C6.66,8.27 8.64,6.5 11.9,6.5Z" fill="#EA4335" />
                </g>
              </svg>
              <span>ĐĂNG NHẬP BẰNG GOOGLE</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-2 text-slate-500">
            <div className="h-px bg-[#1D3170]/80 flex-1" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">hoặc đăng nhập thủ công</span>
            <div className="h-px bg-[#1D3170]/80 flex-1" />
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                NHẬP GMAIL HOẶC ĐĂNG NHẬP GMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#060E29] focus:bg-[#02071A] border-2 border-[#1E3375] focus:border-[#4F46E5] rounded-2xl outline-none font-bold transition text-white placeholder-slate-450 text-sm"
                  placeholder="name@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                MẬT KHẨU QUẢN TRỊ
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#060E29] focus:bg-[#02071A] border-2 border-[#1E3375] focus:border-[#4F46E5] rounded-2xl outline-none font-bold transition text-white placeholder-slate-450 text-sm"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                * Có thể đăng nhập bằng Gmail bất kỳ với mật khẩu mặc định: <code className="bg-[#0F1D4A] px-2 py-0.5 rounded font-black text-cyan-350">admin123</code>
              </p>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-5 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] disabled:bg-[#FF6B35]/50 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 group cursor-pointer text-sm tracking-wide uppercase"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5 justify-center py-0.5">
                <span className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Đang xác thực hệ thống...
              </span>
            ) : (
              <>
                ĐĂNG NHẬP GMAIL / GV
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-white" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
