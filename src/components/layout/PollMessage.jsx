import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PollModal from './PollModal';// Import modal riêng biệt

const PollMessage = ({ poll, currentUserId, onVoteUpdate }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const userVote = poll.options.findIndex(option => 
      option.votes.includes(currentUserId)
    );
    
    if (userVote !== -1) {
      setSelectedOption(userVote);
      setHasVoted(true);
    }

    const total = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
    setTotalVotes(total);
  }, [poll, currentUserId]);

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleModalVoteUpdate = (updatedPoll, newSelectedOption) => {
    // Cập nhật state local
    if (newSelectedOption !== null) {
      setSelectedOption(newSelectedOption);
      setHasVoted(true);
    } else {
      setSelectedOption(null);
      setHasVoted(false);
    }
    
    const newTotal = updatedPoll.options.reduce(
      (sum, option) => sum + option.votes.length, 0
    );
    setTotalVotes(newTotal);
    
    // Gọi callback cấp trên
    onVoteUpdate && onVoteUpdate(updatedPoll);
  };

  return (
    <div className="poll-message" onClick={openModal}>
      <div className="poll-header">
        <div className="poll-icon">📊</div>
        <div className="poll-title">
          <h4>{poll.question}</h4>
          <span className="poll-info">
            Chọn nhiều phương án • {totalVotes} lượt bình chọn
          </span>
        </div>
      </div>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const voteCount = option.votes.length;
          const percentage = getPercentage(voteCount);
          const userVoted = option.votes.includes(currentUserId);

          return (
            <div 
              key={index}
              className={`poll-option ${userVoted ? 'voted' : ''}`}
            >
              <div className="option-content">
                <span className="option-text">{option.text}</span>
                <span className="vote-count">{voteCount}</span>
              </div>
              
              {hasVoted && (
                <div 
                  className="vote-progress"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {hasVoted && (
                <div className="option-stats">
                  <span className="percentage">{percentage}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-actions">
        {!hasVoted ? (
          <button className="poll-btn primary" onClick={openModal}>Bình chọn</button>
        ) : (
          <button 
            className="poll-btn secondary"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          >
            Hủy bình chọn
          </button>
        )}
        <span className="poll-timestamp">
          {new Date(poll.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })} Hôm nay
        </span>
      </div>

      {/* Sử dụng Modal tách biệt */}
      <PollModal
        isOpen={isModalOpen}
        onClose={closeModal}
        poll={poll}
        currentUserId={currentUserId}
        onVoteUpdate={handleModalVoteUpdate}
        hasVoted={hasVoted}
        selectedOption={selectedOption}
      />

      <style jsx>{`
        .poll-message {
          background: #fff;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 16px;
          margin-left: 280px;
          max-width: 400px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          width: fit-content;
          cursor: pointer;
        }

        .poll-header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .poll-icon {
          font-size: 20px;
          margin-right: 12px;
          margin-top: 2px;
        }

        .poll-title h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1c1e21;
          line-height: 1.3;
        }

        .poll-info {
          font-size: 13px;
          color: #65676b;
          margin-top: 4px;
          display: block;
        }

        .poll-options {
          margin-bottom: 16px;
        }

        .poll-option {
          position: relative;
          background: #f0f2f5;
          border-radius: 8px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .poll-option.clickable:hover {
          background: #e4e6ea;
        }

        .poll-option.voted {
          background: #e3f2fd;
          border: 1px solid #1877f2;
        }

        .option-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          position: relative;
          z-index: 2;
        }

        .option-text {
          font-size: 15px;
          color: #1c1e21;
          font-weight: 500;
        }

        .vote-count {
          font-size: 14px;
          color: #65676b;
          font-weight: 600;
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

        .option-stats {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
        }

        .percentage {
          font-size: 13px;
          color: #1877f2;
          font-weight: 600;
        }

        .poll-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #e1e5e9;
        }

        .poll-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .poll-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        .poll-btn.primary {
          background: #1877f2;
          color: white;
        }

        .poll-btn.primary:hover:not(:disabled) {
          background: #166fe5;
        }

        .poll-btn.secondary {
          background: #e4e6ea;
          color: #1c1e21;
        }

        .poll-btn.secondary:hover {
          background: #d8dadf;
        }

        .poll-timestamp {
          font-size: 12px;
          color: #65676b;
        }
      `}</style>
    </div>
  );
};

export default PollMessage;
