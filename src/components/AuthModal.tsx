import React, { useState } from "react";
import { Lock, ShieldAlert, X } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

interface AuthModalProps {
  onSuccess: (email: string) => void;
  onClose: () => void;
  userEmail?: string;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
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

        {/* Form area -- Clean Google Sign-In only */}
        <div className="p-7 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-4 bg-red-950/40 border border-red-500/25 text-red-200 rounded-2xl text-sm leading-relaxed animate-shake">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Lỗi đăng nhập</p>
                <p className="text-red-300 font-bold text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="text-center py-2">
            <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
              Vui lòng sử dụng tài khoản Google để xác minh danh tính và đăng nhập vào hệ thống quản lý đề thi dành cho giáo viên.
            </p>
          </div>

          {/* Real Google Auth integration */}
          <div>
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4.5 px-5 bg-[#FF6B35] hover:bg-[#E05A2A] active:bg-[#C84A1E] disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-orange-950/20 hover:shadow-orange-950/30 transition-all flex items-center justify-center gap-3.5 cursor-pointer text-xs md:text-sm tracking-widest uppercase"
            >
              <div className="bg-white p-1 rounded-lg">
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.21 -0.16,-1.7c0,0 0,0 0,0Z" fill="#313131" />
                    <path d="M12,20.5c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.91,0.61 -2.08,0.98 -3.3,0.98c-2.35,0 -4.33,-1.58 -5.04,-3.71H0.91v2.65C2.39,18.63 6.91,20.5 12,20.5Z" fill="#313131" />
                    <path d="M6.96,13.02C6.78,12.48 6.68,11.9 6.68,11.3c0,-0.6 0.1,-1.18 0.28,-1.72V6.93H0.91C0.33,8.08 0,9.45 0,10.9s0.33,2.82 0.91,3.97l5.14,-3.91c0.16,0.1 0.44,0.16 0.91,0.16Z" fill="#313131" />
                    <path d="M11.9,6.5c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.36,3.75 14.33,3.1 11.9,3.1C6.81,3.1 2.29,4.97 0.81,8.08l5.14,3.91C6.66,8.27 8.64,6.5 11.9,6.5Z" fill="#313131" />
                  </g>
                </svg>
              </div>
              <span>{isLoading ? "ĐANG LIÊN KẾT GOOGLE..." : "ĐĂNG NHẬP BẰNG GOOGLE"}</span>
            </button>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 font-bold select-none tracking-wider">
            🔒 Kết nối an toàn & bảo mật trực tiếp thông qua Google Firebase Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
