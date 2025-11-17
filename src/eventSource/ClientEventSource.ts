import type { BaseEvent } from './BaseEvent';
import type { EventMessage } from './EventMessage';
import { EventSource } from './EventSource';
import type { ReconnectingPort } from './ReconnectingPort';

class ClientEventSource<E extends BaseEvent, State> extends EventSource<
	E,
	State
> {
	private static readonly PROPOSED_EVENT_RETRY_TIMEOUT = 5000; // 5 seconds

	private pending: Map<string, E> = new Map();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: E) => State,
		private port: ReconnectingPort<EventMessage<E>>,
	) {
		super(initialState, applyEvent);

		this.port.addEventListener('message', (event) => {
			const data = event.data;
			if (data.type === 'event') {
				this.receiveFromHost(data.event);
			} else if (data.type === 'rejection') {
				this.rejectPendingEvent(data.eventId);
			} else if (data.type === 'eventHistory') {
				this.insertEvents(data.events);
			}
		});

		this.port.addEventListener('connected', () => {
			// Resend pending events
			for (const event of this.pending.values()) {
				this.sendToHost(event);
			}

			const latestTimestamp =
				this.events[this.events.length - 1]?.timestamp || 0;
			this.requestEventHistory(latestTimestamp);
		});
	}

	propose(eventData: Omit<E, 'id' | 'timestamp' | 'source'>): void {
		const proposedEvent = {
			...eventData,
			id: this.generateEventId(),
			timestamp: Date.now(),
		} as E;

		this.pending.set(proposedEvent.id, proposedEvent);
		this.dispatchEvent(proposedEvent);

		this.sendToHost(proposedEvent);

		const retry = () => {
			if (this.pending.has(proposedEvent.id)) {
				this.sendToHost(proposedEvent);
			}

			setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
		};

		setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
	}

	protected receiveFromHost(event: E): void {
		this.pending.delete(event.id);
		this.dispatchEvent(event);
	}

	protected rejectPendingEvent(eventId: string): void {
		const rejectedEvent = this.pending.get(eventId);
		if (!rejectedEvent) return;
		this.pending.delete(eventId);

		this.removeEvent(rejectedEvent);
	}

	private sendToHost(event: E): void {
		this.port.postMessage({
			type: 'event',
			event,
		});
	}

	private requestEventHistory(sinceTimestamp: number): void {
		this.port.postMessage({
			type: 'requestHistory',
			since: sinceTimestamp,
		});
	}
}
