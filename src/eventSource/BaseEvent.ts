export interface BaseEvent<Payload> {
	id: string;
	timestamp: number;
	source: { clientId: string };
	context?: Record<string, any>;
	payload: Payload;
}
