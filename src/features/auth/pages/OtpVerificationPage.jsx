import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
// import { createUser } from "../../../api/services/userService"; // Adjusted import path

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Retrieve phone number and password from route state or sessionStorage
    const phone =
      location.state?.phoneNumber || sessionStorage.getItem("registerPhone");
    const passwordStore =
      location.state?.password || sessionStorage.getItem("registerPassword");

    if (phone && passwordStore) {
      setPhoneNumber(phone);
      setPassword(passwordStore);
    } else {
      toast.error("Không tìm thấy thông tin số điện thoại hoặc mật khẩu.");
      setTimeout(() => navigate("/register"), 2000);
      return;
    }

    // Check if Firebase confirmationResult is available
    if (!window.confirmationResult) {
      toast.error("Phiên xác thực đã hết hạn. Vui lòng thử lại.");
      setTimeout(() => navigate("/register"), 2000);
    }
  }, [location.state, navigate]);

  const API_BASE_URL = "https://telego-backend.onrender.com/api";

  const createUser = async (userData) => {
    try {
      console.log("userData nhận được:", userData);

      const response = await axios.post(`${API_BASE_URL}/users`, {
        phoneNumber: userData.phoneNumber,
        password: userData.password,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo người dùng:", error);
      throw error;
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã OTP.");
      return;
    }

    if (!window.confirmationResult) {
      toast.error("Phiên xác thực không hợp lệ. Vui lòng thử lại.");
      setTimeout(() => navigate("/register"), 2000);
      return;
    }

    setIsVerifying(true);

    try {
      // Verify OTP with Firebase
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      console.log("OTP verified successfully:", user);
      toast.success("Xác thực OTP thành công!");

      // Create user in backend
      const response = await createUser({
        phoneNumber,
        password,
      });
      console.log("User created:", response);

      // Cleanup and redirect
      window.confirmationResult = null;
      // sessionStorage.removeItem("registerPhone");
      sessionStorage.removeItem("registerPassword");
      setTimeout(() => navigate("/createProfile"), 1500);
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error.code === "auth/invalid-verification-code"
          ? "Mã OTP không hợp lệ."
          : "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = () => {
    toast.info("Đang chuyển hướng để gửi lại mã OTP...");
    setTimeout(() => navigate("/register"), 1500);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-lg text-primary font-bold mb-1 text-center">
        TeleGO
      </h1>
      <div className="text-sl text-dark mb-6 text-center">
        <p>Xác thực tài khoản TeleGO</p>
      </div>

      <div className="card bg-white shadow-md rounded-lg p-6">
        <h2 className="text-sl font-semibold text-dark mb-4 text-center">
          Xác thực OTP
        </h2>

        <p className="text-sm text-dark text-center mb-3">
          Nhập mã OTP đã được gửi đến số{" "}
          <strong>{phoneNumber || "Không xác định"}</strong>
        </p>

        <div className="input-group mb-4">
          <input
            type="text"
            placeholder="Mã OTP"
            className="input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isVerifying}
          />
        </div>

        <button
          className="btn btn-primary w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          onClick={handleVerifyOtp}
          disabled={isVerifying}
        >
          {isVerifying ? "Đang xác thực..." : "Xác nhận OTP"}
        </button>

        <p className="text-sm text-center mt-4">
          Không nhận được mã?{" "}
          <span
            onClick={handleResendOtp}
            className="text-primary font-semibold cursor-pointer hover:underline"
          >
            Gửi lại mã OTP
          </span>
        </p>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
