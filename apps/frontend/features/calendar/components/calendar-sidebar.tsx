import { Button } from "@/components/ui/button";
import LaunchUI from "@/logos/launch-ui";
import { TeamSwitcher } from "@/components/ui/team-switcher";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CalendarSidebar Component
 *
 * Displays account information, calendar lists, and filtering options.
 */
interface CalendarSidebarProps {
  eventsData: {
    accounts: Array<{
      id: string;
      name: string;
      email: string;
      calendars: Array<{
        id: string;
        name: string;
        color: string;
        events: any[];
      }>;
    }>;
  };
  selectedCalendars: Record<string, boolean>;
  onToggleCalendar: (calendarUniqueId: string) => void;
  onCloseSidebar?: () => void;
  isMobileView?: boolean;
}

function CalendarSidebar({
  eventsData,
  selectedCalendars,
  onToggleCalendar,
  onCloseSidebar,
  isMobileView,
}: CalendarSidebarProps) {
  // Helper function to get the color class.
  // Uses runtime checked state instead of data-[state=checked]: Tailwind variants
  // to avoid a Turbopack CSS parser bug with compound selectors on button elements.
  const getColorClass = (color: string, isChecked: boolean) => {
    if (!isChecked) return "";
    const colorMap: Record<string, string> = {
      blue: "border-blue-500 bg-blue-500 dark:bg-blue-500",
      indigo: "border-indigo-500 bg-indigo-500 dark:bg-indigo-500",
      purple: "border-purple-500 bg-purple-500 dark:bg-purple-500",
      pink: "border-pink-500 bg-pink-500 dark:bg-pink-500",
      red: "border-red-500 bg-red-500 dark:bg-red-500",
      orange: "border-orange-500 bg-orange-500 dark:bg-orange-500",
      amber: "border-amber-500 bg-amber-500 dark:bg-amber-500",
      yellow: "border-yellow-500 bg-yellow-500 dark:bg-yellow-500",
      lime: "border-lime-500 bg-lime-500 dark:bg-lime-500",
      green: "border-green-500 bg-green-500 dark:bg-green-500",
      emerald: "border-emerald-500 bg-emerald-500 dark:bg-emerald-500",
      teal: "border-teal-500 bg-teal-500 dark:bg-teal-500",
      cyan: "border-cyan-500 bg-cyan-500 dark:bg-cyan-500",
      sky: "border-sky-500 bg-sky-500 dark:bg-sky-500",
      gray: "border-gray-500 bg-gray-500 dark:bg-gray-500",
      rose: "border-rose-500 bg-rose-500 dark:bg-rose-500",
    };
    return colorMap[color] || "border-gray-500 bg-gray-500";
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col p-3 pr-5 text-left",
        isMobileView &&
          "bg-muted border-border dark:border-border/20 rounded-lg border shadow-2xl",
      )}
    >
      <div className="flex items-center gap-4">
        <TeamSwitcher
          teams={[
            {
              name: "Launch UI",
              logo: LaunchUI,
              plan: "Enterprise",
            },
          ]}
        />
        {isMobileView && onCloseSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={onCloseSidebar}
            aria-label="Close sidebar"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Calendar lists */}
      <div className="mt-6 flex flex-1 flex-col gap-8 px-2">
        {/* Dynamic calendar lists grouped by account */}
        {eventsData.accounts.map((account) => (
          <div key={account.id} className="flex flex-col gap-2">
            {/* Account name as subheading */}
            <h3 className="text-muted-foreground text-xs font-medium">
              {account.name}
            </h3>

            {/* Calendars for this account */}
            {account.calendars.map((calendar) => {
              const calendarUniqueId = `${account.id}-${calendar.id}`;
              return (
                <div
                  key={calendarUniqueId}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={calendarUniqueId}
                    checked={selectedCalendars[calendarUniqueId]}
                    onCheckedChange={() => onToggleCalendar(calendarUniqueId)}
                    className={getColorClass(calendar.color, selectedCalendars[calendarUniqueId] ?? false)}
                  />
                  <label
                    htmlFor={calendarUniqueId}
                    className="cursor-pointer text-sm"
                  >
                    {calendar.name}
                  </label>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Additional controls */}
      <div className="mt-auto p-2">
        <Button variant="default" className="w-full">
          Create Event
        </Button>
      </div>
    </div>
  );
}

export default CalendarSidebar;
