import React, { useState, useEffect } from "react";
import axios from "axios";

const ContactsPage = ({ initialTab, onSelectItems }) => {
  const [currentTab, setCurrentTab] = useState(initialTab || "friends");
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("A-Z");
  const [filterGroup, setFilterGroup] = useState("Tất cả");
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch friends
        const friendResponse = await axios.get(
          `https://telego-backend.onrender.com/api/friends/get-friend/${currentUserId}`
        );
        const friendData = friendResponse.data
          .filter(({ friendInfo }) => friendInfo._id !== currentUserId)
          .map(({ friendInfo }) => ({
            id: friendInfo._id,
            name: friendInfo.fullName,
            avatar: friendInfo.avatar || "/default-avatar.png",
            status: friendInfo.status === "online" ? "Active now" : "Offline",
            type: "friend",
          }));
        setFriends(friendData);

        // Fetch groups
        const groupResponse = await axios.get(
          `https://telego-backend.onrender.com/api/groups/member/${currentUserId}`
        );
        const groupData = groupResponse.data.map((group) => ({
          id: group._id,
          name: group.groupName,
          avatar: group.avatar || "/default-group-avatar.png",
          type: "group",
        }));
        setGroups(groupData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchData();
  }, [currentUserId]);

  const handleSelect = (item) => {
    if (onSelectItems) {
      onSelectItems([item]);
    }
  };

  // Lọc và sắp xếp danh sách bạn bè
  const filteredFriends = friends
    .filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "A-Z") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name); // Sắp xếp Z-A
      }
    });

  // Lọc danh sách nhóm
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Nhóm bạn bè theo chữ cái đầu tiên
  const groupedFriends = filteredFriends.reduce((acc, friend) => {
    const firstLetter = friend.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(friend);
    return acc;
  }, {});

  const groupOptions = ["Tất cả", ...groups.map((group) => group.name)];

  return (
    <div className="custom-contacts-page">
      <div className="custom-contacts-header">
        <h2 className="custom-contacts-title">
          {currentTab === "friends" ? "Danh sách bạn bè" : "Danh sách nhóm"}
        </h2>
        <p className="custom-contacts-count">
          {currentTab === "friends"
            ? `Bạn bè (${friends.length})`
            : `Nhóm (${groups.length})`}
        </p>
      </div>

      <div className="custom-contacts-search-filters">
        <div className="custom-search-input-container">
          <input
            type="text"
            placeholder="Tìm bạn"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="custom-search-input"
          />
        </div>
        <div className="custom-filter-group">
          <label>Sắp xếp theo tên:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="custom-filter-select"
          >
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
          </select>
        </div>
        <div className="custom-filter-group">
          <label>Lọc theo nhóm:</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="custom-filter-select"
          >
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="custom-contacts-content">
        {currentTab === "friends" ? (
          <div className="custom-friends-list">
            {Object.keys(groupedFriends).length > 0 ? (
              Object.keys(groupedFriends)
                .sort((a, b) =>
                  sortOrder === "A-Z" ? a.localeCompare(b) : b.localeCompare(a)
                ) // Đảo ngược thứ tự chữ cái
                .map((letter) => (
                  <div key={letter} className="custom-letter-group">
                    <h3 className="custom-letter-header">{letter}</h3>
                    {groupedFriends[letter].map((friend) => (
                      <div
                        key={friend.id}
                        className="custom-contact-item"
                        onClick={() => handleSelect(friend)}
                      >
                        <div
                          className="custom-avatar"
                          style={{
                            backgroundImage: `url(${friend.avatar})`,
                          }}
                        ></div>
                        <div className="custom-contact-info">
                          <span className="custom-contact-name">
                            {friend.name}
                          </span>
                        </div>
                        <button className="custom-menu-button">...</button>
                      </div>
                    ))}
                  </div>
                ))
            ) : (
              <p className="custom-empty-message">Không có bạn bè nào.</p>
            )}
          </div>
        ) : (
          <div className="custom-groups-list">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="custom-contact-item"
                  onClick={() => handleSelect(group)}
                >
                  <div
                    className="custom-avatar"
                    style={{
                      backgroundImage: `url(${group.avatar})`,
                    }}
                  ></div>
                  <div className="custom-contact-info">
                    <span className="custom-contact-name">{group.name}</span>
                  </div>
                  <button className="custom-menu-button">...</button>
                </div>
              ))
            ) : (
              <p className="custom-empty-message">Không có nhóm nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
