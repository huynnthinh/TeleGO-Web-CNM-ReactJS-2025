import React, { useState } from "react";
import axios from "axios"; // Thêm import axios
import { toast } from "react-toastify"; // Thêm import toast để hiển thị thông báo

const ChangePasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const API_BASE_URL = "https://telego-backend.onrender.com/api";

  // Lấy userId từ localStorage
  const userId = localStorage.getItem("userId");

  // Hàm gọi API đổi mật khẩu
  const changePassword = async (id, lastpassword, newpassword) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/change-password/${id}`,
        {
          lastpassword,
          newpassword,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Lỗi khi thay đổi mật khẩu cho người dùng với ID ${id}:`,
        error
      );
      throw error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu";
    }
  };

  const handleSubmit = async () => {
    // Kiểm tra xem userId có tồn tại không
    if (!userId) {
      toast.error(
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!"
      );
      onClose();
      return;
    }

    // Kiểm tra mật khẩu mới và mật khẩu nhập lại có khớp không
    if (newPassword !== retypePassword) {
      toast.error("Mật khẩu mới và mật khẩu nhập lại không khớp!");
      return;
    }

    // Kiểm tra định dạng mật khẩu mới (đồng bộ với backend)
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Mật khẩu mới phải có ít nhất 8 ký tự, chứa ít nhất 1 số và 1 ký tự đặc biệt (!@#$%^&*)"
      );
      return;
    }

    // Gọi API đổi mật khẩu
    try {
      const result = await changePassword(userId, currentPassword, newPassword);
      toast.success(result.message); // Hiển thị thông báo thành công
      onClose(); // Đóng modal sau khi đổi mật khẩu thành công
    } catch (error) {
      toast.error(error); // Hiển thị thông báo lỗi
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-overlay z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
        {/* Nút đóng */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Tiêu đề */}
        <h2 className="text-md font-semibold text-gray-800 mb-4">
          Thay đổi mật khẩu
        </h2>

        {/* Hướng dẫn */}
        <p className="text-sm text-gray-600 mb-4">
          Mật khẩu của bạn phải có ít nhất 8 ký tự và bao gồm sự kết hợp của số,
          chữ cái và ký tự đặc biệt (!@#$%^&*).
        </p>

        {/* Form đổi mật khẩu */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Nhập lại mật khẩu mới
          </label>
          <input
            type="password"
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {/* Quên mật khẩu */}
        <p className="text-sm text-blue-500 mb-4 cursor-pointer">
          Quên mật khẩu?
        </p>

        {/* Nút Change password */}
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          onClick={handleSubmit}
        >
          Change password
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
