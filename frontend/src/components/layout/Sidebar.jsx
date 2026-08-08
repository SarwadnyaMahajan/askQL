/** Sidebar — ChatGPT style recent dataset conversations and top-left CSV upload button. */
import { useRef } from 'react';
import FileCard from '../upload/FileCard';

export default function Sidebar({
  fileSummaries = [],
  activeSessionId = null,
  onSelectSession,
  onFilesSelected,
  isUploading = false,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.name.toLowerCase().endsWith('.csv')
    );
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    e.target.value = '';
  };

  const triggerUpload = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <aside className="sidebar">
      {/* Top Upload Action Button */}
      <div className="sidebar__upload-box">
        <button
          type="button"
          className="sidebar__btn-upload"
          onClick={triggerUpload}
          disabled={isUploading}
          title="Upload new CSV dataset"
        >
          <span className="sidebar__btn-icon">{isUploading ? '⏳' : '+'}</span>
          <span>{isUploading ? 'Uploading...' : 'Upload CSV Dataset'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          className="sidebar__file-input"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Recent Dataset Conversations List */}
      <div className="sidebar__section">
        <h3 className="sidebar__heading">Recent Conversations</h3>
        {fileSummaries.length === 0 ? (
          <div className="sidebar__empty-state">
            <p className="sidebar__empty">No dataset loaded yet</p>
            <p className="sidebar__empty-sub">Click above to upload a CSV file</p>
          </div>
        ) : (
          <div className="sidebar__files">
            {fileSummaries.map((file, i) => {
              const isActive = activeSessionId && file.session_id === activeSessionId;
              return (
                <div
                  key={i}
                  className={`sidebar__session-item ${isActive ? 'sidebar__session-item--active' : ''}`}
                  onClick={() => onSelectSession && onSelectSession(file)}
                >
                  <FileCard file={file} index={i} isActive={isActive} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
