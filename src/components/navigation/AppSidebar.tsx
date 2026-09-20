"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  Route,
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

export type NavTabId = "main" | "bringe" | "path" | "share" | "settings";

interface AppSidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  level: number;
  xp: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  level,
  xp,
}) => {
  const navItems = [
    {
      id: "main" as NavTabId,
      label: "Main Page",
      sub: "1-to-1 AI Research",
      icon: Sparkles,
    },
    {
      id: "bringe" as NavTabId,
      label: "Bringe Study",
      sub: "Exam-Eve Rescue",
      icon: Zap,
    },
    {
      id: "path" as NavTabId,
      label: "Study Path",
      sub: "Adaptive Cloud Journey",
      icon: Route,
    },
    {
      id: "share" as NavTabId,
      label: "Share Information",
      sub: "Community Notes & Graph",
      icon: Share2,
    },
    {
      id: "settings" as NavTabId,
      label: "Settings",
      sub: "Learning Twin & Data",
      icon: Settings,
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : "expanded"}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="brand" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => onSelectTab("main")}>
            <img src="/logo.png" alt="Sarvajña" style={{ height: "22px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
            <b>Sarvajña</b>
          </div>
        )}

        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              type="button"
              title={isCollapsed ? item.label : undefined}
            >
              <span className="sidebar-nav-icon">
                <Icon size={18} />
              </span>
              <span className="sidebar-nav-label">
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div style={{ fontSize: "12px", color: "var(--t3)" }}>
            <div>Level <b>{level}</b></div>
            <div><b>{xp}</b> XP accumulated</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--t3)", fontWeight: "bold" }}>
            L{level}
          </div>
        )}
      </div>
    </aside>
  );
};
