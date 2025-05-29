import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { toast } from "react-toastify";
import axios from "axios";

const UserProfilePage = ({ onClose, user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingAvatar, setIsConfirmingAvatar] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Hàm tách birthDate từ "YYYY-MM-DD" thành day, month, year
  const parseBirthDate = (birthDate) => {
    if (!birthDate) return { day: "", month: "", year: "" };
    const [year, month, day] = birthDate.split("-");
    return { day, month, year };
  };

  // Khởi tạo profileData từ user
  const initialProfileData = user
    ? {
        name: user.fullName || "",
        gender: user.gender || "",
        ...parseBirthDate(user.birthDate),
        phone: user.phoneNumber || "",
        avatar: user.avatar || "https://via.placeholder.com/150",
      }
    : {
        name: "",
        gender: "",
        day: "",
        month: "",
        year: "",
        phone: "",
        avatar: "https://via.placeholder.com/150",
      };

  const [profileData, setProfileData] = useState(initialProfileData);
  const [tempData, setTempData] = useState({ ...initialProfileData });

  // Cập nhật profileData khi user thay đổi
  useEffect(() => {
    if (user) {
      const { day, month, year } = parseBirthDate(user.birthDate);
      const updatedProfileData = {
        name: user.fullName || "",
        gender: user.gender || "",
        day: day || "",
        month: month || "",
        year: year || "",
        phone: user.phoneNumber || "",
        avatar: user.avatar || "https://via.placeholder.com/150",
      };
      setProfileData(updatedProfileData);
      setTempData(updatedProfileData);
    } else {
      toast.error("Không tìm thấy thông tin người dùng!");
      onClose();
    }
  }, [user, onClose]);

  const handleSave = async () => {
    if (!tempData.name.trim()) {
      toast.error("Tên hiển thị không được để trống!");
      return;
    }

    if (tempData.day || tempData.month || tempData.year) {
      const { day, month, year } = tempData;
      if (!day || !month || !year) {
        toast.error("Vui lòng nhập đầy đủ ngày, tháng, năm sinh!");
        return;
      }

      const date = new Date(`${year}-${month}-${day}`);
      if (
        isNaN(date.getTime()) ||
        date.getFullYear() !== parseInt(year) ||
        date.getMonth() + 1 !== parseInt(month) ||
        date.getDate() !== parseInt(day)
      ) {
        toast.error("Ngày sinh không hợp lệ!");
        return;
      }
    }

    const updatedUser = {
      fullName: tempData.name,
      birthDate: tempData.day
        ? `${tempData.year}-${tempData.month}-${tempData.day}`
        : undefined,
      gender: tempData.gender || undefined,
    };

    try {
      const response = await axios.put(
        `https://telego-backend.onrender.com/api/users/phone/${user.phoneNumber}`,
        updatedUser
      );
      setProfileData({ ...tempData });
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công!");
      if (onUpdate) onUpdate(response.data); // Gọi callback để cập nhật dữ liệu ở HomePage
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error(
        error.response?.data?.message || "Cập nhật thông tin thất bại!"
      );
    }
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setIsConfirmingAvatar(true);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmAvatar = async () => {
    try {
      const croppedImageBlob = await getCroppedImgBlob(
        selectedImage,
        croppedAreaPixels
      );
      const formData = new FormData();
      formData.append("avatar", croppedImageBlob, "avatar.jpg");

      const response = await axios.put(
        `https://telego-backend.onrender.com/api/users/phone/${user.phoneNumber}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const updatedAvatar = response.data.avatar;
      setProfileData({ ...profileData, avatar: updatedAvatar });
      setTempData({ ...tempData, avatar: updatedAvatar });
      setIsConfirmingAvatar(false);
      setSelectedImage(null);
      toast.success("Cập nhật ảnh đại diện thành công!");
      if (onUpdate) onUpdate(response.data); // Gọi callback để cập nhật dữ liệu ở HomePage
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error(
        error.response?.data?.message || "Cập nhật ảnh đại diện thất bại!"
      );
    }
  };

  const handleCancelAvatar = () => {
    setIsConfirmingAvatar(false);
    setSelectedImage(null);
  };

  const getCroppedImgBlob = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.9 // Chất lượng ảnh
        );
      };
      image.onerror = () => reject(new Error("Image load failed"));
    });
  };

  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const years = Array.from({ length: 100 }, (_, i) => String(2025 - i));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-overlay z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {isConfirmingAvatar ? "Cập nhật ảnh đại diện" : "Thông tin tài khoản"}
        </h2>

        {isConfirmingAvatar ? (
          <>
            <div className="relative w-full h-64 mb-4">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Phóng to/thu nhỏ
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                onClick={handleCancelAvatar}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={handleConfirmAvatar}
              >
                Cập nhật
              </button>
            </div>
          </>
        ) : isEditing ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={tempData.name}
                onChange={(e) =>
                  setTempData({ ...tempData, name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-800 mb-2">
                Thông tin cá nhân
              </h4>
              <div className="mb-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Giới tính
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={tempData.gender === "male"}
                      onChange={(e) =>
                        setTempData({ ...tempData, gender: e.target.value })
                      }
                      className="mr-2"
                    />
                    Nam
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={tempData.gender === "female"}
                      onChange={(e) =>
                        setTempData({ ...tempData, gender: e.target.value })
                      }
                      className="mr-2"
                    />
                    Nữ
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={tempData.gender === "other"}
                      onChange={(e) =>
                        setTempData({ ...tempData, gender: e.target.value })
                      }
                      className="mr-2"
                    />
                    Khác
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Ngày sinh
                </label>
                <div className="flex gap-2">
                  <select
                    value={tempData.day}
                    onChange={(e) =>
                      setTempData({ ...tempData, day: e.target.value })
                    }
                    className="w-1/3 p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Ngày</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tempData.month}
                    onChange={(e) =>
                      setTempData({ ...tempData, month: e.target.value })
                    }
                    className="w-1/3 p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Tháng</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tempData.year}
                    onChange={(e) =>
                      setTempData({ ...tempData, year: e.target.value })
                    }
                    className="w-1/3 p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Năm</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                onClick={handleCancel}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={handleSave}
              >
                Cập nhật
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mb-4 relative">
              <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden">
                <img
                  src={profileData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute left-12 bottom-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer border border-gray-300">
                <span className="text-blue-600">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-800">
                    {profileData.name || "Chưa cập nhật"}
                  </h3>
                  <button className="ml-2 text-gray-500 hover:text-gray-700">
                    ✏️
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-800 mb-2">
                Thông tin cá nhân
              </h4>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-2">
                  <span>Giới tính</span>
                  <span>
                    {profileData.gender === "male"
                      ? "Nam"
                      : profileData.gender === "female"
                      ? "Nữ"
                      : profileData.gender === "other"
                      ? "Khác"
                      : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Ngày sinh</span>
                  <span>
                    {profileData.day && profileData.month && profileData.year
                      ? `${profileData.day} tháng ${profileData.month}, ${profileData.year}`
                      : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Điện thoại</span>
                  <span>{profileData.phone || "Chưa cập nhật"}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
            </p>
            <button
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
              onClick={() => setIsEditing(true)}
            >
              <span className="mr-2">✏️</span>
              Cập nhật
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
