interface ReconnectingPortEventMap<T> {
	message: MessageEvent<T>;
	messageerror: MessageEvent;
	connected: Event;
	disconnected: Event;
}
export interface ReconnectingPort<T> {
	postMessage(message: T): void;
	addEventListener<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		listener: (this: ReconnectingPort<T>, ev: ReconnectingPortEventMap<T>[K]) => any,
		options?: {signal?: AbortSignal;}
	): void;
}
