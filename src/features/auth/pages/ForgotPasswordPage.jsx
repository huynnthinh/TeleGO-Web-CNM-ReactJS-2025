import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { toast } from "react-toastify";
import axios from "axios";
import { auth } from "../../../firebase/config";

const ForgotPasswordPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef(null);

  const API_BASE_URL = "https://telego-backend.onrender.com/api";

  useEffect(() => {
    const initializeRecaptcha = async () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",
            callback: () => console.log("reCAPTCHA verified successfully"),
            "expired-callback": () => {
              toast.error("reCAPTCHA đã hết hạn. Vui lòng làm mới trang.");
              setIsLoading(false);
            },
          }
        );
        await recaptchaVerifierRef.current.render();
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
        toast.error("Không thể khởi tạo xác minh. Vui lòng làm mới trang.");
      }
    };

    initializeRecaptcha();

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const changePasswordByPhoneNumber = async (phoneNumber, newPassword) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/change-password-phone`,
        { phoneNumber, newPassword }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const message = error.response?.data?.message;
        if (message === "Không tìm thấy người dùng") {
          throw new Error(
            "Số điện thoại chưa được đăng ký. Vui lòng đăng ký trước."
          );
        }
        throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra lại.");
      }
      throw error.response?.data?.message || "Lỗi thay đổi mật khẩu";
    }
  };

  const handleSubmitPhone = (e) => {
    e.preventDefault();
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (9-10 số)!");
      return;
    }
    setStep(2);
  };

  const handleConfirmPhone = async () => {
    setIsLoading(true);
    toast.info(`Đang gửi mã xác minh đến +84${phoneNumber}`);

    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA chưa được khởi tạo");
      }

      const formattedPhone = `+84${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      window.confirmationResult = confirmationResult;
      setIsLoading(false);
      setStep(3);
      toast.success("Mã xác minh đã được gửi!");
    } catch (error) {
      console.error("Phone confirmation error:", error);
      let errorMessage = "Không thể gửi mã xác minh. Vui lòng thử lại.";
      if (error.code === "auth/too-many-requests") {
        errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
      } else if (error.code === "auth/invalid-phone-number") {
        errorMessage = "Số điện thoại không hợp lệ.";
      }
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã OTP.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!window.confirmationResult) {
      toast.error("Phiên xác thực không hợp lệ. Vui lòng thử lại từ đầu.");
      setTimeout(() => navigate("/ForgotPasswordPage"), 2000);
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      await changePasswordByPhoneNumber(`+84${phoneNumber}`, newPassword);
      toast.success("Đặt lại mật khẩu thành công!");
      window.confirmationResult = null;
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <h2 className="forgot-title">Khôi phục mật khẩu TeleGo</h2>
      <p className="forgot-subtitle">
        Vui lòng nhập số điện thoại để lấy lại mật khẩu
      </p>

      <div id="recaptcha-container" style={{ marginBottom: "16px" }}></div>

      <div className="forgot-box">
        {step === 1 && (
          <form onSubmit={handleSubmitPhone}>
            <label className="forgot-label">
              Nhập số điện thoại để nhận mã xác thực
            </label>
            <div className="forgot-input-group">
              <span className="forgot-country-code">+84</span>
              <input
                type="tel"
                className="forgot-input"
                placeholder="Số điện thoại"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                maxLength="10"
                required
              />
            </div>
            <button
              type="submit"
              className="forgot-button"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Tiếp tục"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p style={{ marginBottom: "8px" }}>Xác nhận số điện thoại:</p>
            <p style={{ fontWeight: "bold", marginBottom: "16px" }}>
              +84 {phoneNumber}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#444",
                marginBottom: "16px",
              }}
            >
              Mã xác thực sẽ được gửi đến số điện thoại qua tin nhắn hoặc cuộc
              gọi từ TeleGO.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} className="forgot-back-button">
                Thay đổi
              </button>
              <button
                onClick={handleConfirmPhone}
                disabled={isLoading}
                className="forgot-button-1"
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleVerifyCode}>
            <p>Mã kích hoạt đã được gửi đến số điện thoại:</p>
            <p style={{ fontWeight: "bold", margin: "8px 0" }}>
              +84 {phoneNumber}
            </p>

            <div
              className="otp-wrapper"
              onClick={() => document.getElementById("real-otp").focus()}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="otp-char">
                  {otp[i] || ""}
                </div>
              ))}
              <input
                type="text"
                id="real-otp"
                maxLength="6"
                inputMode="numeric"
                pattern="\d{6}"
                autoFocus
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="otp-hidden-input"
              />
            </div>

            <div className="forgot-divider" />

            <div className="forgot-resend">
              Bạn không nhận được mã?{" "}
              <button
                type="button"
                onClick={handleConfirmPhone}
                disabled={isLoading}
              >
                Gửi lại mã
              </button>
            </div>

            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="forgot-input"
              style={{ width: "100%", textAlign: "left" }}
            />
            <div className="forgot-divider" />

            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="forgot-input"
              style={{ width: "100%", textAlign: "left" }}
            />
            <div className="forgot-divider" />

            <button
              type="submit"
              disabled={isLoading}
              className="forgot-button"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận"}
            </button>

            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "12px" }}>
              Bạn sẽ nhận được mã kích hoạt trong 8 giây
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
