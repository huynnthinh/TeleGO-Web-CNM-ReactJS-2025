import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddUserProfilePage  = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    gender: "",
    avatar: null,
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim())
      newErrors.fullName = "Vui lòng nhập tên đầy đủ";
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.birthDate))
      newErrors.birthDate = "Định dạng ngày không hợp lệ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Submitting:", formData);
      navigate("/home");
    }
  };

  return (
    <div className="container">
      <h1 className="text-lg text-primary font-bold">TeleGO</h1>

      <div className="card">
        <h2 className="text-sl font-semibold text-dark mb-4 text-center">
          Thông tin cá nhân
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="input-group mb-4">
            <label className="text-sm text-dark mb-1 ml-4">Tên đầy đủ</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="input-1"
              placeholder="Nhập tên đầy đủ của bạn"
              style={{ borderColor: errors.fullName ? "red" : "" }}
            />
            {errors.fullName && (
              <span className="text-xs text-red-500 mt-1">
                {errors.fullName}
              </span>
            )}
            <p className="text-xs text-gray mt-3">
              Đây là tên sẽ hiển thị với người dùng khác.
            </p>
          </div>

          {/* Birth Date */}
          <div className="input-group mb-4">
            <label className="text-sm text-dark mb-1 ml-8">Ngày sinh</label>
            <input
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="input-1"
              placeholder="DD/MM/YYYY"
              style={{ borderColor: errors.birthDate ? "red" : "" }}
            />
            {errors.birthDate && (
              <span className="text-xs text-red-500 mt-1">
                {errors.birthDate}
              </span>
            )}
            <p className="text-xs text-gray mt-3">
              Vui lòng nhập ngày sinh theo định dạng DD/MM/YYYY.
            </p>
          </div>

          {/* Gender */}
          <div className="input-group ml-4 flex items-center">
            <label className="text-sm text-dark mb-0 ml-4">Giới tính:</label>
            <div className="flex items-center">
              <label className="radio-label flex items-center ml-4">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Nam
              </label>
              <label className="radio-label flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Nữ
              </label>
            </div>
          </div>

          {/* Avatar */}
          <div className="input-group mb-4">
            <label className="text-sm text-dark mb-1">Avatar</label>
            <div className="flex items-center mt-3">
              <div
                className="avatar-preview"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  border: "1px solid var(--light-gray)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginRight: "16px",
                }}
              >
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span className="text-gray">Avatar</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatarInput"
                />
                <label
                  htmlFor="avatarInput"
                  className="btn btn-primary btn-small"
                >
                  Chọn ảnh
                </label>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="btn btn-secondary btn-small"
                >
                  Xóa ảnh
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserProfilePage ;
