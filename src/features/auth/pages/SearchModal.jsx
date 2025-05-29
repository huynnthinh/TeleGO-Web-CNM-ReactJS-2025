import React, { useState, useEffect } from "react";
import axios from "axios";
import { debounce } from "lodash";
// import io from "socket.io-client";
import UserProfilePage from "../../../components/layout/UserProfilePage";
import Swal from "sweetalert2";

// const socket = io("https://telego-backend.onrender.com");

const SearchModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(true);
  const currentUserId = localStorage.getItem("userId");

  // Lấy thông tin người dùng hiện tại
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(
        `https://telego-backend.onrender.com/api/users/id/${currentUserId}`
      );
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng hiện tại:", error);
    }
  };

  // Kiểm tra trạng thái bạn bè - SỬ DỤNG CÁC ENDPOINT HIỆN CÓ
  const checkFriendStatus = async (userId) => {
    try {
      const [friends, receivedRequests] = await Promise.all([
        axios.get(
          `https://telego-backend.onrender.com/api/friends/get-friend/${currentUserId}`
        ),
        axios.get(
          `https://telego-backend.onrender.com/api/friends/get-add-friend/${currentUserId}`
        ), // Lời mời mình nhận được
      ]);

      const isFriend = friends.data.some((f) => f.friendInfo._id === userId);
      const receivedPending = receivedRequests.data.some(
        (r) => r.friendInfo._id === userId
      ); // Người ta gửi cho mình

      // Kiểm tra mình đã gửi lời mời cho userId này chưa bằng cách gọi API get-add-friend cho userId đó
      let sentPending = false;
      try {
        const sentRequestsResponse = await axios.get(
          `https://telego-backend.onrender.com/api/friends/get-add-friend/${userId}`
        );
        sentPending = sentRequestsResponse.data.some(
          (r) => r.friendInfo._id === currentUserId
        ); // Mình có trong danh sách người gửi lời mời cho userId
      } catch (error) {
        console.log("Could not check sent requests:", error);
      }

      return {
        isFriend,
        sentPending,
        receivedPending,
      };
    } catch (error) {
      console.error("Error checking friend status:", error);
      return {
        isFriend: false,
        sentPending: false,
        receivedPending: false,
      };
    }
  };

  // Gửi yêu cầu kết bạn
  const handleAddFriend = async (userId) => {
    if (!currentUserId) {
      setError("Vui lòng đăng nhập để gửi yêu cầu kết bạn.");
      return;
    }
    try {
      const { isFriend, sentPending, receivedPending } =
        await checkFriendStatus(userId);

      if (isFriend) {
        setError("Hai người đã là bạn bè.");
        return;
      }
      if (sentPending) {
        setError("Yêu cầu kết bạn đã được gửi.");
        return;
      }

      const response = await axios.post(
        "https://telego-backend.onrender.com/api/friends/add-friend",
        {
          idUser1: currentUserId,
          idUser2: userId,
        }
      );

      setError("");
      Swal.fire({
        title: "Thành công!",
        text: "Yêu cầu kết bạn đã được gửi.",
        icon: "success",
        confirmButtonText: "OK",
      });
      setSelectedUser({
        ...selectedUser,
        sentPending: true,
        receivedPending: false,
      });
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu kết bạn:", error);
      setError(
        error.response?.data?.message || "Không thể gửi yêu cầu kết bạn."
      );
    }
  };

  // XỬ LÝ ĐỒNG Ý LỜI MỜI KẾT BẠN
  const handleAcceptFriendRequest = async (userId) => {
    try {
      const response = await axios.post(
        "https://telego-backend.onrender.com/api/friends/accept-friend",
        {
          idUser1: userId, // Người gửi lời mời
          idUser2: currentUserId, // Người nhận lời mời (mình)
        }
      );

      setError("");
      Swal.fire({
        title: "Thành công!",
        text: "Đã chấp nhận lời mời kết bạn.",
        icon: "success",
        confirmButtonText: "OK",
      });
      // window.location.reload(); // Tải lại trang để cập nhật danh sách bạn bè

      setSelectedUser({
        ...selectedUser,
        isFriend: true,
        sentPending: false,
        receivedPending: false,
      });
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
      setError(
        error.response?.data?.message || "Không thể chấp nhận lời mời kết bạn."
      );
    }
  };

  // FUNCTION ĐỂ XÁC ĐỊNH TEXT VÀ ACTION CỦA NÚT
  const getFriendButtonConfig = (user) => {
    if (user.isFriend) {
      return {
        text: "Bạn bè",
        disabled: true,
        onClick: null,
        icon: "✓",
      };
    }
    if (user.sentPending) {
      return {
        text: "Đã gửi yêu cầu",
        disabled: true,
        onClick: null,
        icon: "⏳",
      };
    }
    if (user.receivedPending) {
      return {
        text: "Đồng ý lời mời kết bạn",
        disabled: false,
        onClick: () => handleAcceptFriendRequest(user._id),
        icon: "✓",
      };
    }
    return {
      text: "Thêm bạn",
      disabled: false,
      onClick: () => handleAddFriend(user._id),
      icon: "➕",
    };
  };

  // Xóa tất cả Recent Searches
  const handleClearAllSearches = () => {
    setRecentSearches([]);
    localStorage.setItem("recentSearches", JSON.stringify([]));
  };

  // Xóa một mục trong Recent Searches
  const handleRemoveSearch = (id) => {
    const updatedSearches = recentSearches.filter((search) => search.id !== id);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  // Tìm kiếm user với debounce
  const searchUser = debounce(async (query) => {
    if (query.trim()) {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://telego-backend.onrender.com/api/users/phone/${query}`
        );
        const userData = response.data;

        if (currentUser && userData.phoneNumber === currentUser.phoneNumber) {
          setShowUserProfile(true);
          setIsSearchModalVisible(false);
          setSearchResults([]);
          setIsLoading(false);
          return;
        }

        const { isFriend, sentPending, receivedPending } =
          await checkFriendStatus(userData._id);
        setSearchResults([
          {
            ...userData,
            isFriend,
            sentPending,
            receivedPending,
          },
        ]);
        setError("");

        const newSearch = {
          id: Date.now(),
          username: userData.phoneNumber,
          fullName: userData.fullName || userData.phoneNumber,
          avatar: userData.avatar || "https://via.placeholder.com/150",
          _id: userData._id,
        };
        const updatedSearches = [
          newSearch,
          ...recentSearches
            .filter((search) => search.username !== newSearch.username)
            .slice(0, 4),
        ];
        setRecentSearches(updatedSearches);
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
        setSearchResults([]);
        setError("Không tìm thấy người dùng với số điện thoại này.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      setError("");
    }
  }, 500);

  useEffect(() => {
    // socket.emit("add-user", currentUserId);
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      searchUser(searchQuery);
    }
    return () => searchUser.cancel();
  }, [searchQuery, currentUser]);

  useEffect(() => {
    const storedSearches =
      JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(storedSearches);
  }, []);

  const handleOverlayClick = (event) => {
    onClose();
    setShowUserProfile(false);
    setIsSearchModalVisible(true);
  };

  const handleModalClick = (event) => {
    event.stopPropagation();
  };

  const handleViewProfile = async (user) => {
    const { isFriend, sentPending, receivedPending } = await checkFriendStatus(
      user._id
    );
    setSelectedUser({
      ...user,
      isFriend,
      sentPending,
      receivedPending,
    });
  };

  const handleViewRecentProfile = async (search) => {
    if (search.isQuery) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://telego-backend.onrender.com/api/users/phone/${search.username}`
      );
      const userData = response.data;

      if (currentUser && userData.phoneNumber === currentUser.phoneNumber) {
        setShowUserProfile(true);
        setIsSearchModalVisible(false);
        setSelectedUser(null);
        setIsLoading(false);
        return;
      }

      const { isFriend, sentPending, receivedPending } =
        await checkFriendStatus(response.data._id);
      setSelectedUser({
        ...response.data,
        isFriend,
        sentPending,
        receivedPending,
      });
      setError("");
    } catch (error) {
      console.error(
        "Lỗi khi lấy thông tin người dùng từ Recent Searches:",
        error
      );
      setError("Không thể lấy thông tin người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setError("");
  };

  const handleProfileUpdate = () => {
    fetchCurrentUser();
  };

  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    setIsSearchModalVisible(true);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-overlay z-50"
      onClick={handleOverlayClick}
    >
      {isSearchModalVisible && (
        <div
          className="modal bg-white p-4 rounded-lg shadow-lg"
          onClick={handleModalClick}
        >
          {selectedUser ? (
            <div>
              <button
                className="back-button absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                onClick={handleBackToSearch}
                aria-label="Quay lại tìm kiếm"
              >
                ←
              </button>
              <button
                className="close-button absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={onClose}
                aria-label="Đóng modal"
              >
                ✕
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Thông tin người dùng
              </h2>

              <div className="flex justify-center mb-4">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden"
                  style={{ border: "1px solid #e5e5e5" }}
                >
                  <img
                    src={
                      selectedUser.avatar || "https://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>

              <div className="mb-4 text-center">
                <h3
                  className="text-xl font-medium text-gray-800"
                  style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                >
                  {selectedUser.fullName || "Người dùng chưa đặt tên"}
                </h3>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Thông tin cá nhân
                </h4>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between mb-2">
                    <span>Giới tính</span>
                    <span>
                      {selectedUser.gender
                        ? selectedUser.gender === "male"
                          ? "Nam"
                          : selectedUser.gender === "female"
                          ? "Nữ"
                          : "Khác"
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Ngày sinh</span>
                    <span>
                      {selectedUser.birthDate
                        ? new Date(selectedUser.birthDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Điện thoại</span>
                    <span>{selectedUser.phoneNumber || "Chưa cập nhật"}</span>
                  </div>
                </div>
              </div>

              {/* NÚT KẾT BẠN VỚI LOGIC ĐỘNG */}
              {(() => {
                const buttonConfig = getFriendButtonConfig(selectedUser);
                return (
                  <button
                    className={`w-full text-white py-2 rounded-lg flex items-center justify-center ${
                      buttonConfig.disabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : selectedUser.receivedPending
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    style={{
                      backgroundColor: buttonConfig.disabled
                        ? "#9ca3af"
                        : selectedUser.receivedPending
                        ? "#10b981"
                        : "#1877f2",
                      borderRadius: "6px",
                      padding: "8px 0",
                      fontWeight: "500",
                    }}
                    onClick={buttonConfig.onClick}
                    disabled={buttonConfig.disabled}
                  >
                    <span className="mr-2">{buttonConfig.icon}</span>
                    {buttonConfig.text}
                  </button>
                );
              })()}

              {error && (
                <p className="text-sm text-red-500 text-center mt-2">{error}</p>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Search
              </h2>

              <div className="search-input-container relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {searchQuery && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {isLoading && (
                <p className="text-sm text-gray-500 text-center mb-2">
                  Đang tìm kiếm...
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500 text-center mb-2">{error}</p>
              )}

              {searchResults.length > 0 && (
                <div className="mb-4">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                      style={{ padding: "8px", borderRadius: "8px" }}
                      onClick={() => handleViewProfile(user)}
                    >
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundImage: user.avatar
                            ? `url(${user.avatar})`
                            : "url(https://via.placeholder.com/150)",
                          border: "1px solid #e5e5e5",
                        }}
                      />
                      <div className="ml-3">
                        <p
                          className="font-semibold"
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                            color: "#050505",
                          }}
                        >
                          {user.fullName || "Người dùng chưa đặt tên"}
                        </p>
                        <p
                          className="text-sm text-gray-500"
                          style={{ fontSize: "0.8rem", color: "#65676b" }}
                        >
                          {user.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <div className="recent-header flex justify-between items-center">
                  <span>Recent</span>
                  {recentSearches.length > 0 && (
                    <button
                      className="text-blue-500 text-sm"
                      onClick={handleClearAllSearches}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="recent-list">
                  {recentSearches.length > 0 ? (
                    recentSearches.map((search) => (
                      <div
                        key={search.id}
                        className="recent-item hover:bg-gray-100 flex items-center justify-between p-2"
                      >
                        <div
                          className="user-info cursor-pointer flex items-center"
                          onClick={() => handleViewRecentProfile(search)}
                        >
                          <div
                            className={`avatar ${
                              search.isQuery ? "query" : ""
                            }`}
                            style={{
                              backgroundImage: search.avatar
                                ? `url(${search.avatar})`
                                : "url(https://via.placeholder.com/150)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                          >
                            {search.isQuery && (
                              <span style={{ fontSize: "1.2rem" }}>🔍</span>
                            )}
                          </div>
                          <div className="user-details ml-3">
                            <p className="username font-semibold">
                              {search.username}
                            </p>
                            <p className="full-name text-sm text-gray-500">
                              {search.fullName}
                            </p>
                          </div>
                        </div>
                        <button
                          className="remove-button text-gray-500 hover:text-gray-700"
                          onClick={() => handleRemoveSearch(search.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p
                      className="text-sm text-gray-500 text-center"
                      style={{ fontSize: "0.85rem", color: "#65676b" }}
                    >
                      No recent searches
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showUserProfile && currentUser && (
        <UserProfilePage
          onClose={handleCloseUserProfile}
          user={currentUser}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default SearchModal;
