import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/config";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "https://telego-backend.onrender.com/api";

  useEffect(() => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA verified successfully");
          },
          "expired-callback": () => {
            toast.error("reCAPTCHA has expired. Please refresh the page.");
          },
        }
      );
    } catch (error) {
      console.error("reCAPTCHA initialization error:", error);
      toast.error("Không thể khởi tạo xác minh. Vui lòng làm mới trang.");
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const formatPhoneNumber = (phoneNumber) => {
    const numericPhone = phoneNumber.replace(/\D/g, "");
    if (!numericPhone.startsWith("0") && numericPhone.length == 9) {
      return "0" + numericPhone;
    }
    if (numericPhone.startsWith("+84")) {
      return numericPhone.replace("+84", "0");
    }
    if (numericPhone.startsWith("84")) {
      return numericPhone.replace("84", "0");
    }
    if (numericPhone.startsWith("0") && numericPhone.length == 10) {
      return numericPhone;
    }
  };
  const formatPhoneNumberOTP = (phoneNumber) => {
    const numericPhone = phoneNumber.replace(/\D/g, "");
    if (numericPhone.startsWith("0")) {
      return "+84" + numericPhone.substring(1);
    }
    if (numericPhone.startsWith("+84")) {
      return numericPhone;
    }
    if (numericPhone.startsWith("84")) {
      return "+84" + numericPhone.substring(2);
    }
    return "+84" + numericPhone; // Add +84 if it doesn't start with 0, +84, or 84
  };

  const fetchAndStoreUserData = async (phoneNumber) => {
    try {
      let normalizedPhone = phoneNumber;
      const response = await axios.get(
        `${API_BASE_URL}/users/phone/${normalizedPhone}`
      );
      const userData = response.data;
      localStorage.setItem("userId", userData._id);
      localStorage.setItem("phoneNumber", normalizedPhone);
      // Dispatch sự kiện để thông báo rằng userId đã thay đổi
      window.dispatchEvent(new Event("storageChange"));
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      if (error.response && error.response.status === 404) {
        toast.error(
          "Không tìm thấy người dùng với số điện thoại này. Vui lòng đăng ký tài khoản."
        );
        navigate("/RegisterPage");
      } else {
        toast.error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
      }
    }
  };

  const sendOtp = async () => {
    try {
      setLoading(true);
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        toast.error("Số điện thoại không được để trống!");
        setLoading(false);
        return;
      }
      if (!/^(0|\+84|84)?[1-9][0-9]{8,9}$/.test(trimmedPhone)) {
        toast.error(
          "Sai format số điện thoại. VD: 0336784220, +84336784220, 336784220, hoặc 84336784220"
        );
        setLoading(false);
        return;
      }
      toast.info(`Đang gửi mã xác minh đến ${trimmedPhone}`);

      if (!window.recaptchaVerifier) {
        toast.error("Lỗi xác minh reCAPTCHA. Vui lòng làm mới trang.");
        setLoading(false);
        return;
      }

      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = formatPhoneNumberOTP(trimmedPhone);

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );

      window.confirmationResult = confirmationResult;

      setIsOtpSent(true);
      toast.success("Đã gửi mã OTP. Vui lòng kiểm tra tin nhắn của bạn.");
    } catch (error) {
      console.error("OTP error:", error);
      toast.error(
        "Lỗi khi gửi OTP: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      if (!otp) {
        toast.error("Vui lòng nhập mã OTP!");
        setLoading(false);
        return;
      }

      if (!window.confirmationResult) {
        toast.error("Hết thời gian xác thực. Vui lòng yêu cầu mã OTP mới.");
        setLoading(false);
        return;
      }

      const result = await window.confirmationResult.confirm(otp);
      const trimmedPhone = phone.trim();
      await fetchAndStoreUserData(trimmedPhone);

      toast.success("Đăng nhập thành công!");
      navigate("/HomePage");
    } catch (error) {
      console.error("Verification error:", error);
      if (error.code === "auth/invalid-verification-code") {
        toast.error("Mã OTP không đúng! Vui lòng kiểm tra lại.");
      } else if (error.code === "auth/code-expired") {
        toast.error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
      } else {
        toast.error("Xác thực thất bại! Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async () => {
    try {
      setLoading(true);
      const trimmedPhone = phone.trim();

      if (!trimmedPhone) {
        toast.error("Số điện thoại không được để trống!");
        setLoading(false);
        return;
      }
      if (!/^(0|\+84|84)?[1-9][0-9]{8,9}$/.test(trimmedPhone)) {
        toast.error(
          "Sai format số điện thoại. VD: 0336784220, +84336784220, 336784220, hoặc 84336784220"
        );
        setLoading(false);
        return;
      }
      if (!password) {
        toast.error("Mật khẩu không được để trống!");
        setLoading(false);
        return;
      }
      const formattedPhone = formatPhoneNumber(trimmedPhone);

      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        phoneNumber: formattedPhone,
        password,
      });

      await fetchAndStoreUserData(formattedPhone);

      toast.success("Đăng nhập thành công!");
      navigate("/HomePage");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Số điện thoại hoặc mật khẩu không chính xác!");
      } else {
        toast.error("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <ToastContainer position="top-center" />
      <h1 className="text-lg text-primary font-bold mb-4 text-center">
        TeleGO
      </h1>
      <div className="text-x text-dark mb-6 text-center">
        <p>Đăng nhập tài khoản TeleGO</p>
        <p>để kết nối với ứng dụng TeleGO Web</p>
      </div>

      <div className="card">
        <h2 className="text-sl font-semibold text-dark mb-4 text-center">
          {usePassword
            ? "Đăng nhập với số điện thoại và mật khẩu"
            : "Đăng nhập với số điện thoại"}
        </h2>

        <div className="input-group">
          <div className="input-wrapper">
            <span className="input-prefix">
              <i className="icon-phone"></i>
            </span>
            <span className="input-prefix">+84</span>
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="input no-border"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || isOtpSent}
            />
          </div>
        </div>

        {usePassword ? (
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-prefix">
                <i className="icon-lock"></i>
              </span>
              <input
                type="password"
                placeholder="Mật khẩu"
                className="input no-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        ) : isOtpSent ? (
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-prefix">
                <i className="icon-key"></i>
              </span>
              <input
                type="text"
                placeholder="Nhập mã OTP"
                className="input no-border"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        ) : null}

        <div id="recaptcha-container" className="mb-4"></div>

        {usePassword ? (
          <button
            className="btn btn-primary mb-4 w-full"
            onClick={loginWithPassword}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập với mật khẩu"}
          </button>
        ) : isOtpSent ? (
          <div>
            <button
              className="btn btn-primary mb-2 w-full"
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
            </button>
            <button
              className="btn btn-secondary mb-4 w-full"
              onClick={sendOtp}
              disabled={loading}
            >
              Gửi lại mã OTP
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary mb-4 w-full"
            onClick={sendOtp}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        )}

        <p className="text-sm text-primary text-center link mb-4">
          <button
            className="text-xs font-semibold hover:underline text-primary bg-transparent border-none"
            onClick={() => {
              if (!loading) {
                setUsePassword(!usePassword);
                setIsOtpSent(false);
                setOtp("");
              }
            }}
            disabled={loading}
          >
            {usePassword
              ? "Chuyển sang đăng nhập bằng OTP"
              : "Chuyển sang đăng nhập bằng mật khẩu"}
          </button>
        </p>

        {usePassword && (
          <p className="text-sm text-primary text-center link mb-4">
            <a
              href="/ForgotPasswordPage"
              className="text-xs font-semibold hover:underline text-primary"
            >
              Quên mật khẩu
            </a>
          </p>
        )}

        <p className="mt-4 text-xs text-dark text-center">
          Bạn chưa có tài khoản?{" "}
          <a
            href="/RegisterPage"
            className="text-xs font-semibold hover:underline text-center text-primary"
          >
            Đăng ký ngay!
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
