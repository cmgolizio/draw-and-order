"use client";

import { useMemo, useState } from "react";

import { ActionButton, UploadActionButton } from "./ActionButton";

export default function MobileActionButtons({
  toolbarOpen,
  descriptionOpen,
  revealActive,
  silhouetteActive,
  silhouetteAvailable,
  onToggleTools,
  onToggleDescription,
  onToggleReveal,
  onToggleSilhouette,
  onExpand,
  onUpload,
  currentSuspect,
}) {
  const [expandedButton, setExpandedButton] = useState(
    currentSuspect ? "description" : null
  );

  const buttons = useMemo(() => {
    const baseButtons = [
      {
        id: "tools",
        icon: "✏️",
        label: toolbarOpen ? "Close" : "Draw Tools",
        action: onToggleTools,
        ariaLabel: toolbarOpen ? "Close drawing tools" : "Toggle drawing tools",
      },
      {
        id: "description",
        icon: "ℹ️",
        label: descriptionOpen ? "Close" : "AI Panel",
        action: onToggleDescription,
        ariaLabel: descriptionOpen
          ? "Close AI panel"
          : "Toggle AI suspect panel",
      },
      {
        id: "reveal",
        icon: "👁️",
        label: revealActive ? "Hide Suspect" : "Reveal Suspect",
        action: onToggleReveal,
        ariaLabel: revealActive ? "Hide suspect" : "Reveal suspect",
      },
    ];

    if (silhouetteAvailable) {
      baseButtons.push({
        id: "silhouette",
        icon: "🧑",
        label: silhouetteActive ? "Hide guide" : "Silhouette guide",
        action: onToggleSilhouette,
        ariaLabel: silhouetteActive ? "Hide silhouette" : "Show silhouette",
      });
    }

    return baseButtons;
  }, [
    toolbarOpen,
    descriptionOpen,
    revealActive,
    silhouetteAvailable,
    silhouetteActive,
    onToggleTools,
    onToggleDescription,
    onToggleReveal,
    onToggleSilhouette,
  ]);

  const requestExpand = (id) => {
    if (expandedButton !== id) {
      onExpand?.(id);
      setExpandedButton(id);
      return true;
    }

    return false;
  };

  const handleButtonClick = (button) => (e) => {
    e.preventDefault();

    if (requestExpand(button.id)) return;

    button.action?.(e);
  };

  return (
    <div className='fixed bottom-5 left-4 right-4 z-40 flex justify-end gap-3 pointer-events-none'>
      <UploadActionButton
        expandedButton={expandedButton}
        requestExpand={requestExpand}
        onUpload={onUpload}
      />
      {buttons.map((button) => (
        <ActionButton
          key={button.id}
          id={button.id}
          icon={button.icon}
          label={button.label}
          onClick={handleButtonClick(button)}
          expandedButton={expandedButton}
          ariaLabel={button.ariaLabel}
        />
      ))}
    </div>
  );
}
