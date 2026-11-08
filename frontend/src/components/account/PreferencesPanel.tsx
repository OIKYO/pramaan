import { Monitor, Moon, Sun } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/switch";
import { useReduceMotion } from "@/lib/preferences";
import { THEME_LABEL, useTheme, type ThemeChoice } from "@/lib/theme";

const THEMES: Segment<ThemeChoice>[] = [
  { value: "light", label: THEME_LABEL.light, icon: Sun },
  { value: "dark", label: THEME_LABEL.dark, icon: Moon },
  { value: "system", label: THEME_LABEL.system, icon: Monitor },
];

export function PreferencesPanel() {
  const { choice, setTheme } = useTheme();
  const [reduce, setReduce] = useReduceMotion();
  return (
    <Panel title="Preferences" description="Saved in this browser.">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-strong">Theme</span>
          <SegmentedControl label="Theme" value={choice} onChange={setTheme} options={THEMES} />
        </div>
        <label className="flex items-start justify-between gap-4">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ink-strong">Reduce animations</span>
            <span className="text-muted-text">Panels and the theme change appear at once instead of fading.</span>
          </span>
          <Switch checked={reduce} onCheckedChange={setReduce} />
        </label>
      </div>
    </Panel>
  );
}
