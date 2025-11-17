import type { BaseEvent } from './BaseEvent';
import type { EventMessage } from './EventMessage';
import { EventSource } from './EventSource';
import type { ReconnectingPort } from './ReconnectingPort';

export default class HostEventSource<EventPayload, State> extends EventSource<
	EventPayload,
	State
> {
	private clients = new Map<
		string,
		{
			port: ReconnectingPort<EventMessage<BaseEvent<EventPayload>>>;
			dispose: () => void;
		}
	>();
	private pastEventIds = new Set<string>();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: EventPayload) => State,
		private validate: (
			event: Omit<BaseEvent<EventPayload>, 'timestamp' | 'source'>,
			clientId: string,
		) => boolean,
		private filterForClient: (
			event: EventPayload,
			clientId: string,
		) => EventPayload | null,
	) {
		super(initialState, applyEvent);
	}

	protected validateClientEvent(
		proposedEvent: Omit<BaseEvent<EventPayload>, 'timestamp' | 'source'>,
		clientId: string,
	): boolean {
		if (this.pastEventIds.has(proposedEvent.id)) {
			console.warn(
				`Rejected duplicate event ID from client ${clientId}:`,
				proposedEvent.id,
			);
			return false;
		}

		if (!this.validate(proposedEvent, clientId)) {
			console.warn(
				`Rejected event from client ${clientId}:`,
				proposedEvent,
			);
			return false;
		}

		return true;
	}

	protected receiveFromClient(
		proposedEvent: Omit<BaseEvent<EventPayload>, 'timestamp' | 'source'>,
		clientId: string,
	): void {
		if (!this.validateClientEvent(proposedEvent, clientId)) {
			this.sendRejectionToClient(proposedEvent.id, clientId);
			return;
		}

		const authoritativeEvent = {
			...proposedEvent,
			timestamp: Date.now(),
			source: { clientId },
		} as BaseEvent<EventPayload>;

		this.dispatchEvent(authoritativeEvent);
	}

	public dispatch(payload: EventPayload): void | null {
		const event: BaseEvent<EventPayload> = {
			id: this.generateEventId(),
			source: { clientId: 'host' },
			timestamp: Date.now(),
			context: undefined,
			payload,
		};

		this.pastEventIds.add(event.id);

		super.dispatchEvent(event);
		this.broadcast(event);
	}

	private broadcast(authoritativeEvent: BaseEvent<EventPayload>): void {
		for (const [otherClientId, client] of this.clients.entries()) {
			const filtered = this.filterForClient(
				authoritativeEvent.payload,
				otherClientId,
			);

			if (filtered)
				client.port.postMessage({
					type: 'event',
					event: {
						...authoritativeEvent,
						payload: filtered,
					},
				});
		}
	}

	private sendRejectionToClient(eventId: string, clientId: string): void {
		const client = this.clients.get(clientId);

		if (client) {
			client.port.postMessage({
				type: 'rejection',
				eventId,
			});
		}
	}

	addClient(
		clientId: string,
		port: ReconnectingPort<EventMessage<BaseEvent<EventPayload>>>,
	): void {
		const abortController = new AbortController();

		const dispose = () => abortController.abort();

		port.addEventListener(
			'message',
			(event) => {
				const data = event.data;
				switch (data.type) {
					case 'event':
						this.receiveFromClient(data.event, clientId);
						break;

					case 'requestHistory': {
						const since = data.since;
						const eventsToSend = this.events
							.filter((e) => e.timestamp > since)
							.map((e) => {
								const filtered = this.filterForClient(
									e.payload,
									clientId,
								);
								if (filtered !== null)
									return {
										...e,
										payload: filtered,
									} as BaseEvent<EventPayload>;
								return null;
							})
							.filter(
								(e): e is BaseEvent<EventPayload> => e !== null,
							);

						port.postMessage({
							type: 'eventHistory',
							events: eventsToSend,
						});
						break;
					}
				}
			},
			{ signal: abortController.signal },
		);

		this.clients.set(clientId, {
			port,
			dispose,
		});
	}

	removeClient(clientId: string): void {
		const client = this.clients.get(clientId);
		if (client) {
			client.dispose();
			this.clients.delete(clientId);
		}
	}

	subscribeEvents(
		callback: (events: BaseEvent<EventPayload>[]) => void,
	): () => void {
		return this.subscribe<BaseEvent<EventPayload>[]>(
			(events) => callback(events),
			{
				selector: (state) => this.events.slice(),
			},
		);
	}

	drop() {
		const e = this.events.at(-1);
		if (e) this.removeEvent(e);
	}
}
