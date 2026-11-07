import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { SegmentedControl, type Segment } from "./SegmentedControl";

const OPTIONS: Segment<ThemeChoice>[] = [
  { value: "light", label: "Light theme", icon: Sun, iconOnly: true },
  { value: "dark", label: "Midnight theme", icon: Moon, iconOnly: true },
  { value: "system", label: "Match this device", icon: Monitor, iconOnly: true },
];

/** Light, midnight, or whatever the device uses. Remembered in this browser. */
export function ThemeToggle() {
  const { choice, setTheme } = useTheme();
  return <SegmentedControl label="Theme" size="sm" value={choice} onChange={setTheme} options={OPTIONS} />;
}
