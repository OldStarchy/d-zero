import type {BaseEvent} from './BaseEvent';
import type {EventMessage} from './EventMessage';
import {EventSource} from './EventSource';
import type {ReconnectingPort} from './ReconnectingPort';

class HostEventSource<E extends BaseEvent, State> extends EventSource<E, State> {
	private clients = new Map<string, {port: ReconnectingPort<EventMessage<E>>; dispose: () => void;}>();
	private pastEventIds = new Set<string>();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: E) => State,
		private validate: (event: Omit<E, 'timestamp' | 'source'>, clientId: string) => boolean,
		private filterForClient: (event: E, clientId: string) => E | null
	) {
		super(initialState, applyEvent);
	}

	protected validateClientEvent(proposedEvent: Omit<E, 'timestamp' | 'source'>, clientId: string): boolean {
		if (this.pastEventIds.has(proposedEvent.id)) {
			console.warn(`Rejected duplicate event ID from client ${clientId}:`, proposedEvent.id);
			return false;
		}

		if (!this.validate(proposedEvent, clientId)) {
			console.warn(`Rejected event from client ${clientId}:`, proposedEvent);
			return false;
		}

		return true;
	}

	protected receiveFromClient(proposedEvent: Omit<E, 'timestamp' | 'source'>, clientId: string): void {
		if (!this.validateClientEvent(proposedEvent, clientId)) {
			this.sendRejectionToClient(proposedEvent.id, clientId);
			return;
		}

		const authoritativeEvent = {
			...proposedEvent,
			timestamp: Date.now(),
			source: {clientId},
		} as E;

		this.pastEventIds.add(authoritativeEvent.id);

		this.dispatch(authoritativeEvent);
		this.broadcast(authoritativeEvent);
	}

	private broadcast(authoritativeEvent: E): void {
		for (const [otherClientId, client] of this.clients.entries()) {
			const filtered = this.filterForClient(authoritativeEvent, otherClientId);

			if (filtered) client.port.postMessage({
				type: 'event',
				event: filtered
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

	addClient(clientId: string, port: ReconnectingPort<EventMessage<E>>): void {
		const abortController = new AbortController();

		const dispose = () => abortController.abort();

		port.addEventListener('message', (event) => {
			const data = event.data;
			switch (data.type) {
				case 'event':
					this.receiveFromClient(data.event, clientId);
					break;

				case 'requestHistory': {
					const since = data.since;
					const eventsToSend = this.events.filter(e => e.timestamp > since).map(e => {
						const filtered = this.filterForClient(e, clientId);
						return filtered;
					}).filter((e): e is E => e !== null);

					port.postMessage({
						type: 'eventHistory',
						events: eventsToSend,
					});
					break;
				}
			}
		}, {signal: abortController.signal});

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

}
