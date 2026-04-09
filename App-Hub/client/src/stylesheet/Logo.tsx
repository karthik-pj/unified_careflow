import careflowLogoSrc from "@assets/CF_Logo_schattiert_1770733929107.png";

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

const sizeClasses: Record<LogoSize, string> = {
  xs: "h-6 w-auto",
  sm: "h-8 w-auto",
  md: "h-10 w-auto",
  lg: "h-14 w-auto",
  xl: "h-20 w-auto",
  hero: "w-[60vw] max-w-[500px] min-w-[220px] h-auto",
};

interface CareFlowLogoProps {
  size?: LogoSize;
  className?: string;
  withShadow?: boolean;
  "data-testid"?: string;
}

export function CareFlowLogo({
  size = "md",
  className = "",
  withShadow = true,
  "data-testid": testId = "img-careflow-logo",
}: CareFlowLogoProps) {
  const shadowClass = withShadow ? "drop-shadow-lg" : "";
  return (
    <img
      src={careflowLogoSrc}
      alt="CareFlow Systems"
      className={`${sizeClasses[size]} ${shadowClass} ${className}`.trim()}
      data-testid={testId}
    />
  );
}

export { careflowLogoSrc };
