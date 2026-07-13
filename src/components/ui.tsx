import type { ReactNode } from "react";
import type { Domain } from "../types";
import { domainJapanese } from "../lib/labels";

export const ProgressRing = ({
  value,
  label,
  size = 72,
}: {
  value: number;
  label?: string;
  size?: number;
}) => {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(value, 100)) / 100) * circumference;

  return (
    <div className="ringWrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="ringTrack"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ringValue"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ringText">{value}%</span>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
};

export const DomainBadge = ({ domain }: { domain: Domain }) => (
  <span className={`domainBadge domain-${domain}`}>{domainJapanese[domain]}</span>
);

export const RedAccentButton = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) => (
  <button
    className={`accentButton accentButton-${variant}`}
    disabled={disabled}
    type={type}
    onClick={onClick}
  >
    {children}
  </button>
);

export const CautionBox = ({ children, title = "言いすぎ注意" }: { children: ReactNode; title?: string }) => (
  <div className="cautionBox">
    <div className="cautionMark" aria-hidden="true">
      !
    </div>
    <div>
      <p className="cautionTitle">{title}</p>
      <div className="cautionText">{children}</div>
    </div>
  </div>
);

export const StatCard = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) => (
  <div className="statCard">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

export const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="emptyState">
    <p>{title}</p>
    <span>{text}</span>
  </div>
);
