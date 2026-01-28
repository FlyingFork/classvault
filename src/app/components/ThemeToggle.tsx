import * as React from "react";
import { useTheme } from "next-themes";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

export const ThemeToggle = ({}: React.ComponentPropsWithoutRef<
  typeof IconButton
>) => {
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  return (
    <Tooltip className="radix-themes-custom-fonts" content="Toggle theme">
      <IconButton
        size="3"
        variant="ghost"
        color="gray"
        aria-label="Toggle theme"
        onClick={() => {
          const newTheme = resolvedTheme === "dark" ? "light" : "dark";
          const newThemeMatchesSystem = newTheme === systemTheme;
          setTheme(newThemeMatchesSystem ? "system" : newTheme);
        }}
      >
        {resolvedTheme === "dark" ? (
          <SunIcon width="16" height="16" />
        ) : (
          <MoonIcon width="16" height="16" />
        )}
      </IconButton>
    </Tooltip>
  );
};
