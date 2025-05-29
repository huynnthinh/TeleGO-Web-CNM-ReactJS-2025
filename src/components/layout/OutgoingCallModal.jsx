import React from "react";
import { FaPhone } from "react-icons/fa";

const OutgoingCallModal = ({ isOpen, callee, onCancel }) => {
  if (!isOpen || !callee) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-overlay z-50">
      <div className="bg-blue-500 rounded-lg shadow-lg p-6 w-[455px] h-[530px] text-white flex flex-col justify-between">
        {/* Header với nút đóng */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{callee.name}</h2>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>

        {/* Avatar người nhận */}
        <div className="flex justify-center mb-4">
          <div
            className="avatar"
            style={{
              backgroundImage: `url(${callee.avatar || "/default-avatar.png"})`,
              width: "120px",
              height: "120px",
              backgroundSize: "cover",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Thông tin cuộc gọi */}
        <p className="text-center mb-6 text-xl">TeleGO: Cuộc gọi video đi</p>

        {/* Nút Hủy */}
        <div className="flex justify-center">
          <button
            className="btn btn-large bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center"
            onClick={onCancel}
          >
            <FaPhone className="text-2xl rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
