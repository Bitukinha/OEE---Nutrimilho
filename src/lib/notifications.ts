import { supabase } from "@/integrations/supabase/client";

type NotifyCallback = (msg: { table: string; event: string }) => void;

const tablesToWatch = [
  "registros_producao",
  "paradas",
  "equipamentos",
  "produtos_bloqueados",
];

export function initNotifications(onNotify: NotifyCallback) {
  const channel = supabase.channel("public-table-changes");

  tablesToWatch.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        onNotify({ table, event: payload.eventType });
      }
    );
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
}
