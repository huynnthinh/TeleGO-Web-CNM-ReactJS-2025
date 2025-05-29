import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PollModal = ({
  isOpen,
  onClose,
  poll,
  currentUserId,
  onVoteUpdate,
  hasVoted,
  selectedOption,
  avatarMap,
}) => {
  const [modalSelectedOption, setModalSelectedOption] =
    useState(selectedOption);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [showVoteDetails, setShowVoteDetails] = useState(false);
  const [selectedOptionForDetails, setSelectedOptionForDetails] =
    useState(null);
  const [showAllVoters, setShowAllVoters] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [userVotes, setUserVotes] = useState(
    poll?.options?.reduce((acc, option, index) => {
      if (option?.votes?.includes(currentUserId)) {
        acc.push(index);
      }
      return acc;
    }, []) || []
  );
  const [userInfoMap, setUserInfoMap] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Đồng bộ userVotes
  useEffect(() => {
    setUserVotes(
      poll?.options?.reduce((acc, option, index) => {
        if (option?.votes?.includes(currentUserId)) {
          acc.push(index);
        }
        return acc;
      }, []) || []
    );
  }, [poll, currentUserId]);

  // Lấy thông tin người dùng
  useEffect(() => {
    const fetchUserInfo = async (userIds) => {
      setIsLoadingUsers(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const newUserInfo = { ...userInfoMap };

      for (const userId of userIds) {
        if (!newUserInfo[userId] && !avatarMap?.[userId]) {
          try {
            const response = await axios.get(
              `https://telego-backend.onrender.com/api/users/id/${userId}`,
              config
            );
            newUserInfo[userId] = {
              name: response.data.fullName || "Unknown User",
              avatar: response.data.avatar || "/default-avatar.png",
            };
          } catch (error) {
            console.error(
              `Error fetching user ${userId}:`,
              error.response?.data || error.message
            );
            newUserInfo[userId] = {
              name: "Unknown User",
              avatar: "/default-avatar.png",
            };
          }
        }
      }

      setUserInfoMap(newUserInfo);
      setIsLoadingUsers(false);
    };

    // Debug: Kiểm tra poll.createdBy và poll.createdAt
    console.log("Poll data:", {
      createdBy: poll?.createdBy,
      createdAt: poll?.createdAt,
    });

    // Thu thập userId từ votes và createdBy
    const userIds = new Set();
    if (poll?.createdBy) {
      userIds.add(poll.createdBy); // Đảm bảo createdBy luôn được thêm
    }
    poll?.options?.forEach((option) => {
      option.votes?.forEach((userId) => userIds.add(userId));
    });

    // Sử dụng avatarMap nếu có
    if (avatarMap && userIds.size > 0) {
      const newUserInfo = {};
      userIds.forEach((userId) => {
        newUserInfo[userId] = avatarMap[userId] || {
          name: "Unknown User",
          avatar: "/default-avatar.png",
        };
      });
      setUserInfoMap(newUserInfo);
    } else if (userIds.size > 0) {
      fetchUserInfo([...userIds]);
    }
  }, [poll, avatarMap, currentUserId]);

  if (!isOpen || !poll) return null;

  const calculateVoterStats = () => {
    const uniqueVotersMap = new Map();
    let totalVotes = 0;

    if (poll?.options?.length) {
      poll.options.forEach((option) => {
        totalVotes += option.votes?.length || 0;
        option.votes?.forEach((userId) => {
          uniqueVotersMap.set(userId, true);
        });
      });
    }

    const uniqueVoters = uniqueVotersMap.size;
    return { uniqueVoters, totalVotes };
  };

  const { uniqueVoters, totalVotes } = calculateVoterStats();

  const handleVote = async (optionIndex) => {
    if (isVoting) return;
    setIsVoting(true);
    console.log("Bắt đầu vote:", {
      optionIndex,
      pollId: poll._id,
      userId: currentUserId,
    });

    try {
      if (!poll._id || !currentUserId) {
        toast.error("Thiếu ID poll hoặc người dùng!");
        return;
      }

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const isCurrentlyVoted = userVotes.includes(optionIndex);
      let updatedPoll;

      if (isCurrentlyVoted) {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/messages/remove-vote",
          {
            messageId: poll._id,
            userId: currentUserId,
            optionIndex,
          },
          config
        );
        console.log("Remove vote response:", response.data);
        updatedPoll = response.data.poll;
        const newUserVotes = userVotes.filter((vote) => vote !== optionIndex);
        setUserVotes(newUserVotes);
        onVoteUpdate(
          updatedPoll,
          newUserVotes.length > 0 ? newUserVotes[0] : null
        );
        toast.success("Đã hủy bình chọn!");
      } else {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/messages/vote-poll",
          {
            messageId: poll._id,
            userId: currentUserId,
            optionIndex,
          },
          config
        );
        console.log("Vote response:", response.data);
        updatedPoll = response.data.poll;
        const newUserVotes = [...userVotes, optionIndex];
        setUserVotes(newUserVotes);
        onVoteUpdate(updatedPoll, optionIndex);
        toast.success("Đã bình chọn thành công!");
      }
    } catch (error) {
      console.error("Error voting:", error.response?.data || error.message);
      toast.error("Không thể thực hiện bình chọn!");
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) {
      toast.error("Vui lòng nhập nội dung tùy chọn!");
      return;
    }

    try {
      const response = await axios.post(
        "https://telego-backend.onrender.com/api/messages/add-poll-option",
        {
          messageId: poll._id,
          optionText: newOptionText,
        }
      );
      console.log("Add option response:", response.data);

      const updatedPoll = {
        ...poll,
        options: [
          ...poll.options,
          {
            text: newOptionText,
            votes: [],
            _id: response.data.optionId || Date.now(),
          },
        ],
      };

      onVoteUpdate(updatedPoll, modalSelectedOption);
      toast.success("Thêm tùy chọn thành công!");
      setNewOptionText("");
      setIsAddingOption(false);
    } catch (error) {
      console.error(
        "Error adding option:",
        error.response?.data || error.message
      );
      toast.error("Không thể thêm tùy chọn!");
    }
  };

  const handleEndPoll = async () => {
    try {
      const response = await axios.post(
        "https://telego-backend.onrender.com/api/messages/end-poll",
        {
          messageId: poll._id,
        }
      );
      console.log("End poll response:", response.data);

      const updatedPoll = { ...poll, closed: true, isActive: false };
      onVoteUpdate(updatedPoll, modalSelectedOption);
      toast.success("Đã kết thúc poll!");
      onClose();
    } catch (error) {
      console.error(
        "Error ending poll:",
        error.response?.data || error.message
      );
      toast.error("Không thể kết thúc poll!");
    }
  };

  const showVoteDetailsModal = (optionIndex) => {
    setSelectedOptionForDetails(optionIndex);
    setShowVoteDetails(true);
  };

  const getDisplayDate = (dateString) => {
    // Kiểm tra dateString hợp lệ
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return "Không rõ ngày";
    }

    const pollDate = new Date(dateString);
    const today = new Date();

    if (pollDate.toDateString() === today.toDateString()) {
      return "Hôm nay";
    }

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (pollDate.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }

    return pollDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Modal chi tiết bình chọn
  const VoteDetailsModal = () => {
    if (!showVoteDetails || selectedOptionForDetails === null) return null;

    const allOptions =
      poll.options?.map((option, index) => ({
        text: option.text,
        votes: option.votes || [],
        isSelected: index === selectedOptionForDetails,
      })) || [];

    allOptions.sort((a, b) => (b.isSelected ? 1 : 0) - (a.isSelected ? 1 : 0));

    return (
      <div
        className="vote-details-overlay"
        onClick={() => setShowVoteDetails(false)}
      >
        <div
          className="vote-details-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vote-details-header">
            <button
              className="back-button"
              onClick={() => setShowVoteDetails(false)}
            >
              ←
            </button>
            <h3>Chi tiết bình chọn</h3>
            <button
              className="close-button"
              onClick={() => setShowVoteDetails(false)}
            >
              ✕
            </button>
          </div>

          <div className="vote-details-options">
            {allOptions.map((option, optionIdx) => (
              <div key={optionIdx} className="vote-details-option-section">
                <h4 className="option-title">
                  {option.text} ({option.votes.length})
                </h4>

                {option.votes.length > 0 ? (
                  <div className="voters-list">
                    {option.votes.map((userId, userIdx) => (
                      <div key={userIdx} className="voter-item">
                        <div className="voter-avatar">
                          <img
                            src={
                              userInfoMap[userId]?.avatar ||
                              "/default-avatar.png"
                            }
                            alt="Avatar"
                            onError={(e) => {
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        </div>
                        <span className="voter-name">
                          {isLoadingUsers
                            ? "Đang tải..."
                            : userId === currentUserId
                            ? "Bạn"
                            : userInfoMap[userId]?.name || "Unknown User"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-voters">Chưa có người bình chọn</div>
                )}
              </div>
            ))}
          </div>

          <div className="vote-details-footer">
            <button className="settings-button">
              <span className="settings-icon">⚙️</span>
            </button>
            <button
              className="confirm-button"
              onClick={() => setShowVoteDetails(false)}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal hiển thị tất cả người vote
  const AllVotersModal = () => {
    if (!showAllVoters) return null;

    const allOptions =
      poll.options?.map((option) => ({
        text: option.text,
        votes: option.votes || [],
      })) || [];

    return (
      <div
        className="all-voters-overlay"
        onClick={() => setShowAllVoters(false)}
      >
        <div
          className="all-voters-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="all-voters-header">
            <h3>Tất cả người bình chọn</h3>
            <button
              className="close-button"
              onClick={() => setShowAllVoters(false)}
            >
              ✕
            </button>
          </div>

          <div className="all-voters-options">
            {allOptions.map((option, optionIdx) => (
              <div key={optionIdx} className="all-voters-option-section">
                <h4 className="option-title">
                  {option.text} ({option.votes.length})
                </h4>

                {option.votes.length > 0 ? (
                  <div className="voters-list">
                    {option.votes.map((userId, userIdx) => (
                      <div key={userIdx} className="voter-item">
                        <div className="voter-avatar">
                          <img
                            src={
                              userInfoMap[userId]?.avatar ||
                              "/default-avatar.png"
                            }
                            alt="Avatar"
                            onError={(e) => {
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        </div>
                        <span className="voter-name">
                          {isLoadingUsers
                            ? "Đang tải..."
                            : userId === currentUserId
                            ? "Bạn"
                            : userInfoMap[userId]?.name || "Unknown User"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-voters">Chưa có người bình chọn</div>
                )}
              </div>
            ))}
          </div>

          <div className="all-voters-footer">
            <button
              className="confirm-button"
              onClick={() => setShowAllVoters(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="poll-modal-overlay" onClick={onClose}>
        <div
          className="poll-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Bình chọn</h2>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="modal-poll-info">
            <h3>{poll.question}</h3>
            <p className="poll-creator">
              Tạo bởi{" "}
              {isLoadingUsers
                ? "Đang tải..."
                : userInfoMap[poll.createdBy]?.name || "Unknown User"}{" "}
              - {getDisplayDate(poll.createdAt)}
            </p>
            <div className="poll-type-info">
              <span className="type-icon">📋</span>
              Chọn nhiều phương án
            </div>
            <div
              className="poll-voters-info"
              onClick={() => setShowAllVoters(true)}
            >
              <p>
                {uniqueVoters} người bình chọn, {totalVotes} lượt bình chọn ▷
              </p>
            </div>
          </div>

          <div className="poll-options-container">
            {poll.options?.map((option, index) => {
              const voteCount = option.votes?.length || 0;
              const isUserVoted = userVotes.includes(index);
              const percentage =
                totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

              return (
                <div
                  key={index}
                  className={`modal-poll-option ${
                    isUserVoted ? "user-voted" : ""
                  } ${isVoting ? "voting" : ""}`}
                  onClick={() => !poll.closed && !isVoting && handleVote(index)}
                >
                  <div className="option-content">
                    <div className="option-left">
                      <div
                        className={`option-radio ${
                          isUserVoted ? "checked" : ""
                        }`}
                      >
                        <div className="radio-circle"></div>
                      </div>
                      <div className="option-label">
                        {option.text} ({voteCount}){" "}
                        {isVoting ? "(Đang xử lý...)" : ""}
                      </div>
                    </div>

                    <div className="option-right">
                      <div
                        className="option-votes"
                        onClick={(e) => {
                          e.stopPropagation();
                          showVoteDetailsModal(index);
                        }}
                      >
                        {voteCount}
                      </div>
                    </div>
                  </div>

                  {userVotes.length > 0 && (
                    <div
                      className="vote-progress"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="add-option-section">
            {isAddingOption ? (
              <div className="add-option-input">
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="Nhập tùy chọn mới"
                  maxLength={100}
                />
                <button onClick={handleAddOption} className="add-btn">
                  Thêm
                </button>
                <button
                  onClick={() => setIsAddingOption(false)}
                  className="cancel-btn"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingOption(true)}
                className="add-option-btn"
              >
                + Thêm lựa chọn
              </button>
            )}
          </div>

          {poll.closed && (
            <div className="poll-closed-message">
              <span className="lock-icon">🔒</span>
              Bình chọn đã đóng
            </div>
          )}

          <div className="modal-footer">
            <button className="settings-button">
              <span className="settings-icon">⚙️</span>
            </button>

            <div className="footer-buttons">
              {!poll.closed && poll.createdBy === currentUserId && (
                <button className="end-poll-button" onClick={handleEndPoll}>
                  Kết thúc
                </button>
              )}
              <button className="modal-close-button" onClick={onClose}>
                {userVotes.length > 0 ? "Xác nhận" : "Hủy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <VoteDetailsModal />
      <AllVotersModal />

      <style jsx>{`
        .poll-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .poll-modal-content {
          background: #fff;
          border-radius: 8px;
          width: 450px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e4e6eb;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #050505;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #65676b;
          cursor: pointer;
        }

        .modal-poll-info {
          padding: 16px 20px;
          border-bottom: 1px solid #e4e6eb;
        }

        .modal-poll-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #050505;
          margin: 0 0 8px;
        }

        .poll-creator {
          font-size: 14px;
          color: #65676b;
          margin: 0 0 12px;
        }

        .poll-type-info {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #65676b;
          margin-bottom: 8px;
        }

        .type-icon {
          margin-right: 8px;
        }

        .poll-voters-info {
          margin: 10px 0;
          font-size: 14px;
          color: #1877f2;
          cursor: pointer;
        }

        .poll-voters-info:hover {
          text-decoration: underline;
        }

        .poll-options-container {
          padding: 16px 20px;
        }

        .modal-poll-option {
          position: relative;
          background: #f0f2f5;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: background 0.3s ease, border 0.3s ease;
        }

        .modal-poll-option:hover {
          background: #e4e6eb;
        }

        .modal-poll-option.user-voted {
          background: #e7f3ff;
          border: 1px solid #1877f2;
        }

        .modal-poll-option.voting {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .option-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          position: relative;
          z-index: 2;
        }

        .option-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .option-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #65676b;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 12px;
        }

        .option-radio.checked {
          border-color: #1877f2;
        }

        .radio-circle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: transparent;
        }

        .option-radio.checked .radio-circle {
          background: #1877f2;
        }

        .option-label {
          font-size: 15px;
          color: #050505;
        }

        .option-right {
          display: flex;
          align-items: center;
        }

        .option-votes {
          font-size: 14px;
          color: #65676b;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .option-votes:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .vote-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: rgba(24, 119, 242, 0.2);
          transition: width 0.3s ease;
          z-index: 1;
        }

        .add-option-section {
          padding: 16px 20px;
        }

        .add-option-btn {
          padding: 8px 16px;
          background: #e4e6eb;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #1877f2;
          cursor: pointer;
          width: 100%;
        }

        .add-option-btn:hover {
          background: #d8dadf;
        }

        .add-option-input {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .add-option-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .add-btn {
          padding: 8px 16px;
          background: #1877f2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-btn {
          padding: 8px 16px;
          background: #e4e6eb;
          color: #050505;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .poll-closed-message {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: #f0f2f5;
          color: #65676b;
          border-radius: 8px;
          margin: 0 20px 16px;
        }

        .lock-icon {
          margin-right: 8px;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e4e6eb;
        }

        .footer-buttons {
          display: flex;
          gap: 8px;
        }

        .settings-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #65676b;
          cursor: pointer;
          padding: 8px;
        }

        .end-poll-button {
          padding: 8px 16px;
          background: #dc3545;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }

        .end-poll-button:hover {
          background: #c82333;
        }

        .modal-close-button {
          padding: 8px 16px;
          background: #1877f2;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }

        .modal-close-button:hover {
          background: #166fe5;
        }

        .vote-details-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }

        .vote-details-content {
          background: #fff;
          border-radius: 8px;
          width: 400px;
          max-width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .vote-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e4e6eb;
        }

        .back-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #65676b;
          cursor: pointer;
          margin-right: 16px;
        }

        .vote-details-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #050505;
          margin: 0;
          flex: 1;
          text-align: center;
        }

        .vote-details-options {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .vote-details-option-section {
          padding: 16px;
          border-bottom: 1px solid #e4e6eb;
        }

        .option-title {
          font-size: 16px;
          font-weight: 600;
          color: #050505;
          margin: 0 0 16px;
        }

        .voters-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .no-voters {
          color: #65676b;
          font-style: italic;
          font-size: 14px;
        }

        .voter-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .voter-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #f0f2f5;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .voter-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .voter-name {
          font-size: 15px;
          color: #050505;
          font-weight: 500;
        }

        .vote-details-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e4e6eb;
        }

        .confirm-button {
          padding: 8px 16px;
          background: #1877f2;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }

        .confirm-button:hover {
          background: #166fe5;
        }

        .all-voters-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }

        .all-voters-content {
          background: #fff;
          border-radius: 8px;
          width: 400px;
          max-width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .all-voters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e4e6eb;
        }

        .all-voters-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #050505;
          margin: 0;
          flex: 1;
        }

        .all-voters-options {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .all-voters-option-section {
          padding: 16px 20px;
          border-bottom: 1px solid #e4e6eb;
        }

        .all-voters-footer {
          display: flex;
          justify-content: center;
          padding: 16px 20px;
          border-top: 1px solid #e4e6eb;
        }
      `}</style>
    </>
  );
};

export default PollModal;
