import type {BaseEvent} from './BaseEvent';
import {mergeSorted} from './mergeSorted';

export class EventSource<Event extends BaseEvent, State> {
	private readonly snapshotInterval: number;

	protected events: Event[] = [];
	protected subscribers: ((state: State) => void)[] = [];
	protected state: State;

	// Snapshot of state just before eventIndex
	protected snapshots: {state: State; eventIndex: number;}[] = [];

	constructor(
		private initialState: Readonly<State>,
		protected readonly applyEvent: (state: Readonly<State>, event: Event) => State,
		{snapshotInterval = 100} = {}
	) {
		if (snapshotInterval <= 0) {
			throw new Error('snapshotInterval must be a positive integer');
		}
		this.state = initialState;
		this.snapshotInterval = snapshotInterval;
	}

	getState(): Readonly<State> {
		return this.state;
	}

	subscribe(callback: (state: State) => void): () => void {
		const safeCallback = (state: State) => {
			try {
				callback(state);
			} catch (e) {
				console.error('Error in subscriber callback:', e);
			}
		}
		this.subscribers.push(safeCallback);
		safeCallback(this.state);

		return () => {
			const i = this.subscribers.indexOf(safeCallback);
			if (i !== -1) this.subscribers.splice(i, 1);
		}
	}

	protected dispatch(event: Event): void {
		this.events.push(event);
		this.state = this.applyEvent(this.state, event);
		this.notify();

		const latestSnapshot = this.getLatestSnapshot();

		if (this.events.length - latestSnapshot.eventIndex >= this.snapshotInterval) {
			this.createSnapshot();
		}
	}

	protected notify(): void {
		for (const subscriber of [...this.subscribers]) {
			subscriber(this.state);
		}
	}

	replay(events: Event[]): void {
		for (const event of events) {
			this.state = this.applyEvent(this.state, event);
		}
		this.notify();
	}

	protected generateEventId(): string {
		// return v4();
		return Math.random().toString(36).substring(2);
	}

	protected createSnapshot(): () => void {
		const snapshot = {state: this.state, eventIndex: this.events.length}
		this.snapshots.push(snapshot);

		return () => {
			const i = this.snapshots.indexOf(snapshot);
			if (i !== -1) this.snapshots.splice(i, 1);
		}
	}

	protected removeEvent(event: Event): void {
		const index = this.events.findIndex(e => e.id === event.id);
		if (index === -1) return;

		while (this.getLatestSnapshot().eventIndex > index) {
			this.dropLatestSnapshot();
		}

		const snapshot = this.getLatestSnapshot();

		const eventsToReplay = this.events.splice(snapshot.eventIndex).filter(e => e.id !== event.id);

		this.state = snapshot.state;
		this.events.push(...eventsToReplay);
		this.replay(eventsToReplay);
	}

	protected getLatestSnapshot(): {state: State; eventIndex: number;} {
		if (this.snapshots.length === 0) {
			return {state: this.initialState, eventIndex: 0};
		}
		return this.snapshots[this.snapshots.length - 1];
	}

	protected dropLatestSnapshot(): void {
		if (this.snapshots.length === 0) return;
		this.snapshots.pop();
	}

	private rollbackToSnapshotSilent(): Event[] {
		const snapshot = this.getLatestSnapshot();
		this.state = snapshot.state;
		const removedEvents = this.events.splice(snapshot.eventIndex);

		return removedEvents;
	}

	protected insertEvents(events: Event[]): void {
		if (events.length === 0) return;

		const firstNewEventTimestamp = events[0]!.timestamp;
		const postEventIndex = this.events.findIndex(e => e.timestamp > firstNewEventTimestamp);
		const insertIndex = postEventIndex === -1 ? this.events.length : postEventIndex;

		this.dropSnapshotsAfterEventIndex(insertIndex);

		const existingEvents = this.rollbackToSnapshotSilent();
		const newEvents: Event[] = mergeSorted(
			existingEvents,
			events,
			(a, b) =>
				a.timestamp !== b.timestamp
					? a.timestamp - b.timestamp
					: a.id.localeCompare(b.id)
		);

		this.events.push(...newEvents);
		this.replay(newEvents);
	}

	private dropSnapshotsAfterEventIndex(eventIndex: number): void {
		while (this.getLatestSnapshot().eventIndex > eventIndex) {
			this.dropLatestSnapshot();
		}
	}

	protected rebaseline(state: State): void {
		this.initialState = state;
		this.events = [];
		this.snapshots = [];
		this.state = state;
		this.notify();
	}
}
