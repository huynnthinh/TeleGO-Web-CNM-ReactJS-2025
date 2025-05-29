import React from "react";

const IncomingCallModal = ({ isOpen, caller, onAccept, onReject }) => {
  if (!isOpen || !caller) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-overlay z-50">
      <div className="bg-blue-500 rounded-lg shadow-lg p-6 w-96 text-white">
        {/* Header với nút đóng */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{caller.name}</h2>
          <button onClick={onReject} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>

        {/* Avatar người gọi */}
        <div className="flex justify-center mb-4">
          <div
            className="avatar"
            style={{
              backgroundImage: `url(${caller.avatar || "/default-avatar.png"})`,
              width: "80px",
              height: "80px",
              backgroundSize: "cover",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Thông tin cuộc gọi */}
        <p className="text-center mb-6">TeleGO: Cuộc gọi video đến</p>

        {/* Nút Nhận và Hủy */}
        <div className="flex justify-center gap-4">
          <button
            className="btn btn-large bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center"
            onClick={onReject}
          >
            <span className="icon icon-call-end text-2xl">📞</span>
          </button>
          <button
            className="btn btn-large bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center"
            onClick={onAccept}
          >
            <span className="icon icon-call text-2xl">📷</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
