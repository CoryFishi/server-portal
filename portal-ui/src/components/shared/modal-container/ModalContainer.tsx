import { useEffect, type ReactNode } from "react";
import { RiCloseLine } from "react-icons/ri";

type ModalContainerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function ModalContainer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalContainerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal panel */}
      <div
        className={`relative z-10 w-full ${sizeClasses[size]} mx-4 bg-background-50 text-text-900 rounded-xl shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
          {title && (
            <h2 className="text-lg font-semibold text-text-900">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md text-text-500 hover:text-text-900 hover:bg-background-100 transition-all duration-150"
            aria-label="Close modal"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex-1 max-h-[60vh] overflow-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-background-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
