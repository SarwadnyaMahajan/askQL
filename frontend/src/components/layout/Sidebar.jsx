/** Sidebar — uploaded files list and data quality. */
import FileCard from '../upload/FileCard';
import AgentTraceTimeline from '../trace/AgentTraceTimeline';

export default function Sidebar({ fileSummaries = [] }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <h3 className="sidebar__heading">Uploaded Datasets</h3>
        {fileSummaries.length === 0 ? (
          <p className="sidebar__empty">No files uploaded yet</p>
        ) : (
          <div className="sidebar__files">
            {fileSummaries.map((file, i) => (
              <FileCard key={i} file={file} index={i} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
