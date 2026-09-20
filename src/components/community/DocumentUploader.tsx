"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  Eye,
  Hash,
} from "lucide-react";
import { ambientAudio } from "@/components/common/SoundEffects";

interface DocumentUploaderProps {
  onUploadComplete?: (docName: string, topicsCount: number) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadComplete }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; size: string; type: string; topicsFound: number; status: string }[]
  >([
    {
      name: "DBMS_University_PYQs_2020_2023.pdf",
      size: "4.2 MB",
      type: "PYQ Questions (8 papers)",
      topicsFound: 14,
      status: "Ingested & Mapped",
    },
    {
      name: "DBMS_Course_Syllabus.pdf",
      size: "1.1 MB",
      type: "Official Syllabus",
      topicsFound: 18,
      status: "Ingested & Mapped",
    },
  ]);

  const simulateUpload = (fileName = "Student_Handwritten_Notes_Unit3.pdf") => {
    ambientAudio.playChime("click");
    setUploading(true);
    setUploadProgress(10);
    setPipelineStage("Validating SHA-256 and MIME headers (Agent R2)...");

    setTimeout(() => {
      setUploadProgress(35);
      setPipelineStage("Running OCR & Hand-drawn diagram extraction (98% confidence)...");
    }, 800);

    setTimeout(() => {
      setUploadProgress(70);
      setPipelineStage("Chunking (300-500 tok) & R3 Topic-to-PYQ frequency matching...");
    }, 1600);

    setTimeout(() => {
      setUploadProgress(100);
      setPipelineStage("Ingestion Complete: 9 Pass Core topics verified!");
      ambientAudio.playChime("levelUp");

      setUploadedFiles((prev) => [
        {
          name: fileName,
          size: "2.8 MB",
          type: "Handwritten Lecture Notes",
          topicsFound: 9,
          status: "Ingested & Mapped",
        },
        ...prev,
      ]);

      setUploading(false);
      if (onUploadComplete) {
        onUploadComplete(fileName, 9);
      }
    }, 2400);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5" />
              Document Ingestion (R2 Pipeline)
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Syllabus, PYQs, Notes, Photos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Upload & Ground Your Curriculum
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Golden Rule #3: RAG is strictly grounded in your documents. Cites [doc, p.X]. Never fabricates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <FileCheck className="w-4 h-4" />
          <span>Prompt-Injection Shield Active</span>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          simulateUpload();
        }}
        onClick={() => simulateUpload()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          dragOver
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
            : "border-stone-200 dark:border-stone-800 hover:border-emerald-400 bg-stone-50/50 dark:bg-stone-800/30"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
          {uploading ? "Ingesting & Analyzing Document..." : "Drop Syllabus, PYQ papers, or Lecture Notes here"}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
          Supports PDF, Word, JPEG photos of handwritten notes. High-accuracy OCR runs automatically.
        </p>

        {uploading ? (
          <div className="w-full max-w-md mt-4 space-y-2">
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              {pipelineStage}
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Or Browse Files to Upload
          </button>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
          Ingested Grounding Files ({uploadedFiles.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {uploadedFiles.map((doc, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.type}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {doc.status}
                </span>
                <span className="text-[10px] text-stone-400 mt-0.5 font-mono">
                  {doc.topicsFound} topics mapped
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
