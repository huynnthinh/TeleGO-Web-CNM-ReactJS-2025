import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
const AddGroupModal = ({ isOpen, onClose, currentUserId }) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([currentUserId]);
  const [friends, setFriends] = useState([]);
  const fileInputRef = useRef(null);

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

  const filteredFriends = friends.filter(
    ({ friendInfo }) =>
      (friendInfo.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (friendInfo.phoneNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Ảnh nhóm được chọn:", file);
    }
  };

  const handleGroupNameChange = (e) => {
    const name = e.target.value;
    if (name.length <= 40) {
      setGroupName(name);
    } else {
      const Toast = Swal.mixin({
        toast: true,
        position: "center", // Center the toast
        showConfirmButton: false,
        timer: 3000, // Display for 3 seconds
        background: "rgba(0, 0, 0, 0.7)", // Semi-transparent background
        color: "#ffffff", // White text for contrast
        borderRadius: "12px", // Rounded corners
        padding: "1rem", // Comfortable padding
        didOpen: (toast) => {
          toast.style.backdropFilter = "blur(5px)"; // Add blur effect
          toast.style.border = "1px solid rgba(255, 255, 255, 0.2)"; // Subtle border
        },
      });
      Toast.fire({
        icon: "error",
        title: "Tên nhóm không được vượt quá 40 ký tự.",
      });
    }
  };

  const handleCreateGroup = async () => {
    const formData = new FormData();
    formData.append("groupName", groupName);
    formData.append("groupMembers", JSON.stringify(selectedUsers));
    formData.append("groupAdmin", currentUserId);
    if (fileInputRef.current?.files[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const response = await axios.post(
        "https://telego-backend.onrender.com/api/groups/create-group",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // toast.success("Nhóm đã được tạo thành công!");
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
      toast.error("Không thể tạo nhóm!");
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setGroupName("");
    setSearchTerm("");
    setSelectedUsers([currentUserId]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const getValidationMessage = () => {
    if (!groupName && selectedUsers.length <= 2) {
      return "Vui lòng nhập tên nhóm và chọn ít nhất 2 thành viên.";
    } else if (!groupName) {
      return "Vui lòng nhập tên nhóm.";
    } else if (selectedUsers.length <= 2) {
      return "Vui lòng chọn ít nhất 2 thành viên.";
    }

    if (groupName.trim() === "") {
      return "Tên nhóm không được để trống.";
    }
    return "";
  };

  if (!isOpen) return null;

  return (
    <div className="bg-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Tạo nhóm</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="group-name-input">
          <button onClick={() => fileInputRef.current.click()}>
            <span>📷</span>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleSelectImage}
          />
          <input
            type="text"
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={handleGroupNameChange}
            className="name-input"
          />
        </div>
        <input
          type="text"
          placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="flex flex-1 overflow-hidden">
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
          <div className="ml-4">
            <div
              className={`selected-users ${
                selectedUsers.length === 0 ? "empty" : ""
              }`}
            >
              {selectedUsers.length > 0 && (
                <div className="selected-count">
                  Đã chọn {selectedUsers.length - 1}/100
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
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="create-button"
            onClick={handleCreateGroup}
            disabled={
              !groupName || selectedUsers.length <= 2 || groupName.trim() === ""
            }
          >
            Tạo nhóm
          </button>
        </div>
        {(!groupName ||
          selectedUsers.length <= 2 ||
          groupName.trim() === "") && (
          <p className="text-red-500 text-sm mt-2">{getValidationMessage()}</p>
        )}
      </div>
    </div>
  );
};

export default AddGroupModal;
