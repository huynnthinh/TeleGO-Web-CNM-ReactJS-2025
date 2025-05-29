import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTimes } from "react-icons/fa";
import io from "socket.io-client";

const socket = io("https://telego-backend.onrender.com/");

const CreatePollModal = ({
  isOpen,
  onClose,
  userId,
  groupId,
  onPollCreated,
}) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const handleAddOption = () => {
    if (options.length < 20) {
      setOptions([...options, ""]);
    } else {
      Swal.fire("Cảnh báo!", "Tối đa 20 tùy chọn.", "warning");
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      Swal.fire("Cảnh báo!", "Phải có ít nhất 2 tùy chọn.", "warning");
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    if (!isValidObjectId(userId) || (groupId && !isValidObjectId(groupId))) {
      Swal.fire("Lỗi!", "ID người dùng hoặc nhóm không hợp lệ.", "error");
      return;
    }

    if (!question.trim()) {
      Swal.fire("Lỗi!", "Vui lòng nhập câu hỏi.", "error");
      return;
    }

    const formattedOptions = options
      .filter((opt) => opt.trim())
      .map((text) => ({ text, votes: [] }));

    if (formattedOptions.length < 2) {
      Swal.fire("Lỗi!", "Cần ít nhất 2 tùy chọn hợp lệ.", "error");
      return;
    }

    if (options.some((opt, i) => opt.trim() === "" && options.length > 2)) {
      Swal.fire("Lỗi!", "Vui lòng điền hoặc xóa các tùy chọn trống.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "https://telego-backend.onrender.com/api/messages/create-poll",
        {
          from: userId,
          groupId: groupId,
          question: question.trim(),
          options: formattedOptions,
        }
      );

      // Debug: Log poll response
      console.log("Created poll response:", response.data.poll);

      socket.emit("poll-created", {
        groupId: groupId,
        poll: response.data.poll,
      });

      onPollCreated && onPollCreated(response.data.poll);

      Swal.fire(
        "Thành công!",
        "Cuộc khảo sát đã được tạo thành công!",
        "success"
      );

      setQuestion("");
      setOptions(["", ""]);
      onClose();
    } catch (error) {
      console.error(
        "Error creating poll:",
        error.response?.data || error.message
      );
      Swal.fire(
        "Lỗi!",
        error.response?.data?.msg || "Không thể tạo cuộc khảo sát!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (question || options.some((opt) => opt)) {
      Swal.fire({
        title: "Xác nhận",
        text: "Bạn có muốn đóng mà không lưu?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Có",
        cancelButtonText: "Không",
      }).then((result) => {
        if (result.isConfirmed) {
          setQuestion("");
          setOptions(["", ""]);
          onClose();
        }
      });
    } else {
      setQuestion("");
      setOptions(["", ""]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const optionItemHeight = 50;
  const baseModalHeight = 300;
  const maxOptionsForDynamicHeight = 5;
  const optionsHeight =
    options.length <= maxOptionsForDynamicHeight
      ? options.length * optionItemHeight
      : maxOptionsForDynamicHeight * optionItemHeight;
  const modalHeight = baseModalHeight + optionsHeight;

  return (
    <div className="poll-modal-overlay">
      <div className="poll-modal" style={{ height: `${modalHeight}px` }}>
        <div className="poll-modal-header">
          <h2>Tạo Cuộc Khảo Sát</h2>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        <div className="poll-modal-body">
          <div className="form-group">
            <label>Câu hỏi (tối đa 200 ký tự)</label>
            <div className="question-input-wrapper">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={200}
                placeholder="Nhập câu hỏi của bạn"
                className="poll-input question-input"
              />
              <span className="char-counter">{question.length}/200</span>
            </div>
          </div>
          <div className="options-group">
            <label>Tùy chọn</label>
            <div className="options-list">
              {options.map((option, index) => (
                <div key={index} className="option-item">
                  <div className="option-input-wrapper">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      maxLength={100}
                      placeholder={`Tùy chọn ${index + 1}`}
                      className="poll-input"
                    />
                    <span className="char-counter">{option.length}/100</span>
                  </div>
                  {options.length > 2 && (
                    <button
                      className="remove-option-btn"
                      onClick={() => handleRemoveOption(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-option-btn" onClick={handleAddOption}>
              Thêm Tùy Chọn
            </button>
          </div>
        </div>
        <div className="poll-modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="create-button"
            onClick={handleCreatePoll}
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo Cuộc Khảo Sát"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .poll-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1003;
        }

        .poll-modal {
          background: #fff;
          width: 500px;
          max-width: 90%;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          transition: height 0.3s ease;
        }

        .poll-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eaeaea;
        }

        .poll-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
        }

        .poll-modal-body {
          padding: 15px;
          flex: 1;
          overflow-y: auto;
        }

        .form-group,
        .options-group {
          margin-bottom: 20px;
        }

        .form-group label,
        .options-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 5px;
          color: #333;
        }

        .question-input-wrapper,
        .option-input-wrapper {
          position: relative;
        }

        .poll-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .question-input {
          height: 80px;
          resize: none;
          line-height: 1.5;
        }

        .char-counter {
          position: absolute;
          bottom: 8px;
          right: 8px;
          font-size: 12px;
          color: #666;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .options-list {
          max-height: ${maxOptionsForDynamicHeight * optionItemHeight}px;
          overflow-y: ${options.length > maxOptionsForDynamicHeight
            ? "auto"
            : "visible"};
          padding-right: 5px;
        }

        .option-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .option-item .option-input-wrapper {
          flex: 1;
          margin-right: 10px;
        }

        .remove-option-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-option-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
        }

        .add-option-btn:hover {
          background: #0056b3;
        }

        .poll-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 15px;
          border-top: 1px solid #eaeaea;
        }

        .cancel-button,
        .create-button {
          padding: 8px 16px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          margin-left: 10px;
        }

        .cancel-button {
          background-color: #6c757d;
          color: white;
        }

        .create-button {
          background-color: #007bff;
          color: white;
        }

        .create-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .options-list::-webkit-scrollbar {
          width: 6px;
        }

        .options-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .options-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .options-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default CreatePollModal;
