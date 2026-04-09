import { versionString } from "./version";

interface CopyRightProps {
  year?: number;
  company?: string;
  showVersion?: boolean;
  versionPrefix?: string;
  variant?: "glass" | "default";
  className?: string;
  "data-testid"?: string;
}

export function CopyRight({
  year = new Date().getFullYear(),
  company = "CareFlow Systems GmbH",
  showVersion = true,
  versionPrefix = "V",
  variant = "glass",
  className = "",
  "data-testid": testId = "text-copyright",
}: CopyRightProps) {
  const colorClass =
    variant === "glass"
      ? "text-white/70"
      : "text-muted-foreground";

  return (
    <p
      className={`text-xs tracking-wide ${colorClass} ${className}`.trim()}
      data-testid={testId}
    >
      &copy;{year} {company}
      {showVersion && (
        <>
          {" "}&middot;{" "}{versionPrefix} {versionString}
        </>
      )}
    </p>
  );
}
