import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FaBell,
  FaUserPlus,
  FaThumbtack,
  FaSignOutAlt,
  FaClock,
  FaUserMinus,
  FaMars,
  FaVenus,
  FaPhoneAlt,
  FaEnvelope,
  FaUserCircle,
  FaImage,
  FaVideo,
  FaFile,
  FaUserFriends,
  FaCamera,
  FaPen,
  FaPoll,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { io } from "socket.io-client";
import Swal from "sweetalert2";
import CreatePollModal from "./CreatePollModal";
// const socket = io("http://192.168.2.247:5000");

// AddMemberGroupModal Component
const AddMemberGroupModal = ({
  isOpen,
  onClose,
  currentUserId,
  groupId,
  data,
  updateMembers,
}) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  useEffect(() => {
    onClose();
  }, [groupId]);
  useEffect(() => {
    if (isOpen && currentUserId) {
      const fetchFriends = async () => {
        try {
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/friends/get-friend/${currentUserId}`
          );
          const filteredFriends = response.data.filter(
            (newFriend) =>
              !data.members.some(
                (member) => member._id === newFriend.friendInfo._id
              )
          );
          setFriends(filteredFriends);
        } catch (error) {
          console.error("Error fetching friends:", error);
          toast.error("Unable to load friends list!");
        }
      };
      fetchFriends();
    }
  }, [isOpen, currentUserId, data]);

  const filteredFriends = friends.filter(
    ({ friendInfo }) =>
      (friendInfo.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (friendInfo.phoneNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    console.log("Selected Users Updated:", selectedUsers);
  }, [selectedUsers]);

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMember = async () => {
    const result = await Swal.fire({
      title: "THÊM THÀNH VIÊN",
      text: "Bạn có chắc chắn muốn thêm thành viên này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, thêm thành viên này",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/add-member",
          {
            groupId: groupId,
            memberIds: selectedUsers,
          }
        );

        if (response.status === 200) {
          Swal.fire(
            "Success!",
            `Added ${response.data.addedMembers.length} members.`,
            "success"
          );
          // Lấy thông tin thành viên mới
          const newMemberIds = response.data.addedMembers; // Giả sử server trả về mảng ID thành viên mới
          const newMembers = await Promise.all(
            newMemberIds.map(async (id) => {
              const memberResponse = await axios.get(
                `https://telego-backend.onrender.com/api/users/id/${id}`
              );
              return {
                _id: id,
                fullName: memberResponse.data.fullName || "Anonymous",
                avatar: memberResponse.data.avatar || "/default-avatar.png",
              };
            })
          );

          // Gọi hàm updateMembers để cập nhật danh sách
          updateMembers(newMembers);
          onClose();
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to add members.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error adding members:", error);
        Swal.fire("Error!", "Người này đã có trong nhóm!", "error");
      }
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSearchTerm("");
    setSelectedUsers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="group-info-panel add-member-modal open">
      <div className="group-info-header">
        <h2>Add Members</h2>
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="group-info-body">
        <input
          type="text"
          placeholder="Enter name, phone number, or phone number list"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mb-2 font-semibold text-sm">Recent Chats</div>
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
              <p className="no-results">No friends found</p>
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
                  Selected {selectedUsers.length}/100
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
            Cancel
          </button>
          <button
            className="create-button"
            onClick={handleAddMember}
            disabled={selectedUsers.length < 1}
          >
            Add Members
          </button>
        </div>
      </div>
    </div>
  );
};

