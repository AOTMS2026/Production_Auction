"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

interface TeamMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const TeamMenu: React.FC<TeamMenuProps> = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="size-7 rounded-lg bg-[#071822]/80 hover:bg-[#0d2a3a] border border-[#1b3e52] hover:border-[#00d2ee]/50 text-[#7fa3b0] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
        title="Team Options"
      >
        <MoreVertical className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 rounded-xl bg-[#03151f] border border-[#1b3e52] shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#00d2ee]/15 hover:text-[#00d2ee] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit2 className="size-3.5" />
            <span>Edit Team</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Team</span>
          </button>
        </div>
      )}
    </div>
  );
};
