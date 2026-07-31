import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelative } from "@/lib/orbit";

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  const userId = workspace?.userId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", orgId, userId],
    enabled: Boolean(orgId && userId),
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, is_read, created_at")
        .eq("organization_id", orgId!)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", orgId, userId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, orgId, queryClient]);

  return query;
}

export function NotificationBell() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.is_read).length;

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", workspace!.userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-signal-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="label-mono text-muted-foreground">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={!unread || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {(data ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(data ?? []).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => !item.is_read && markOne.mutate(item.id)}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-accent"
                  >
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.is_read ? "bg-border" : "bg-signal"}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.title}</span>
                      {item.body ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.body}
                        </span>
                      ) : null}
                      <span className="label-mono mt-1 block text-[10px] text-muted-foreground">
                        {formatRelative(item.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
