import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  TASK_STATUSES,
  formatDate,
  initials,
  isOverdue,
  priorityTone,
  titleCase,
  type Task,
  type TaskStatus,
} from "@/lib/orbit";
import { cn } from "@/lib/utils";

function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { workspace } = useWorkspace();
  const assignee = workspace?.members.find((m) => m.user_id === task.assignee_id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border border-border bg-card p-3 transition-shadow",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
          aria-label={`Drag ${task.title}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-medium leading-snug">{task.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={priorityTone(task.priority)}>
              {titleCase(task.priority)}
            </Badge>
            {task.due_date ? (
              <span className={cn("label-mono", isOverdue(task) ? "text-destructive" : "text-muted-foreground")}>
                {formatDate(task.due_date)}
              </span>
            ) : null}
            {assignee ? (
              <span className="label-mono ml-auto flex size-5 items-center justify-center rounded-sm bg-muted text-[10px]">
                {initials(assignee.full_name ?? assignee.email)}
              </span>
            ) : null}
          </span>
        </button>
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  onOpen,
  onAdd,
  canCreate,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onAdd: (status: TaskStatus) => void;
  canCreate: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        "flex min-h-64 w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30 p-3",
        isOver && "border-foreground/40 bg-accent/40",
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="label-mono text-muted-foreground">
          {label} · {tasks.length}
        </h3>
        {canCreate ? (
          <Button variant="ghost" size="icon" className="size-6" aria-label={`Add task to ${label}`} onClick={() => onAdd(status)}>
            <Plus className="size-3.5" />
          </Button>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
        {tasks.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing here
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function KanbanBoard({
  tasks,
  onOpenTask,
  onAddTask,
  onStatusChange,
  canEdit,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  canEdit: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const { id } of TASK_STATUSES) map.set(id, []);
    for (const task of tasks) map.get(task.status)?.push(task);
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleEnd(event: DragEndEvent) {
    setActiveId(null);
    const overId = event.over?.id;
    if (!overId) return;
    const task = tasks.find((t) => t.id === event.active.id);
    const status = String(overId) as TaskStatus;
    if (!task || task.status === status) return;
    onStatusChange(task, status);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((column) => (
          <Column
            key={column.id}
            status={column.id}
            label={column.label}
            tasks={grouped.get(column.id) ?? []}
            onOpen={onOpenTask}
            onAdd={onAddTask}
            canCreate={canEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-64 rounded-md border border-border bg-card p-3 shadow-lg">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
