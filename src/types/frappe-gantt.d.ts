declare module "frappe-gantt" {
  export interface FrappeTaskLike {
    id: string | number;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
    [key: string]: unknown;
  }

  export type FrappePopupContext = {
    task: FrappeTaskLike;
    chart: unknown;
    get_title: () => HTMLElement;
    set_title: (title: string) => void;
    get_subtitle: () => HTMLElement;
    set_subtitle: (subtitle: string) => void;
    get_details: () => HTMLElement;
    set_details: (details: string) => void;
    add_action: (html: string, cb: (task: FrappeTaskLike, chart: unknown, event: MouseEvent) => void) => void;
  };

  export interface FrappeGanttOptions {
    language?: string;
    view_mode?: "Hour" | "Quarter Day" | "Half Day" | "Day" | "Week" | "Month" | "Year" | string;
    view_mode_select?: boolean;
    today_button?: boolean;
    container_height?: "auto" | number;
    column_width?: number;
    popup_on?: "click" | "hover";
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    lines?: "none" | "vertical" | "horizontal" | "both";
    scroll_to?: "today" | "start" | "end" | string;
    popup?: false | ((context: FrappePopupContext) => string | undefined | false);
    [key: string]: unknown;
  }

  export default class Gantt {
    constructor(
      wrapper: string | HTMLElement | SVGElement,
      tasks: FrappeTaskLike[],
      options?: FrappeGanttOptions
    );
    update_options(options: FrappeGanttOptions): void;
    change_view_mode(mode?: string | Record<string, unknown>, maintain_pos?: boolean): void;
    scroll_current(): void;
    update_task(id: string | number, details: Partial<FrappeTaskLike>): void;
  }
}
