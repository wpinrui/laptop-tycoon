import { type LucideIcon } from "lucide-react";
import { useNavigation } from "../../navigation/NavigationContext";
import { Screen } from "../../navigation/types";
import { tokens } from "../../shell/tokens";
import { cardStyle, cardTitleStyle } from "./styles";

interface BentoCardProps {
  title: string;
  icon: LucideIcon;
  screen?: Screen;
  children: React.ReactNode;
}

export function BentoCard({ title, icon: Icon, screen, children }: BentoCardProps) {
  const { navigateTo } = useNavigation();

  return (
    <div
      style={{
        ...cardStyle,
        cursor: screen ? "pointer" : "default",
      }}
      onClick={screen ? () => navigateTo(screen) : undefined}
      onMouseEnter={screen ? (e) => {
        e.currentTarget.style.background = tokens.colors.cardBgHover;
      } : undefined}
      onMouseLeave={screen ? (e) => {
        e.currentTarget.style.background = tokens.colors.cardBg;
      } : undefined}
    >
      <h3 style={cardTitleStyle}>
        <Icon size={20} color={tokens.colors.text} />
        {title}
      </h3>
      {children}
    </div>
  );
}
