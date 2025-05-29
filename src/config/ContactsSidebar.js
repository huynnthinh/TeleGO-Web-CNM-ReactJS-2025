import React from "react";
import { FaUser, FaUsers, FaUserPlus, FaUserFriends } from "react-icons/fa";

const ContactsSidebar = ({ activeSection, onSectionChange, friendsCount, groupsCount, pendingRequestsCount, sentRequestsCount }) => {
  const sections = [
    {
      id: "friends",
      label: "Danh sách bạn bè",
      icon: <FaUser />,
      count: friendsCount,
    },
    {
      id: "groups",
      label: "Danh sách nhóm và cộng đồng",
      icon: <FaUsers />,
      count: groupsCount,
    },
    {
      id: "pending",
      label: "Lời mời kết bạn",
      icon: <FaUserPlus />,
      count: pendingRequestsCount,
    },
    {
      id: "sent",
      label: "Lời mời vào nhóm và cộng đồng",
      icon: <FaUserFriends />,
      count: sentRequestsCount,
    },
  ];

  return (
    <div className="contacts-sidebar w-80 bg-white border-r border-gray-200 h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Danh bạ</h2>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation sections */}
      <div className="py-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              activeSection === section.id ? "bg-blue-50 border-r-3 border-blue-500" : ""
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            <div className="flex items-center">
              <div className={`mr-3 ${activeSection === section.id ? "text-blue-500" : "text-gray-500"}`}>
                {section.icon}
              </div>
              <span className={`text-sm ${activeSection === section.id ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                {section.label}
              </span>
            </div>
            {section.count > 0 && (
              <span className="text-xs text-gray-500">({section.count})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactsSidebar;