// MemberDetailsModal Component
const MemberDetailsModal = ({
  isOpen,
  onClose,
  member,
  currentUserId,
  groupId,
  isAdmin,
}) => {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  useEffect(() => {
    onClose();
  }, [groupId]);
  useEffect(() => {
    if (isOpen && member?._id) {
      const fetchMemberDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/users/id/${member._id}`
          );
          setMemberData(response.data);
        } catch (err) {
          console.error("Error fetching member details:", err);
          setError("Failed to load member details.");
        } finally {
          setLoading(false);
        }
      };

      const fetchFriendshipStatus = async () => {
        setFriendshipLoading(true);
        try {
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/friends/get-friend/${currentUserId}`
          );
          const isAlreadyFriend = response.data.some(
            (friend) => friend.friendInfo._id === member._id
          );
          setIsFriend(isAlreadyFriend);
        } catch (err) {
          console.error("Error fetching friendship status:", err);
          setError("Failed to load friendship status.");
        } finally {
          setFriendshipLoading(false);
        }
      };

      fetchMemberDetails();
      fetchFriendshipStatus();
    }
  }, [isOpen, member?._id, currentUserId]);

  useEffect(() => {
    if (!isOpen) {
      onClose();
    }
  }, [groupId, onClose]);

  const handleAddFriend = async () => {
    const result = await Swal.fire({
      title: "Add Friend",
      text: `Are you sure you want to send a friend request to ${
        member.fullName || "this member"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Send Request",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/friends/add-friend",
          {
            idUser1: currentUserId,
            idUser2: member._id,
          }
        );

        if (response.status === 200) {
          Swal.fire("Success!", "Friend request sent.", "success");
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to send friend request.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
        Swal.fire("Error!", "Friend request already sent.", "error");
      }
    }
  };

  const handleTransferAdmin = async () => {
    const result = await Swal.fire({
      title: "Transfer Admin Role",
      text: `Are you sure you want to transfer the admin role to ${
        member.fullName || "this member"
      }?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Transfer",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/change-admin",
          {
            groupId,
            newAdminId: member._id,
            adminId: currentUserId,
          }
        );

        if (response.status === 200) {
          Swal.fire("Success!", "Admin role transferred.", "success");
          // window.location.reload();
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to transfer admin role.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error transferring admin:", error);
        Swal.fire("Error!", "An error occurred.", "error");
      }
    }
  };

  const handleRemoveMember = async () => {
    const result = await Swal.fire({
      title: "Remove Member",
      text: `Are you sure you want to remove ${
        member.fullName || "this member"
      } from the group?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/remove-member",
          {
            groupId,
            memberIds: [member._id],
            requesterId: currentUserId,
          }
        );

        if (response.status === 200) {
          Swal.fire("Success!", "Member removed from group.", "success");
          onClose();
          // window.location.reload();
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to remove member.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error removing member:", error);
        Swal.fire("Error!", "An error occurred.", "error");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="group-info-panel member-details-modal open">
      <div className="group-info-header">
        <h2>Member Details</h2>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="group-info-body">
        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">Error: {error}</p>}
        {memberData && (
          <div className="member-details">
            <div className="group-avatar">
              <div
                className="avatar-img"
                style={{
                  backgroundImage: `url(${
                    memberData.avatar || "/default-avatar.png"
                  })`,
                }}
              />
              <h3>{memberData.fullName || "No name"}</h3>
            </div>
            <div className="user-details">
              <div className="user-detail-item">
                <FaPhoneAlt className="detail-icon" />
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{memberData.phoneNumber}</span>
              </div>
              {memberData.email && (
                <div className="user-detail-item">
                  <FaEnvelope className="detail-icon" />
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{memberData.email}</span>
                </div>
              )}
              {memberData.gender && (
                <div className="user-detail-item">
                  {memberData.gender.toLowerCase() === "male" ? (
                    <FaMars className="detail-icon gender-male" />
                  ) : memberData.gender.toLowerCase() === "female" ? (
                    <FaVenus className="detail-icon gender-female" />
                  ) : (
                    <FaUserCircle className="detail-icon" />
                  )}
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">
                    {memberData.gender === "male"
                      ? "Lẩu Gà Bình Thuận"
                      : "Ô Môi"}
                  </span>
                </div>
              )}
              {memberData.status && (
                <div className="user-detail-item">
                  <span
                    style={{
                      backgroundColor:
                        memberData.status === "online" ? "green" : "gray",
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      marginRight: "15px",
                    }}
                  />
                  <span className="detail-value">
                    {memberData.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              )}
              <div className="user-detail-item">
                <FaUserFriends className="detail-icon" />
                <span className="detail-label">Friendship:</span>
                {friendshipLoading ? (
                  <span className="detail-value">Loading...</span>
                ) : isFriend ? (
                  <span className="detail-value">Friends</span>
                ) : (
                  <button
                    className="add-friend-btn"
                    onClick={handleAddFriend}
                    disabled={friendshipLoading}
                  >
                    <FaUserPlus className="action-icon" />
                    Add Friend
                  </button>
                )}
              </div>
            </div>
            {isAdmin && member._id !== currentUserId && (
              <div className="admin-actions">
                <div
                  className="action-item single leave"
                  onClick={handleTransferAdmin}
                >
                  <FaUserPlus className="action-icon" />
                  <span>Chuyển đổi quyền</span>
                </div>
                <div
                  className="action-item single leave"
                  onClick={handleRemoveMember}
                >
                  <FaSignOutAlt className="action-icon" />
                  <span>Xóa khỏi nhóm</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// MediaGallery Component
const MediaGallery = ({ groupId, userId, isGroup }) => {
  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
    gifs: [],
    others: [],
  });
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMediaFiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const requestBody = isGroup
          ? { from: userId, groupId: groupId }
          : { from: userId, to: groupId };

        const response = await axios.post(
          "https://telego-backend.onrender.com/api/messages/getmsg",
          requestBody
        );

        const images = [];
        const videos = [];
        const gifs = [];
        const others = [];

        response.data.forEach((message) => {
          if (message.fileUrls && message.fileUrls.length > 0) {
            message.fileUrls.forEach((url, index) => {
              const fileType = message.fileTypes[index] || "";
              const fileInfo = {
                url: url,
                type: fileType,
                messageId: message._id,
                timestamp: message.createdAt,
                sender: message.sender,
              };

              if (fileType.startsWith("image/")) {
                if (fileType === "image/gif") {
                  gifs.push(fileInfo);
                } else {
                  images.push(fileInfo);
                }
              } else if (fileType.startsWith("video/")) {
                videos.push(fileInfo);
              } else if (url) {
                others.push(fileInfo);
              }
            });
          }
        });

        setMediaFiles({
          images: images.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          ),
          videos: videos.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          ),
          gifs: gifs.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          ),
          others: others.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          ),
        });
      } catch (err) {
        console.error("Failed to fetch media:", err);
        setError("Unable to load media data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (groupId && userId) {
      fetchMediaFiles();
    }
  }, [groupId, userId, isGroup]);

  const renderMediaItem = (item) => {
    if (item.type.startsWith("image/")) {
      return (
        <div className="media-item" key={`${item.messageId}-${item.url}`}>
          <img src={item.url} alt="Media content" />
        </div>
      );
    } else if (item.type.startsWith("video/")) {
      return (
        <div className="media-item" key={`${item.messageId}-${item.url}`}>
          <video controls>
            <source src={item.url} type={item.type} />
            Your browser does not support video playback.
          </video>
        </div>
      );
    } else {
      return (
        <div
          className="media-item file-item"
          key={`${item.messageId}-${item.url}`}
        >
          <FaFile size={30} />
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.url.split("/").pop().substring(0, 15)}...
          </a>
        </div>
      );
    }
  };

  const getActiveFiles = () => {
    switch (activeTab) {
      case "images":
        return mediaFiles.images;
      case "videos":
        return mediaFiles.videos;
      case "gifs":
        return mediaFiles.gifs;
      case "others":
        return mediaFiles.others;
      default:
        return [];
    }
  };

  return (
    <div className="media-gallery">
      <h4 className="gallery-title">Media Gallery</h4>
      <div className="media-tabs">
        <button
          className={`tab-btn ${activeTab === "images" ? "active" : ""}`}
          onClick={() => setActiveTab("images")}
        >
          <FaImage /> Images ({mediaFiles.images.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          <FaVideo /> Videos ({mediaFiles.videos.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "gifs" ? "active" : ""}`}
          onClick={() => setActiveTab("gifs")}
        >
          GIFs ({mediaFiles.gifs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "others" ? "active" : ""}`}
          onClick={() => setActiveTab("others")}
        >
          <FaFile /> Others ({mediaFiles.others.length})
        </button>
      </div>
      <div className="media-content">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : getActiveFiles().length === 0 ? (
          <div className="empty-state">No {activeTab} shared</div>
        ) : (
          <div className="media-grid">
            {getActiveFiles().map(renderMediaItem)}
          </div>
        )}
      </div>
    </div>
  );
};

// GroupInfoPanel Component
const GroupInfoPanel = ({
  isOpen,
  onClose,
  groupInfo,
  currentUserId,
  isGroup,
  socket,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isMemberDetailsModalOpen, setIsMemberDetailsModalOpen] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const fileInputRef = useRef(null);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
  const updateMembers = (newMembers) => {
    setData((prev) => ({
      ...prev,
      members: [...prev.members, ...newMembers],
    }));
  };
  useEffect(
    () => {
      if (!groupInfo || !groupInfo.id) {
        console.warn("groupInfo or groupInfo.id is missing, skipping effect");
        return;
      }
      // if (!groupInfo?.id) return;
      // if (isOpen && groupInfo?.id) {
      // Tham gia phòng nhóm
      // socket.emit("joinGroup", groupInfo.id);

      // Lắng nghe các sự kiện từ server
      // socket.on(
      //   "groupMemberAdded",
      //   async ({ groupId, groupName, addedMemberId }) => {
      //     console.log("Group Member Added:", groupId, groupName, addedMemberId);
      //     try {
      //       // Sửa từ [addedMemberId].map thành addedMemberId.map
      //       const responses = await Promise.all(
      //         addedMemberId.map((id) =>
      //           axios.get(`https://telego-backend.onrender.com/api/users/id/${id}`)
      //         )
      //       );
      //       const newMembers = responses.map((response) => ({
      //         _id: response.data._id,
      //         fullName: response.data.fullName || "Anonymous",
      //         avatar: response.data.avatar || "/default-avatar.png",
      //       }));
      //       setData((prev) => ({
      //         ...prev,
      //         members: [...prev.members, ...newMembers],
      //       }));
      //     } catch (error) {
      //       console.error("Error fetching new member details:", error);
      //       toast.error("Failed to fetch new member details.");
      //     }
      //   }
      // );

      socket.on("groupRenamed", async ({ groupId, newName, message }) => {
        toast.success(`Group renamed to ${newName}`);
        console.log("Group Renamed:", groupId, newName);
        try {
          // Gọi API để lấy thông tin chi tiết của nhóm
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/groups/id/${groupId}`
          );
          const memberDetails = await Promise.all(
            response.data.groupMembers.map(async (memberId) => {
              try {
                const memberResponse = await axios.get(
                  `https://telego-backend.onrender.com/api/users/id/${memberId}`
                );
                return {
                  _id: memberId,
                  fullName: memberResponse.data?.fullName || "Anonymous",
                  avatar: memberResponse.data?.avatar || "/default-avatar.png",
                };
              } catch (err) {
                console.error(`Failed to fetch member ${memberId}:`, err);
                return {
                  _id: memberId,
                  fullName: "Anonymous",
                  avatar: "/default-avatar.png",
                };
              }
            })
          );
          if (response.status === 200) {
            const groupData = response.data;
            // Cập nhật dữ liệu nhóm
            setData({
              type: "group",
              avatar: groupData.avatar,
              name: groupData.groupName,
              members: memberDetails,
              admin: groupData.groupAdmin,
              createdAt: groupData.createdAt,
              deputies: groupData.groupDeputy || [],
            });
          } else {
            toast.error("Failed to fetch updated group details.");
          }
        } catch (error) {
          console.error("Error fetching group details:", error);
          toast.error("An error occurred while fetching group details.");
        }
      });

      socket.on("avatarUpdated", async ({ groupId, avatar }) => {
        toast.success("Đã cập nhật avatar nhóm!");

        try {
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/groups/id/${groupId}`
          );
          const groupData = response.data;
          console.log("GROUP:", groupData);
          const memberDetails = await Promise.all(
            groupData.groupMembers.map(async (memberId) => {
              try {
                const memberResponse = await axios.get(
                  `https://telego-backend.onrender.com/api/users/id/${memberId}`
                );
                return {
                  _id: memberId,
                  fullName: memberResponse.data?.fullName || "Ẩn danh",
                  avatar: memberResponse.data?.avatar || "/default-avatar.png",
                };
              } catch (err) {
                console.error(
                  `Không thể lấy thông tin thành viên ${memberId}:`,
                  err
                );
                return {
                  _id: memberId,
                  fullName: "Ẩn danh",
                  avatar: "/default-avatar.png",
                };
              }
            })
          );

          setData({
            type: "group",
            avatar: groupData.avatar,
            name: groupData.groupName,
            members: memberDetails,
            admin: groupData.groupAdmin,
            createdAt: groupData.createdAt,
            deputies: groupData.groupDeputy || [],
          });
        } catch (error) {
          console.error("Lỗi khi lấy thông tin nhóm:", error);
          toast.error("Không thể lấy thông tin nhóm.");
        }
      });

      socket.on("memberLeft", async ({ groupId, memberId }) => {
        try {
          //gọi api để lấy thông tin memberId
          const memberResponse = await axios.get(
            `https://telego-backend.onrender.com/api/users/id/${memberId}`
          );
          const memberData = memberResponse.data;
          //thông báo tên member đã rời
          toast.success(`${memberData.fullName} đã rời khỏi nhóm`);
          const response = await axios.get(
            `https://telego-backend.onrender.com/api/groups/id/${groupId}`
          );
          const groupData = response.data;
          const memberDetails = await Promise.all(
            groupData.groupMembers.map(async (memberId) => {
              try {
                const memberResponse = await axios.get(
                  `https://telego-backend.onrender.com/api/users/id/${memberId}`
                );
                return {
                  _id: memberId,
                  fullName: memberResponse.data?.fullName || "Ẩn danh",
                  avatar: memberResponse.data?.avatar || "/default-avatar.png",
                };
              } catch (err) {
                console.error(
                  `Không thể lấy thông tin thành viên ${memberId}:`,
                  err
                );
                return {
                  _id: memberId,
                  fullName: "Ẩn danh",
                  avatar: "/default-avatar.png",
                };
              }
            })
          );

          setData({
            type: "group",
            avatar: groupData.avatar,
            name: groupData.groupName,
            members: memberDetails,
            admin: groupData.groupAdmin,
            createdAt: groupData.createdAt,
            deputies: groupData.groupDeputy || [],
          });
        } catch (error) {
          console.error("Lỗi khi lấy thông tin nhóm:", error);
          toast.error("Không thể lấy thông tin nhóm.");
        }
      });

      socket.on(
        "groupUpdated",
        async ({ groupId, groupName, addedMembers }) => {
          console.log("Group Updated:", { groupId, groupName, addedMembers });

          try {
            // Gọi API để lấy thông tin chi tiết của nhóm
            const response = await axios.get(
              `https://telego-backend.onrender.com/api/groups/id/${groupId}`
            );

            const memberDetails = await Promise.all(
              response.data.groupMembers.map(async (memberId) => {
                try {
                  const memberResponse = await axios.get(
                    `https://telego-backend.onrender.com/api/users/id/${memberId}`
                  );
                  return {
                    _id: memberId,
                    fullName: memberResponse.data?.fullName || "Anonymous",
                    avatar:
                      memberResponse.data?.avatar || "/default-avatar.png",
                  };
                } catch (err) {
                  console.error(`Failed to fetch member ${memberId}:`, err);
                  return {
                    _id: memberId,
                    fullName: "Anonymous",
                    avatar: "/default-avatar.png",
                  };
                }
              })
            );

            // Cập nhật dữ liệu nhóm
            setData({
              type: "group",
              avatar: response.data.avatar,
              name: response.data.groupName,
              members: memberDetails,
              admin: response.data.groupAdmin,
              createdAt: response.data.createdAt,
              deputies: response.data.groupDeputy || [],
            });

            // toast.success(`Group "${groupName}" updated successfully!`);
          } catch (error) {
            console.error("Error fetching group details:", error);
            toast.error("Failed to update group details.");
          }
        }
      );
      // Dọn dẹp khi component unmount hoặc panel đóng
      return () => {
        socket.off("groupMemberAdded");
        socket.off("groupRenamed");
        socket.off("avatarUpdated");
        socket.off("memberLeft");
        socket.off("groupUpdated");
      };
    },
    // }
    [groupInfo]
  );
  const handleOpenAddMemberModal = () => {
    setIsAddMemberModalOpen(true);
  };

  const handleCloseAddMemberModal = () => {
    setIsAddMemberModalOpen(false);
  };

  const handleOpenMemberDetailsModal = (member) => {
    if (member._id !== currentUserId) {
      setSelectedMember(member);
      setIsMemberDetailsModalOpen(true);
    }
  };

  const handleCloseMemberDetailsModal = () => {
    setSelectedMember(null);
    setIsMemberDetailsModalOpen(false);
  };

  const handleChangeAvatar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Error!", "Please select an image file.", "error");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire("Error!", "Image size must be less than 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);

    const result = await Swal.fire({
      title: "Change Group Avatar",
      text: "Are you sure you want to update the group avatar?",
      imageUrl: previewImage || URL.createObjectURL(file),
      imageWidth: 100,
      imageHeight: 100,
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Upload",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      setPreviewImage(null);
      fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("groupId", groupInfo.id);

    try {
      setUploading(true);
      const response = await axios.put(
        "https://telego-backend.onrender.com/api/groups/update-avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        Swal.fire("Success!", "Group avatar updated.", "success");
        setData((prev) => ({
          ...prev,
          avatar: response.data.group.avatar,
        }));
        console.log("Gì vậy: ", response.data);
        socket.emit("updateGroupAvatar", {
          groupId: groupInfo.id,
          avatar: response.data.group.avatar,
        });
      } else {
        Swal.fire(
          "Failed!",
          response.data.message || "Unable to update avatar.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message ||
          "An error occurred while updating avatar.",
        "error"
      );
    } finally {
      setUploading(false);
      setPreviewImage(null);
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleRenameGroup = async () => {
    const result = await Swal.fire({
      title: "Rename Group",
      text: "Enter the new group name:",
      input: "text",
      inputValue: data.name,
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Group name cannot be empty!";
        }
        if (value.length > 50) {
          return "Group name cannot exceed 50 characters!";
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setRenaming(true);
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/rename-group",
          {
            groupId: groupInfo.id,
            idMember: currentUserId,
            newName: result.value,
          }
        );

        if (response.status === 200) {
          Swal.fire("Success!", "Group name updated.", "success");
          socket.emit("renameGroup", {
            groupId: groupInfo.id,
            newName: result.value,
          });
          setData((prev) => ({
            ...prev,
            name: response.data.groupName,
          }));
          setData((prev) => ({
            ...prev,
            name: response.data.groupName,
          }));
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to rename group.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error renaming group:", error);
        Swal.fire(
          "Error!",
          error.response?.data?.message ||
            "An error occurred while renaming group.",
          "error"
        );
      } finally {
        setRenaming(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!groupInfo?.id) return;

      setLoading(true);
      setError(null);

      try {
        const endpoint = isGroup
          ? `https://telego-backend.onrender.com/api/groups/id/${groupInfo.id}`
          : `https://telego-backend.onrender.com/api/users/id/${groupInfo.id}`;

        const response = await axios.get(endpoint);
        if (!response.data) {
          throw new Error("No data received from server");
        }

        if (isMounted) {
          if (isGroup) {
            const memberDetails = await Promise.all(
              response.data.groupMembers.map(async (memberId) => {
                try {
                  const memberResponse = await axios.get(
                    `https://telego-backend.onrender.com/api/users/id/${memberId}`
                  );
                  return {
                    _id: memberId,
                    fullName: memberResponse.data?.fullName || "Anonymous",
                    avatar:
                      memberResponse.data?.avatar || "/default-avatar.png",
                  };
                } catch (err) {
                  console.error(`Failed to fetch member ${memberId}:`, err);
                  return {
                    _id: memberId,
                    fullName: "Anonymous",
                    avatar: "/default-avatar.png",
                  };
                }
              })
            );

            setData({
              type: "group",
              avatar: response.data.avatar,
              name: response.data.groupName,
              members: memberDetails,
              admin: response.data.groupAdmin,
              createdAt: response.data.createdAt,
              deputies: response.data.groupDeputy || [],
            });
          } else {
            setData({
              type: "user",
              avatar: response.data.avatar,
              name: response.data.fullName,
              phone: response.data.phoneNumber,
              email: response.data.email,
              gender: response.data.gender,
              status: response.data.status,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to fetch data");
          console.error("Fetch error:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [groupInfo?.id, isGroup]);

  const handleRemoveFriend = async () => {
    const result = await Swal.fire({
      title: "Confirm Removal",
      text: "Are you sure you want to remove this friend?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/friends/unfriend-friend",
          {
            idUser1: currentUserId,
            idUser2: groupInfo.id,
          }
        );

        if (response.status === 200) {
          // dùng swal để thông báo thành công
          Swal.fire("Success!", "Friend removed successfully.", "success");
          // window.location.reload();
        } else {
          // dùng swal để thông báo thất bại
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to remove friend.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error removing friend:", error);
        Swal.fire("Error!", "Không còn là bạn.", "error");
      }
    }
  };

  const handleLeaveGroup = async (groupId, memberId) => {
    const result = await Swal.fire({
      title: "Confirm Leave",
      text: "Are you sure you want to leave this group?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Leave",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          "https://telego-backend.onrender.com/api/groups/leave-group",
          {
            groupId,
            memberId,
          }
        );

        if (response.status === 200) {
          Swal.fire("Success!", "You have left the group.", "success");
          socket.emit("leaveGroup", {
            groupId: groupInfo.id,
            memberId: currentUserId,
          });
          window.location.reload();
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to leave group.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error leaving group:", error);
        Swal.fire("ADMIN CANNOT LEAVE GROUP!", "An error occurred.", "error");
      }
    }
  };

  const handleDeleteAllMessages = async (
    userId,
    toUserId = null,
    groupId = null
  ) => {
    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete chat history?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const requestBody = {
          userId,
          ...(toUserId && { toUserId }),
          ...(groupId && { groupId }),
        };

        const response = await axios.post(
          "https://telego-backend.onrender.com/api/messages/delete-all-messages-for-me",
          requestBody
        );

        if (response.status === 200) {
          let countdown = 3; // Start countdown from 3 seconds
          const Toast = Swal.mixin({
            toast: true,
            position: "center",
            showConfirmButton: false,
            timer: 4000, // Slightly longer to account for rendering
            background: "rgba(0, 0, 0, 0.7)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "1rem",
            didOpen: (toast) => {
              toast.style.backdropFilter = "blur(5px)";
              toast.style.border = "1px solid rgba(255, 255, 255, 0.2)";

              // Update countdown every second
              const countdownInterval = setInterval(() => {
                countdown -= 1;
                if (countdown > 0) {
                  toast.querySelector(
                    ".swal2-title"
                  ).textContent = `Chat history deleted successfully. Reloading in ${countdown}s...`;
                } else {
                  clearInterval(countdownInterval);
                  toast.querySelector(".swal2-title").textContent =
                    "Chat history deleted successfully. Reloading...";
                }
              }, 1000);
            },
            willClose: () => {
              onClose();
              window.location.reload();
            },
          });

          Toast.fire({
            icon: "success",
            title: `Chat history deleted successfully. Reloading in ${countdown}s...`,
          });
        } else {
          Swal.fire(
            "Failed!",
            response.data.msg || "Unable to delete history.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error deleting messages:", error);
        Swal.fire(
          "Error!",
          "An error occurred while deleting history.",
          "error"
        );
      }
    }
  };

  const handleDisbandGroup = async (groupId, adminId) => {
    // if (data?.admin !== adminId) {
    //   Swal.fire(
    //     "Error!",
    //     "Only the group admin can disband the group.",
    //     "error"
    //   );
    //   return;
    // }

    const result = await Swal.fire({
      title: "Confirm Disband",
      text: "Are you sure you want to disband this group? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Disband",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        console.log("Sending disband request:", { groupId, memberId: adminId });
        const response = await axios.delete(
          "https://telego-backend.onrender.com/api/groups/delete-group",
          {
            data: {
              groupId,
              memberId: adminId,
            },
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Disband response:", response.data);
        if (response.status === 200) {
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
            icon: "success",
            title: "Group disbanded successfully.",
          });
          setTimeout(() => {
            socket.emit("disbandGroup", { groupId });
            window.location.reload();
            onClose();
          }, 3000);
        } else {
          Swal.fire(
            "Failed!",
            response.data.message || "Unable to disband group.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error disbanding group:", error.response?.data || error);
        Swal.fire(
          "Error!",
          error.response?.data?.message ||
            "An error occurred while disbanding group.",
          "error"
        );
      }
    }
  };

  if (!isOpen && !isAddMemberModalOpen && !isMemberDetailsModalOpen)
    return null;

  const shouldShowScroll = data?.members?.length > 3;
  const memberItemHeight = 50;
  const membersListHeight = shouldShowScroll
    ? `${3 * memberItemHeight}px`
    : `${(data?.members?.length || 0) * memberItemHeight}px`;

  return (
    <>
      <div className={`group-info-panel ${isOpen ? "open" : ""}`}>
        <div className="group-info-header">
          <h2>{isGroup ? "GROUP INFO" : "PERSONAL INFO"}</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="group-info-body">
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">Error: {error}</p>}

          {data && (
            <>
              <div className="group-avatar">
                <div className="avatar-container">
                  <div
                    className="avatar-img"
                    style={{
                      backgroundImage: `url(${
                        previewImage || data.avatar || "/default-avatar.png"
                      })`,
                    }}
                  />
                  {isGroup && data.admin === currentUserId && (
                    <button
                      className="change-avatar-btn"
                      onClick={triggerFileInput}
                      title="Change group avatar"
                      disabled={uploading}
                      aria-label="Change group avatar"
                    >
                      {uploading ? (
                        <span className="spinner">⏳</span>
                      ) : (
                        <FaCamera />
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChangeAvatar}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </div>
                <div className="group-name-container">
                  <h3>{data.name || "No name"}</h3>
                  {isGroup && data.admin === currentUserId && (
                    <button
                      className="rename-group-btn"
                      onClick={handleRenameGroup}
                      title="Rename group"
                      disabled={renaming}
                      aria-label="Rename group"
                    >
                      {renaming ? (
                        <span className="spinner">⏳</span>
                      ) : (
                        <FaPen />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isGroup && (
                <div className="group-section">
                  <div className="group-section-header">
                    <h4>Group Members ({data.members?.length || 0})</h4>
                    {/* {data.admin === currentUserId && ( */}
                    <button
                      className="add-member-btn"
                      onClick={handleOpenAddMemberModal}
                    >
                      <FaUserPlus title="Add members" />
                    </button>
                    {/* )} */}
                  </div>
                  <div
                    className="group-members"
                    style={{
                      height: membersListHeight,
                      overflowY: shouldShowScroll ? "auto" : "hidden",
                    }}
                  >
                    {data.members?.length > 0 ? (
                      data.members.map((member) => (
                        <button
                          key={member._id}
                          className="group-member-button"
                          onClick={() => handleOpenMemberDetailsModal(member)}
                        >
                          <div className="member-info">
                            <div
                              className="member-avatar"
                              style={{
                                backgroundImage: `url(${
                                  member.avatar || "/default-avatar.png"
                                })`,
                              }}
                            />
                            <span>{member.fullName || "Anonymous"}</span>
                            {member._id === data.admin && (
                              <span className="admin-label">(Admin)</span>
                            )}
                            {currentUserId !== data.admin &&
                              member._id === currentUserId && (
                                <span className="member-label">(Me)</span>
                              )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="no-members">No members</p>
                    )}
                  </div>

                  <div className="group-meta">
                    <p>
                      Created:{" "}
                      {data.createdAt
                        ? new Date(data.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              )}
              {isGroup && (
                <div className="poll-creation-section">
                  <button
                    className="create-poll-btn"
                    onClick={() => setIsCreatePollModalOpen(true)}
                  >
                    <FaPoll /> Tạo bình chọn
                  </button>
                </div>
              )}
              <MediaGallery
                groupId={groupInfo.id}
                userId={currentUserId}
                isGroup={isGroup}
              />
              <ToastContainer />

              <div className="group-actions">
                {isGroup ? (
                  <>
                    <div
                      className="action-item single clear-chat"
                      onClick={() =>
                        handleDeleteAllMessages(
                          currentUserId,
                          null,
                          groupInfo.id
                        )
                      }
                    >
                      <FaClock className="action-icon" />
                      <span>Clear Chat History</span>
                    </div>
                    {data.admin === currentUserId && (
                      <div
                        className="action-item single disband"
                        onClick={() =>
                          handleDisbandGroup(groupInfo.id, currentUserId)
                        }
                      >
                        <FaSignOutAlt className="action-icon" />
                        <span>Disband Group</span>
                      </div>
                    )}
                    <div
                      className="action-item single leave"
                      onClick={() =>
                        handleLeaveGroup(groupInfo.id, currentUserId)
                      }
                    >
                      <FaSignOutAlt className="action-icon" />
                      <span>Leave Group</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="action-item single leave"
                      onClick={handleRemoveFriend}
                    >
                      <FaUserMinus className="action-icon" />
                      <span>Remove Friend</span>
                    </div>
                    <div
                      className="action-item single clear-chat"
                      onClick={() =>
                        handleDeleteAllMessages(
                          currentUserId,
                          groupInfo.id,
                          null
                        )
                      }
                    >
                      <FaClock className="action-icon" />
                      <span>Clear Chat History</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AddMemberGroupModal
        isOpen={isAddMemberModalOpen}
        onClose={handleCloseAddMemberModal}
        currentUserId={currentUserId}
        groupId={groupInfo.id}
        data={data}
        updateMembers={updateMembers}
      />

      <MemberDetailsModal
        isOpen={isMemberDetailsModalOpen}
        onClose={handleCloseMemberDetailsModal}
        member={selectedMember}
        currentUserId={currentUserId}
        groupId={groupInfo.id}
        isAdmin={data?.admin === currentUserId}
      />
      <CreatePollModal
        isOpen={isCreatePollModalOpen}
        onClose={() => setIsCreatePollModalOpen(false)}
        userId={currentUserId}
        groupId={groupInfo.id}
      />

      <style jsx>{`
        /* Group Info Panel Styles */
        .group-info-panel {
          position: ${isAddMemberModalOpen || isMemberDetailsModalOpen
            ? "fixed"
            : "relative"};
          top: 0;
          right: 0;
          width: 400px;
          height: 100%;
          background: #fff;
          box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .group-info-panel.open {
          transform: translateX(0);
        }

        .group-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eaeaea;
        }

        .group-info-body {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }

        .group-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .avatar-container {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          margin-bottom: 10px;
          background-color: #eaeaea;
        }

        .group-name-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 25px;
        }

        .change-avatar-btn,
        .rename-group-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .change-avatar-btn {
          position: absolute;
          bottom: 0;
          right: 0;
        }

        .change-avatar-btn:hover,
        .rename-group-btn:hover {
          background: #0056b3;
        }

        .change-avatar-btn:disabled,
        .rename-group-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        .spinner {
          font-size: 16px;
        }

        .user-details {
          width: 100%;
          padding: 10px 15px;
          margin-top: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .user-detail-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          padding: 5px 0;
        }

        .detail-icon {
          margin-right: 10px;
          color: #666;
          min-width: 16px;
        }

        .gender-male {
          color: #4285f4;
        }

        .gender-female {
          color: #ea4335;
        }

        .detail-label {
          font-weight: 500;
          margin-right: 5px;
          color: #555;
          min-width: 100px;
        }

        .detail-value {
          flex: 1;
          color: #333;
        }

        .group-section {
          margin-bottom: 20px;
        }

        .group-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .add-member-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #007bff;
        }

        .group-members {
          border: 1px solid #eaeaea;
          border-radius: 5px;
          overflow-y: auto;
        }

        .group-member-button {
          width: 100%;
          background: none;
          border: none;
          padding: 10px;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          align-items: center;
        }

        .group-member-button:last-child {
          border-bottom: none;
        }

        .group-member-button:hover {
          background-color: #f8f9fa;
        }

        .member-info {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .member-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          margin-right: 10px;
          background-color: #eaeaea;
        }

        .admin-label {
          margin-left: 5px;
          font-size: 12px;
          color: #007bff;
        }

        .member-label {
          margin-left: 5px;
          font-size: 12px;
          color: #6c757d;
        }

        .group-meta {
          margin-top: 10px;
          font-size: 14px;
          color: #6c757d;
        }

        .group-actions {
          margin-top: 20px;
        }

        .action-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eaeaea;
        }

        .action-item.single {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .action-item.leave,
        .action-item.clear-chat,
        .action-item.disband {
          color: #dc3545;
        }

        .action-label {
          display: flex;
          align-items: center;
        }

        .action-icon {
          margin-right: 10px;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.4s;
        }

        input:checked + .slider {
          background-color: #2196f3;
        }

        input:focus + .slider {
          box-shadow: 0 0 1px #2196f3;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        .loading,
        .error {
          text-align: center;
          padding: 20px;
        }

        /* Media Gallery Styles */
        .media-gallery {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .gallery-title {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        .media-tabs {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          margin-bottom: 15px;
          padding-bottom: 5px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background-color: #e9ecef;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background-color: #007bff;
          color: white;
        }

        .media-content {
          min-height: 200px;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #6c757d;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          max-height: 300px;
          overflow-y: auto;
        }

        .media-item {
          height: 100px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .media-item img,
        .media-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #e9ecef;
          padding: 10px;
          text-align: center;
        }

        .file-item a {
          margin-top: 5px;
          font-size: 12px;
          color: #007bff;
          text-decoration: none;
          word-break: break-all;
        }

        /* Add Member Modal Styles */
        .add-member-modal {
          z-index: 1001;
        }

        .member-details-modal {
          z-index: 1002;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          font-size: 14px;
        }

        .user-list-item {
          display: flex;
          align-items: center;
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eaeaea;
        }

        .user-list-item img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .custom-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-radius: 4px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-checkbox.checked {
          background-color: #007bff;
          border-color: #007bff;
        }

        .checkmark {
          color: white;
          font-size: 14px;
        }

        .no-results {
          text-align: center;
          color: #6c757d;
          padding: 20px;
        }

        .selected-users {
          width: 150px;
          max-height: 300px;
          overflow-y: auto;
          border-left: 1px solid #eaeaea;
          padding-left: 10px;
        }

        .selected-users.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }

        .selected-count {
          font-size: 12px;
          color: #007bff;
          margin-bottom: 10px;
        }

        .selected-user-item {
          display: flex;
          align-items: center;
          padding: 5px 0;
        }

        .selected-user-item img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .selected-user-item button {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          margin-left: 10px;
        }

        .modal-footer {
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
          background-color: #ccc;
          cursor: not-allowed;
        }

        /* Member Details Modal Styles */
        .member-details {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .admin-actions {
          margin-top: 20px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .add-friend-btn {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
        }

        .add-friend-btn:hover {
          background-color: #0056b3;
        }

        .add-friend-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        /* Poll Creation Section Styles */
        .poll-creation-section {
          margin: 20px 0;
          text-align: right;
        }

        .create-poll-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-poll-btn:hover {
          background-color: #0056b3;
        }
      `}</style>
    </>
  );
};

export default GroupInfoPanel;
