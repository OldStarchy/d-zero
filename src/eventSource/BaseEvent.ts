export interface BaseEvent {
	id: string;
	type: string;
	timestamp: number;
	source: {clientId: string;};
	context?: Record<string, any>;
}
