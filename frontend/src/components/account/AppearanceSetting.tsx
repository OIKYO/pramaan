import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { useTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: Segment<ThemeChoice>[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Midnight", icon: Moon },
  { value: "system", label: "Match this device", icon: Monitor },
];

/** The theme, remembered in this browser. */
export function AppearanceSetting() {
  const { choice, setTheme } = useTheme();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-strong">Theme</span>
      <SegmentedControl label="Theme" value={choice} onChange={setTheme} options={OPTIONS} />
    </div>
  );
}
