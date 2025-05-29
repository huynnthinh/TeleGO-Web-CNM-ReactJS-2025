// Tạo file mới: FileViewer.jsx trong thư mục components
import React from "react";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaDownload,
} from "react-icons/fa";

const FileViewer = ({ file }) => {
  const { url, type } = file;

  // Xác định loại file dựa trên MIME type
  const getFileType = () => {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.includes("pdf")) return "pdf";
    if (type.includes("word") || type.includes("document")) return "word";
    if (type.includes("excel") || type.includes("spreadsheet")) return "excel";
    if (
      type.includes("zip") ||
      type.includes("rar") ||
      type.includes("tar") ||
      type.includes("compressed")
    )
      return "archive";
    return "other";
  };

  // Lấy tên file từ URL
  const getFileName = () => {
    try {
      const parts = url.split("/");
      const fileName = parts[parts.length - 1];
      // Giải mã URL nếu cần
      return (
        decodeURIComponent(fileName).substring(0, 25) +
        (decodeURIComponent(fileName).length > 25 ? "..." : "")
      );
    } catch (e) {
      return "File";
    }
  };

  // Hiển thị icon tương ứng với loại file
  const getFileIcon = () => {
    const fileType = getFileType();
    switch (fileType) {
      case "pdf":
        return <FaFilePdf size={24} color="#E94335" />;
      case "word":
        return <FaFileWord size={24} color="#2B579A" />;
      case "excel":
        return <FaFileExcel size={24} color="#217346" />;
      case "video":
        return <FaFileVideo size={24} color="#FF6D01" />;
      case "audio":
        return <FaFileAudio size={24} color="#8C4DB0" />;
      case "archive":
        return <FaFileArchive size={24} color="#FFC107" />;
      default:
        return <FaFileAlt size={24} color="#607D8B" />;
    }
  };

  const renderFile = () => {
    const fileType = getFileType();

    switch (fileType) {
      case "image":
        return (
          <img
            src={url}
            alt="Uploaded"
            className="message-image"
            onError={(e) => {
              console.warn("Image load error:", url);
              e.target.src = "/fallback-image.png";
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "video":
        return (
          <video
            controls
            className="message-video"
            style={{
              maxWidth: "250px",
              maxHeight: "200px",
              borderRadius: "10px",
            }}
          >
            <source src={url} type={type} />
            Your browser does not support the video tag.
          </video>
        );

      case "audio":
        return (
          <audio controls className="message-audio" style={{ width: "250px" }}>
            <source src={url} type={type} />
            Your browser does not support the audio tag.
          </audio>
        );
      case "pdf":
      case "word":
      case "excel":
      case "archive":
      case "other":
      default:
        return (
          <div className="file-preview">
            <div className="file-icon">{getFileIcon()}</div>
            <div className="file-info">
              <div className="file-name">{getFileName()}</div>
              <div className="file-type">
                {type.split("/")[1]?.toUpperCase() || "FILE"}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="file-viewer">
      {renderFile()}
      {getFileType() !== "image" && (
        <a
          href={url}
          download={getFileName()}
          target="_blank"
          rel="noopener noreferrer"
          className="file-download"
          onClick={(e) => e.stopPropagation()}
        >
          <FaDownload size={16} />
        </a>
      )}
    </div>
  );
};

export default FileViewer;
