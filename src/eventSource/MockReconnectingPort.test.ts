import { describe, it, expect, vi } from 'vitest';
import { MockReconnectingPort, createMockPortPair } from './MockReconnectingPort';
import type { EventMessage } from './EventMessage';
import type { BaseEvent } from './BaseEvent';

// Example event type for testing
interface TestEvent extends BaseEvent {
	type: 'test';
	payload: string;
}

describe('MockReconnectingPort', () => {
	it('should allow adding event listeners', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>();
		const messageListener = vi.fn();

		port.addEventListener('message', messageListener);

		expect(port.getListeners().get('message')?.size).toBe(1);
	});

	it('should receive messages when connected', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(true);
		const messageListener = vi.fn();

		port.addEventListener('message', messageListener);

		const testMessage: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'hello'
			}
		};

		port.receiveMessage(testMessage);

		expect(messageListener).toHaveBeenCalledWith(
			expect.objectContaining({ data: testMessage })
		);
	});

	it('should queue messages when disconnected', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(false);

		const testMessage: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'hello'
			}
		};

		port.postMessage(testMessage);

		expect(port.getQueuedMessages()).toContain(testMessage);
	});

	it('should flush queued messages on connect', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(false);
		const messageListener = vi.fn();

		port.addEventListener('message', messageListener);

		const testMessage: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'hello'
			}
		};

		// Send message while disconnected
		port.postMessage(testMessage);
		expect(port.getQueuedMessages()).toContain(testMessage);

		// Connect and verify queue is flushed
		port.connect();
		expect(port.getQueuedMessages()).toHaveLength(0);
	});

	it('should emit connected event when connecting', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(false);
		const connectedListener = vi.fn();

		port.addEventListener('connected', connectedListener);
		port.connect();

		expect(connectedListener).toHaveBeenCalled();
		expect(port.connected).toBe(true);
	});

	it('should emit disconnected event when disconnecting', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(true);
		const disconnectedListener = vi.fn();

		port.addEventListener('disconnected', disconnectedListener);
		port.disconnect();

		expect(disconnectedListener).toHaveBeenCalled();
		expect(port.connected).toBe(false);
	});

	it('should handle AbortSignal for removing listeners', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>();
		const messageListener = vi.fn();
		const controller = new AbortController();

		port.addEventListener('message', messageListener, { signal: controller.signal });
		expect(port.getListeners().get('message')?.size).toBe(1);

		controller.abort();
		expect(port.getListeners().get('message')?.size).toBe(0);
	});
});

describe('createMockPortPair', () => {
	it('should create a bidirectional communication channel', async () => {
		const { port1, port2 } = createMockPortPair<
			EventMessage<TestEvent>,
			EventMessage<TestEvent>
		>();

		const port1Listener = vi.fn();
		const port2Listener = vi.fn();

		port1.addEventListener('message', port1Listener);
		port2.addEventListener('message', port2Listener);

		const message1: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'from port1'
			}
		};

		const message2: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-2',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'from port2'
			}
		};

		// Send messages between ports
		port1.postMessage(message1);
		port2.postMessage(message2);

		// Wait for async message delivery
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(port2Listener).toHaveBeenCalledWith(
			expect.objectContaining({ data: message1 })
		);
		expect(port1Listener).toHaveBeenCalledWith(
			expect.objectContaining({ data: message2 })
		);
	});

	it('should not deliver messages when peer is disconnected', async () => {
		const { port1, port2 } = createMockPortPair<
			EventMessage<TestEvent>,
			EventMessage<TestEvent>
		>();

		const port2Listener = vi.fn();
		port2.addEventListener('message', port2Listener);

		// Disconnect port2
		port2.disconnect();

		const message: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'test' },
				type: 'test',
				payload: 'hello'
			}
		};

		port1.postMessage(message);

		// Wait for potential async delivery
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(port2Listener).not.toHaveBeenCalled();
	});
});
