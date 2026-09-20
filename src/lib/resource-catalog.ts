export type ResourceLevel = "beginner" | "intermediate" | "advanced";
export type LearningResource = { id: string; topic: string; level: ResourceLevel; title: string; provider: string; url: string; kind: "video" | "guide" | "lab" | "project"; language: string; duration: string; description: string; underrated?: boolean; project?: string };

const linux: LearningResource[] = [
  { id: "linux-journey", topic: "linux", level: "beginner", title: "Linux Journey", provider: "LabEx", url: "https://labex.io/linuxjourney", kind: "guide", language: "English", duration: "Self-paced", description: "Small, practical lessons on Linux fundamentals and the command line.", underrated: true },
  { id: "linux-quick-start", topic: "linux", level: "beginner", title: "Quick Start with Linux", provider: "LabEx", url: "https://labex.io/courses/quick-start-with-linux", kind: "lab", language: "English", duration: "10 labs", description: "Browser-based practice for navigation, files, permissions, and users." },
  { id: "linux-fcc", topic: "linux", level: "beginner", title: "Linux for Beginners", provider: "freeCodeCamp", url: "https://www.youtube.com/@freecodecamp", kind: "video", language: "English", duration: "Video series", description: "Search the channel for Linux beginner courses and follow along in a terminal." },
  { id: "linux-shell", topic: "linux", level: "intermediate", title: "Shell for Beginners", provider: "LabEx", url: "https://labex.io/courses/shell-for-beginners", kind: "lab", language: "English", duration: "13 labs", description: "Build command-line fluency through shell scripting and automation." },
  { id: "linux-admin", topic: "linux", level: "intermediate", title: "Junior System Administrator", provider: "LabEx", url: "https://labex.io/paths/linux", kind: "lab", language: "English", duration: "10 labs", description: "Practice the tasks a junior administrator encounters: users, permissions, and system work." },
  { id: "linux-project-monitor", topic: "linux", level: "intermediate", title: "Build a Linux System Monitor", provider: "LabEx", url: "https://labex.io/paths/linux", kind: "project", language: "English", duration: "Project", description: "Turn shell fundamentals into a real Bash monitoring project.", project: "Create a Bash script that reports CPU, memory, disk usage, and a process summary." },
  { id: "linux-lfcs", topic: "linux", level: "advanced", title: "Linux Foundation System Administration", provider: "Linux Foundation", url: "https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/", kind: "guide", language: "English", duration: "Exam objectives", description: "Use objective domains to structure deep system administration practice." },
  { id: "linux-security", topic: "linux", level: "advanced", title: "Linux Security for DevSecOps", provider: "LabEx", url: "https://labex.io/paths/linux", kind: "lab", language: "English", duration: "Course", description: "Move from administration into security-minded Linux operations." },
  { id: "linux-project-service", topic: "linux", level: "advanced", title: "Harden a Linux Service", provider: "SkillOS project", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html", kind: "project", language: "English", duration: "Project", description: "Practice running, observing, and recovering a small system service.", project: "Deploy a small service, restrict its file permissions, inspect logs, and document recovery steps." },
];

export function catalogResources(topic: string, language = "English") {
  const normalized = topic.trim().toLowerCase();
  if (normalized.includes("linux")) return linux.map((resource) => ({ ...resource, language: language === "English" ? resource.language : `${resource.language} (explanations can be translated)` }));
  return [];
}
