import { useEffect, useMemo, useRef } from "react";

import Gantt from "frappe-gantt";

interface FrappeBoardTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  description?: string;
  createdBy?: string;
  assignees?: string[];
  priority?: "low" | "medium" | "high";
}

interface FrappeGanttChartProps {
  tasks: FrappeBoardTask[];
}

function toAssigneesLabel(assignees?: string[]) {
  if (!Array.isArray(assignees) || assignees.length === 0) {
    return "Nao definido";
  }

  return assignees.join(", ");
}

function getTaskPalette(priority?: "low" | "medium" | "high") {
  if (priority === "high") {
    return {
      color: "#d94848",
      color_progress: "#f5a3a3",
    };
  }

  if (priority === "medium") {
    return {
      color: "#d97706",
      color_progress: "#f8cf8b",
    };
  }

  return {
    color: "#2f6fe4",
    color_progress: "#9bc0ff",
  };
}

export function FrappeGanttChart({ tasks }: FrappeGanttChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const preparedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        ...getTaskPalette(task.priority),
        custom_class: task.priority ? `task-priority-${task.priority}` : undefined,
      })),
    [tasks]
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";

    if (preparedTasks.length === 0) {
      return;
    }

    const chart = new Gantt(containerRef.current, preparedTasks, {
      language: "pt",
      view_mode: "Week",
      view_mode_select: true,
      today_button: true,
      container_height: 640,
      popup_on: "click",
      readonly: true,
      lines: "both",
      scroll_to: "today",
      popup: (ctx) => {
        const task = ctx.task as unknown as FrappeBoardTask;
        const createdBy = task.createdBy?.trim() || "Nao definido";
        const assignees = toAssigneesLabel(task.assignees);

        ctx.set_title(task.name);
        ctx.set_subtitle(`${task.start} - ${task.end}`);
        ctx.set_details(
          `Criado por: ${createdBy}<br/>Atuando: ${assignees}<br/>Progresso: ${Math.round(
            task.progress ?? 0
          )}%`
        );

        return undefined;
      },
    });

    const pushLabelsOutside = () => {
      const barWrappers = containerRef.current?.querySelectorAll<SVGGElement>(".bar-wrapper");

      barWrappers?.forEach((barWrapper) => {
        const label = barWrapper.querySelector<SVGTextElement>(".bar-label");
        const bar = barWrapper.querySelector<SVGRectElement>(".bar");

        if (!label || !bar) {
          return;
        }

        const barBox = bar.getBBox();
        label.classList.add("big");
        label.setAttribute("text-anchor", "start");
        label.setAttribute("x", String(barBox.x + barBox.width + 10));
      });
    };

    const raf = window.requestAnimationFrame(() => {
      pushLabelsOutside();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      containerRef.current?.replaceChildren();
      void chart;
    };
  }, [preparedTasks]);

  if (preparedTasks.length === 0) {
    return <p className="scheduler-empty">Sem dados suficientes para montar o grafico de Gantt.</p>;
  }

  return <div ref={containerRef} className="frappe-gantt-wrapper" aria-label="Grafico de Gantt" />;
}
