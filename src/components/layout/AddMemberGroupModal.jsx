import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
const AddMemberGroupModal = ({ isOpen, onClose, currentUserId, groupId }) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([currentUserId]);
  const [friends, setFriends] = useState([]);

  // Lấy danh sách bạn bè khi mở modal
  useEffect(() => {
    if (isOpen && currentUserId) {
      const fetchFriends = async () => {
        try {
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/friends/get-friend/${currentUserId}`
          );
          setFriends(response.data || []);
        } catch (error) {
          console.error("Lỗi khi lấy danh sách bạn bè:", error);
          toast.error("Không thể tải danh sách bạn bè!");
        }
      };
      fetchFriends();
    }
  }, [isOpen, currentUserId]);

  // Lọc bạn bè theo từ khóa tìm kiếm
  const filteredFriends = friends.filter(
    ({ friendInfo }) =>
      (friendInfo.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (friendInfo.phoneNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Xử lý chọn người dùng
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      const newSelected = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      console.log("Người dùng đã chọn:", newSelected);
      return newSelected;
    });
  };

  const handleAddMember = async () => {
    const result = await Swal.fire({
      title: "Thêm thành viên",
      input: "textarea",
      inputLabel: "Nhập danh sách ID thành viên (mỗi ID trên một dòng)",
      inputPlaceholder: "ID thành viên 1\nID thành viên 2\n...",
      showCancelButton: true,
      confirmButtonText: "Thêm",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      const memberIds = result.value
        ?.split("\n")
        .map((id) => id.trim())
        .filter((id) => id); // Loại bỏ các dòng trống

      if (!memberIds || memberIds.length === 0) {
        Swal.fire("Lỗi!", "Danh sách ID thành viên không hợp lệ.", "error");
        return;
      }

      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/add-member",
          {
            groupId: groupId,
            memberIds,
          }
        );

        if (response.status === 200) {
          Swal.fire(
            "Thành công!",
            `Đã thêm ${response.data.addedMembers.length} thành viên.`,
            "success"
          );
          // Cập nhật giao diện nếu cần
        } else {
          Swal.fire(
            "Thất bại!",
            response.data.message || "Không thể thêm thành viên.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error adding members:", error);
        Swal.fire("Lỗi!", "Đã xảy ra lỗi khi thêm thành viên.", "error");
      }
    }
  };

  // Xử lý tạo nhóm

  // Xử lý đóng modal và đặt lại trạng thái
  const resetForm = () => {
    setGroupName("");
    setSearchTerm("");
    setSelectedUsers([]);
  };

  // Xử lý đóng modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Xử lý xóa người dùng khỏi danh sách đã chọn
  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => {
      const newSelected = prev.filter((id) => id !== userId);
      console.log("Người dùng đã chọn sau khi xóa:", newSelected);
      return newSelected;
    });
  };

  // Gỡ lỗi trạng thái nút
  // console.log("Trạng thái nút:", {
  //   groupName,
  //   selectedUsersLength: selectedUsers.length,
  //   isDisabled: !groupName || selectedUsers.length < 2,
  // });

  if (!isOpen) return null;

  return (
    <div className="bg-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>Thêm Thành viên</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Tìm kiếm */}
        <input
          type="text"
          placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {/* Danh sách bạn bè và người đã chọn */}
        <div className="flex flex-1 overflow-hidden">
          {/* Danh sách bạn bè */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-2 font-semibold text-sm">Trò chuyện gần đây</div>
            {filteredFriends.length > 0 ? (
              filteredFriends.map(({ friendInfo }) => (
                <div
                  key={friendInfo._id}
                  className="user-list-item"
                  onClick={() => handleSelectUser(friendInfo._id)}
                >
                  <div
                    className={`custom-checkbox ${
                      selectedUsers.includes(friendInfo._id) ? "checked" : ""
                    }`}
                  >
                    {selectedUsers.includes(friendInfo._id) && (
                      <span className="checkmark">✔</span>
                    )}
                  </div>
                  <img
                    src={friendInfo.avatar || "https://via.placeholder.com/36"}
                    alt={friendInfo.fullName || friendInfo.phoneNumber}
                  />
                  <span>{friendInfo.fullName || friendInfo.phoneNumber}</span>
                </div>
              ))
            ) : (
              <p className="no-results">Không tìm thấy bạn bè</p>
            )}
          </div>

          {/* Danh sách người đã chọn */}
          <div className="ml-4">
            <div
              className={`selected-users ${
                selectedUsers.length === 0 ? "empty" : ""
              }`}
            >
              {selectedUsers.length > 0 && (
                <div className="selected-count">
                  Đã chọn {selectedUsers.length}/100
                </div>
              )}
              {selectedUsers.map((userId) => {
                const user = friends.find(
                  ({ friendInfo }) => friendInfo._id === userId
                )?.friendInfo;
                if (!user) return null;
                return (
                  <div key={user._id} className="selected-user-item">
                    <img
                      src={user.avatar || "https://via.placeholder.com/24"}
                      alt={user.fullName || user.phoneNumber}
                    />
                    <span>{user.fullName || user.phoneNumber}</span>
                    <button onClick={() => handleRemoveUser(user._id)}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="create-button"
            onClick={handleAddMember}
            disabled={!groupName || selectedUsers.length < 2}
          >
            Thêm Thành viên
          </button>
        </div>
      </div>
      <style jsx>
        {`
          .bg-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999; /* Đặt giá trị cao hơn */
          }
        `}
      </style>
    </div>
  );
};

export default AddMemberGroupModal;
