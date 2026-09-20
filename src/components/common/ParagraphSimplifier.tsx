"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Globe, Check } from "lucide-react";
import {
  getStoredGraspingScore,
  getStoredSimplificationLang,
  simplifyParagraphText,
  SUPPORTED_LANGUAGES,
} from "@/lib/grasping-service";
import { ambientAudio } from "@/components/common/SoundEffects";

interface ParagraphSimplifierProps {
  originalText: string;
  topicName?: string;
  alwaysShow?: boolean;
}

export const ParagraphSimplifier: React.FC<ParagraphSimplifierProps> = ({
  originalText,
  topicName,
  alwaysShow = false,
}) => {
  const [graspingScore, setGraspingScore] = useState(4.8);
  const [currentLang, setCurrentLang] = useState("en_eli5");
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState("");

  useEffect(() => {
    const score = getStoredGraspingScore();
    const lang = getStoredSimplificationLang();
    setGraspingScore(score);
    setCurrentLang(lang);
  }, []);

  // Show if grasping score is less than 5 on the scale of 10, or if alwaysShow is requested
  const shouldOfferSimplification = alwaysShow || graspingScore < 5.0;

  if (!shouldOfferSimplification && !isSimplified) {
    return null;
  }

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleToggleSimplify = () => {
    ambientAudio.playChime("click");
    if (!isSimplified) {
      const generated = simplifyParagraphText(originalText, currentLang, topicName);
      setSimplifiedContent(generated);
      setIsSimplified(true);
    } else {
      setIsSimplified(false);
    }
  };

  return (
    <div className="paragraph-simplifier-wrap">
      {!isSimplified ? (
        <button
          type="button"
          className="simplify-trigger-btn"
          onClick={handleToggleSimplify}
          title="Grasping helper: Click to translate into plain everyday intuition"
        >
          <Sparkles size={12} className="sparkle-icon" />
          <span>Simplify with AI</span>
          <span className="lang-hint-pill">({langObj.label.split(" ")[0]})</span>
        </button>
      ) : (
        <div className="simplified-expansion-card">
          <div className="simplified-card-head">
            <div className="simplified-head-left">
              <Sparkles size={14} style={{ color: "var(--fill)" }} />
              <span className="simplified-badge-title">AI SIMPLIFIED INTUITION</span>
              <span className="simplified-lang-tag">{langObj.label}</span>
            </div>
            <button
              type="button"
              className="simplify-revert-btn"
              onClick={handleToggleSimplify}
            >
              <RotateCcw size={12} />
              <span>Show Original</span>
            </button>
          </div>
          <p className="simplified-body-text">{simplifiedContent}</p>
        </div>
      )}
    </div>
  );
};
