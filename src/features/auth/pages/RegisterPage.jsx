import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../../firebase/config";
import axios from "axios";
const RegisterPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Clean up previous recaptcha instance if exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    // Initialize new reCAPTCHA verifier
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "normal", // Changed to normal so it's visible - helps with debugging
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
      // Clean up when component unmounts
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const API_BASE_URL = "https://telego-backend.onrender.com/api";
  const getUserByPhoneNumber = async (phoneNumber) => {
    // let formattedPhoneNumber = phoneNumber;
    // if (phoneNumber.startsWith("0")) {
    //   formattedPhoneNumber = "+84" + phoneNumber.slice(1);
    // } else if (!phoneNumber.startsWith("+84")) {
    //   formattedPhoneNumber = "+84" + phoneNumber; // Nếu không có +84 hoặc 0, thêm +84 vào đầu
    // }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/phone/${phoneNumber}`
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null; // Người dùng không tồn tại, hợp lệ
      }
      console.error(
        `Lỗi khi lấy thông tin người dùng với số điện thoại ${phoneNumber}:`,
        error
      );
      throw error;
    }
  };

  const handleNavigateToLogin = () => {
    navigate("/login");
  };

  const formatPhoneNumber = (phone) => {
    // Strip any non-digit characters
    let digitsOnly = phone.replace(/\D/g, "");

    // If it starts with 0, replace with country code
    if (digitsOnly.startsWith("0")) {
      digitsOnly = digitsOnly.substring(1);
    }

    // If no country code, add +84
    return digitsOnly.startsWith("84") ? `+${digitsOnly}` : `+84${digitsOnly}`;
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const trimmedPhone = phoneNumber.trim();

      if (!trimmedPhone) {
        toast.error("Không được để rỗng!");
        setIsSubmitting(false);
        return;
      }

      // Basic phone format validation
      if (!/^(0|\+84|84)?[1-9][0-9]{8,9}$/.test(trimmedPhone)) {
        toast.error(
          "Sai format số điện thoại. VD: 0336784220, +84336784220, 336784220, hoặc 84336784220"
        );
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        toast.error("Mật khẩu không được để trống");
        setIsSubmitting(false);
        return;
      }

      if (
        !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          password
        )
      ) {
        toast.error("Phải có chữ lớn chữ nhỏ và 8 ký tự trở lên");
        setIsSubmitting(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Mật khẩu không giống!");
        setIsSubmitting(false);
        return;
      }

      // Format phone number correctly
      const formattedPhone = formatPhoneNumber(trimmedPhone);
      const userExists = await getUserByPhoneNumber(trimmedPhone);
      if (userExists) {
        toast.error("Số điện thoại đã tồn tại. Vui lòng thử số khác.");
        setIsSubmitting(false);
        return;
      }
      console.log("Sending OTP to:", formattedPhone);
      toast.info(`Đang gửi mã xác minh đến ${formattedPhone}`);

      // Make sure recaptchaVerifier is initialized
      if (!window.recaptchaVerifier) {
        toast.error("Lỗi xác minh reCAPTCHA. Vui lòng làm mới trang.");
        setIsSubmitting(false);
        return;
      }

      // Get the reCAPTCHA verifier
      const appVerifier = window.recaptchaVerifier;

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );

      // Store confirmationResult in a global variable
      // This is a common pattern when dealing with non-serializable objects
      window.confirmationResult = confirmationResult;

      // Store phone and password in sessionStorage for completion after OTP verification
      sessionStorage.setItem("registerPhone", trimmedPhone);
      sessionStorage.setItem("registerPassword", password);

      // Navigate to OTP verification page with just the phone number
      navigate("/OtpVerificationPage", {
        state: {
          phoneNumber: trimmedPhone,
          password: password,
        },
      });
    } catch (error) {
      console.error("OTP Error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/invalid-phone-number") {
        toast.error("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
      } else if (error.code === "auth/captcha-check-failed") {
        toast.error("Xác minh reCAPTCHA thất bại. Vui lòng làm mới trang.");
      } else {
        toast.error(`Lỗi: ${error.message || "Không thể gửi OTP"}`);
      }

      // Reset reCAPTCHA on failure
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      {/* Logo + Heading */}
      <ToastContainer />
      <h1 className="text-lg text-primary font-bold mb-1">TeleGO</h1>
      <div className="text-sl text-dark mb-6 text-center">
        <p>Tạo tài khoản TeleGO</p>
      </div>

      {/* Registration Form */}
      <div className="card">
        {/* Form Title */}
        <h2 className="text-sl font-semibold text-dark mb-4 text-center">
          Đăng ký tài khoản
        </h2>

        {/* Phone input */}
        <div className="input-group">
          <div className="input-wrapper">
            <span className="input-prefix">+84</span>
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          {/* Phone explanation */}
          <p className="text-xs text-dark mb-0 mt-3">
            Số điện thoại được dùng để đăng nhập
          </p>
        </div>

        {/* Password input */}
        <div className="input-group">
          <div className="input-wrapper">
            <span className="input-prefix">
              <i className="icon-lock"></i>
            </span>
            <input
              type="password"
              placeholder="Mật khẩu"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {/* Password explanation */}
          <p className="text-xs text-dark mt-3 mb-0">
            Mật khẩu có ít nhất 8 kí tự bao gồm ít nhất 1 chữ, một số và một kí
            tự đặc biệt
          </p>
        </div>

        {/* Confirm Password input */}
        <div className="input-group">
          <div className="input-wrapper">
            <span className="input-prefix">
              <i className="icon-lock"></i>
            </span>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {/* reCAPTCHA container - Make it visible */}
        <div
          id="recaptcha-container"
          className="mb-4 flex justify-center"
        ></div>

        {/* Register button */}
        <button
          className="btn btn-primary mb-4"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
        </button>

        {/* Login Link */}
        <p className="text-sm text-primary text-center">
          Đã có tài khoản?{" "}
          <span
            onClick={handleNavigateToLogin}
            className="font-semibold cursor-pointer"
          >
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
