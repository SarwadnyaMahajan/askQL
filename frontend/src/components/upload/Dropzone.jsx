/** Dropzone — drag-and-drop CSV upload zone with GSAP animations. */
import { useRef, useState, useCallback } from 'react';
import { gsap } from '../../animations/gsap-registry';
import Button from '../common/Button';

export default function Dropzone({ onFilesSelected, disabled = false }) {
  const zoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    if (zoneRef.current) {
      gsap.to(zoneRef.current, {
        borderColor: 'var(--color-accent)',
        backgroundColor: 'var(--color-accent-light)',
        scale: 1.01,
        duration: 0.25,
      });
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (zoneRef.current) {
      gsap.to(zoneRef.current, {
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        scale: 1,
        duration: 0.25,
      });
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (zoneRef.current) {
      gsap.to(zoneRef.current, {
        borderColor: 'var(--color-success)',
        scale: 1,
        duration: 0.3,
      });
      setTimeout(() => {
        gsap.to(zoneRef.current, {
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          duration: 0.4,
        });
      }, 600);
    }

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.toLowerCase().endsWith('.csv')
    );
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    e.target.value = '';
  }, [onFilesSelected]);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      ref={zoneRef}
      className={`dropzone ${isDragging ? 'dropzone--active' : ''} ${disabled ? 'dropzone--disabled' : ''}`}
      onDragOver={handleDrag}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="dropzone__icon">📄</div>
      <p className="dropzone__title">
        {isDragging ? 'Drop your CSV files here' : 'Drag & drop CSV files here'}
      </p>
      <p className="dropzone__subtitle">or click anywhere to browse</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        multiple
        className="dropzone__input"
        onChange={handleFileInput}
        disabled={disabled}
        id="file-upload-input"
        style={{ display: 'none' }}
      />
      <div style={{ marginTop: 'var(--space-md)', zIndex: 3, position: 'relative' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
}
