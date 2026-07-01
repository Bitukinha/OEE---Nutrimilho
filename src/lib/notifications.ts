import { supabase } from "@/integrations/supabase/client";

type NotifyCallback = (msg: { table: string; event: string }) => void;

const tablesToWatch = [
  "registros_producao",
  "paradas",
  "equipamentos",
  "produtos_bloqueados",
];

// Local emitter so UI components (Header) can subscribe to notifications
const localEmitter = new EventTarget();

export function emitLocalNotification(payload: { table: string; event: string }) {
  localEmitter.dispatchEvent(new CustomEvent('localNotify', { detail: payload }));
}

export function onLocalNotify(cb: (payload: { table: string; event: string }) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  localEmitter.addEventListener('localNotify', handler as EventListener);
  return () => localEmitter.removeEventListener('localNotify', handler as EventListener);
}

export function initNotifications(onNotify: NotifyCallback) {
  const channel = supabase.channel("public-table-changes");

  tablesToWatch.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        const msg = { table, event: payload.eventType };
        // call user callback
        onNotify(msg);
        // also emit local notification for UI
        emitLocalNotification(msg);
      }
    );
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
}
