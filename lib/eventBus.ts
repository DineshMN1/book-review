// super-light pub/sub for this MVP
export type Handler<T> = (payload: T) => void;

class EventBus {
  private topics = new Map<string, Set<Handler<any>>>();

  on<T>(topic: string, handler: Handler<T>) {
    if (!this.topics.has(topic)) this.topics.set(topic, new Set());
    this.topics.get(topic)!.add(handler as Handler<any>);
    return () => this.off(topic, handler);
  }

  off<T>(topic: string, handler: Handler<T>) {
    this.topics.get(topic)?.delete(handler as Handler<any>);
  }
emit<T>(topic: string, payload: T) {
    this.topics.get(topic)?.forEach((h) => h(payload));
  }
}

export const bus = new EventBus();

export const TOPIC = {
  BOOK_ADDED: 'book:added',
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  TOAST: 'ui:toast',
} as const;

export type ToastPayload = { id?: string; type?: 'success'|'error'|'info'; message: string };