import React from "react";
import PropTypes from "prop-types";

const MemberDetailModal = ({ isOpen, member, onClose }) => {
  if (!isOpen || !member) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <div className="modal-body">
          <div
            className="member-avatar"
            style={{
              backgroundImage: `url(${member.avatar || "/default-avatar.png"})`,
            }}
          />
          <h3>{member.fullName || "Anonymous"}</h3>
          <p>ID: {member._id}</p>
          {member.email && <p>Email: {member.email}</p>}
          {member.phone && <p>Phone: {member.phone}</p>}
          {member.role && <p>Role: {member.role}</p>}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
          max-width: 90%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }

        .modal-body {
          text-align: center;
        }

        .member-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          margin: 0 auto 10px;
          background-color: #eaeaea;
        }

        h3 {
          margin: 10px 0;
          font-size: 20px;
          color: #333;
        }

        p {
          margin: 5px 0;
          color: #555;
        }
      `}</style>
    </div>
  );
};

MemberDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  member: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default MemberDetailModal;
