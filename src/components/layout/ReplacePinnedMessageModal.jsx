import React from "react";

const ReplacePinnedMessageModal = ({
  show,
  onClose,
  onConfirm,
  messageContent,
}) => {
  if (!show) return null;

  return (
    <div className="rpm-modal">
      <div className="rpm-modal-content">
        <div className="rpm-modal-header">
          <h2>Cập nhật danh sách ghim</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <p className="rpm-modal-message">
          Đã đạt giới hạn 2 ghim. Ghim cũ dưới đây sẽ được bỏ để cập nhật nội
          dung mới.
        </p>
        <div className="rpm-message-preview">
          <span className="rpm-message-icon">💬</span>
          <span className="rpm-message-content">{messageContent}</span>
        </div>
        <div className="rpm-modal-buttons">
          <button onClick={onClose} className="rpm-btn-cancel">
            Hủy
          </button>
          <button onClick={onConfirm} className="rpm-btn-confirm">
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplacePinnedMessageModal;
