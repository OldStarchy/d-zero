import type { ReconnectingPort } from './ReconnectingPort';

// Local copy of the event map interface since it's not exported
interface ReconnectingPortEventMap<T> {
	message: MessageEvent<T>;
	messageerror: MessageEvent;
	connected: Event;
	disconnected: Event;
}

/**
 * Mock implementation of ReconnectingPort for testing purposes.
 * Allows controlling connection state and message flow programmatically.
 */
export class MockReconnectingPort<T> implements ReconnectingPort<T> {
	private listeners = new Map<keyof ReconnectingPortEventMap<T>, Set<Function>>();
	private _connected = true;
	private messageQueue: T[] = [];

	constructor(connected: boolean = true) {
		this._connected = connected;
	}

	get connected(): boolean {
		return this._connected;
	}

	postMessage(message: T): void {
		if (!this._connected) {
			// Queue messages when disconnected (typical behavior)
			this.messageQueue.push(message);
			return;
		}

		// In a real implementation, this would send over network
		// For testing, we can simulate immediate or delayed delivery
		this.simulateMessageDelivery(message);
	}

	addEventListener<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		listener: (this: ReconnectingPort<T>, ev: ReconnectingPortEventMap<T>[K]) => any,
		options?: { signal?: AbortSignal }
	): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}

		this.listeners.get(type)!.add(listener);

		// Handle AbortSignal
		if (options?.signal) {
			options.signal.addEventListener('abort', () => {
				this.removeEventListener(type, listener);
			});
		}
	}

	removeEventListener<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		listener: (this: ReconnectingPort<T>, ev: ReconnectingPortEventMap<T>[K]) => any
	): void {
		const listeners = this.listeners.get(type);
		if (listeners) {
			listeners.delete(listener);
		}
	}

	// Test utilities

	/**
	 * Simulate receiving a message from the remote end
	 */
	receiveMessage(data: T): void {
		if (!this._connected) {
			throw new Error('Cannot receive messages when disconnected');
		}

		this.dispatchEvent('message', this.createMessageEvent('message', data));
	}

	/**
	 * Simulate a message error
	 */
	receiveMessageError(error?: any): void {
		this.dispatchEvent('messageerror', this.createMessageEvent('messageerror', error));
	}

	/**
	 * Simulate connection establishment
	 */
	connect(): void {
		if (this._connected) return;

		this._connected = true;
		this.dispatchEvent('connected', this.createEvent('connected'));

		// Flush queued messages
		const queuedMessages = [...this.messageQueue];
		this.messageQueue = [];
		queuedMessages.forEach(message => this.postMessage(message));
	}

	/**
	 * Simulate connection loss
	 */
	disconnect(): void {
		if (!this._connected) return;

		this._connected = false;
		this.dispatchEvent('disconnected', this.createEvent('disconnected'));
	}

	/**
	 * Get messages that were sent but not yet delivered (useful for testing queuing behavior)
	 */
	getQueuedMessages(): T[] {
		return [...this.messageQueue];
	}

	/**
	 * Clear all queued messages (useful for testing)
	 */
	clearQueue(): void {
		this.messageQueue = [];
	}

	/**
	 * Get all registered listeners for debugging
	 */
	getListeners(): Map<keyof ReconnectingPortEventMap<T>, Set<Function>> {
		return new Map(this.listeners);
	}

	private createMessageEvent<D>(type: string, data: D): MessageEvent<D> {
		// Create a minimal MessageEvent-like object for testing
		// Using unknown first to avoid type overlap issues
		return {
			data,
			type,
			target: null,
			currentTarget: null,
			lastEventId: '',
			origin: '',
			ports: [],
			source: null,
		} as unknown as MessageEvent<D>;
	}

	private createEvent(type: string): Event {
		// Create a minimal Event-like object for testing
		// Using unknown first to avoid type overlap issues
		return {
			type,
			target: null,
			currentTarget: null,
			bubbles: false,
			cancelable: false,
			defaultPrevented: false,
		} as unknown as Event;
	}

	private dispatchEvent<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		event: ReconnectingPortEventMap<T>[K]
	): void {
		const listeners = this.listeners.get(type);
		if (listeners) {
			listeners.forEach(listener => {
				try {
					listener.call(this, event);
				} catch (error) {
					console.error(`Error in ${String(type)} listener:`, error);
				}
			});
		}
	}

	private simulateMessageDelivery(_message: T): void {
		// For testing, we can simulate different delivery patterns
		// This is a simple immediate delivery - real tests might want to override this
		// or add delays, failures, etc.
	}
}

/**
 * Factory function to create a pair of connected mock ports for testing bidirectional communication
 */
export function createMockPortPair<T1, T2>(): {
	port1: MockReconnectingPort<T1> & { peer: MockReconnectingPort<T2> };
	port2: MockReconnectingPort<T2> & { peer: MockReconnectingPort<T1> };
} {
	const port1 = new MockReconnectingPort<T1>();
	const port2 = new MockReconnectingPort<T2>();

	// Override postMessage to deliver to peer
	const originalPostMessage1 = port1.postMessage.bind(port1);
	const originalPostMessage2 = port2.postMessage.bind(port2);

	port1.postMessage = (message: T1) => {
		originalPostMessage1(message);
		if (port1.connected && port2.connected) {
			// Simulate network delay
			setTimeout(() => {
				try {
					(port2 as any).receiveMessage(message);
				} catch (error) {
					// Peer might be disconnected
				}
			}, 0);
		}
	};

	port2.postMessage = (message: T2) => {
		originalPostMessage2(message);
		if (port1.connected && port2.connected) {
			// Simulate network delay
			setTimeout(() => {
				try {
					(port1 as any).receiveMessage(message);
				} catch (error) {
					// Peer might be disconnected
				}
			}, 0);
		}
	};

	return {
		port1: Object.assign(port1, { peer: port2 }),
		port2: Object.assign(port2, { peer: port1 }),
	};
}
