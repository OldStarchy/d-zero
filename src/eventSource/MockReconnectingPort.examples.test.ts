/**
 * Example usage of MockReconnectingPort for testing event-based systems.
 *
 * This file demonstrates how to use MockReconnectingPort to test:
 * - Message passing between components
 * - Connection/disconnection scenarios
 * - Message queuing and delivery patterns
 * - Event listener management
 */

import { describe, it, expect, vi } from 'vitest';
import { MockReconnectingPort, createMockPortPair } from './MockReconnectingPort';
import type { EventMessage } from './EventMessage';
import type { BaseEvent } from './BaseEvent';

// Example event type for testing
interface TestEvent extends BaseEvent {
	type: 'test';
	payload: string;
}

describe('MockReconnectingPort Usage Examples', () => {
	it('should simulate message exchange between components', async () => {
		// Create a pair of connected ports for bidirectional communication
		const { port1, port2 } = createMockPortPair<
			EventMessage<TestEvent>,
			EventMessage<TestEvent>
		>();

		// Set up message listeners
		const port1Messages: EventMessage<TestEvent>[] = [];
		const port2Messages: EventMessage<TestEvent>[] = [];

		port1.addEventListener('message', (event) => {
			port1Messages.push(event.data);
		});

		port2.addEventListener('message', (event) => {
			port2Messages.push(event.data);
		});

		// Create test messages
		const message1: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-1',
				timestamp: Date.now(),
				source: { clientId: 'client1' },
				type: 'test',
				payload: 'Hello from port1'
			}
		};

		const message2: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'test-2',
				timestamp: Date.now(),
				source: { clientId: 'client2' },
				type: 'test',
				payload: 'Hello from port2'
			}
		};

		// Send messages between ports
		port1.postMessage(message1);
		port2.postMessage(message2);

		// Wait for async message delivery
		await new Promise(resolve => setTimeout(resolve, 10));

		// Verify messages were delivered
		expect(port2Messages).toHaveLength(1);
		expect(port2Messages[0]).toEqual(message1);
		expect(port1Messages).toHaveLength(1);
		expect(port1Messages[0]).toEqual(message2);
	});

	it('should simulate connection management in event systems', async () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(true);

		// Track connection state changes
		const connectionEvents: string[] = [];

		port.addEventListener('connected', () => {
			connectionEvents.push('connected');
		});

		port.addEventListener('disconnected', () => {
			connectionEvents.push('disconnected');
		});

		// Simulate disconnection and reconnection
		port.disconnect();
		port.connect();

		expect(connectionEvents).toEqual(['disconnected', 'connected']);
	});

	it('should simulate message queuing during disconnection', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(false); // Start disconnected

		const testMessage: EventMessage<TestEvent> = {
			type: 'event',
			event: {
				id: 'queued-1',
				timestamp: Date.now(),
				source: { clientId: 'client1' },
				type: 'test',
				payload: 'Queued message'
			}
		};

		// Send message while disconnected
		port.postMessage(testMessage);

		// Verify message is queued
		expect(port.getQueuedMessages()).toContain(testMessage);
		expect(port.getQueuedMessages()).toHaveLength(1);

		// Connect and verify queue is flushed
		port.connect();
		expect(port.getQueuedMessages()).toHaveLength(0);
	});

	it('should test event listener cleanup with AbortSignal', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>();
		const messageListener = vi.fn();
		const controller = new AbortController();

		// Add listener with AbortSignal
		port.addEventListener('message', messageListener, {
			signal: controller.signal
		});

		// Verify listener is registered
		expect(port.getListeners().get('message')?.size).toBe(1);

		// Abort the signal to remove listener
		controller.abort();

		// Verify listener is removed
		expect(port.getListeners().get('message')?.size).toBe(0);
	});

	it('should simulate error conditions', () => {
		const port = new MockReconnectingPort<EventMessage<TestEvent>>(false);

		// Should throw when trying to receive message while disconnected
		expect(() => {
			port.receiveMessage({
				type: 'event',
				event: {
					id: 'error-test',
					timestamp: Date.now(),
					source: { clientId: 'client1' },
					type: 'test',
					payload: 'This should fail'
				}
			});
		}).toThrow('Cannot receive messages when disconnected');
	});
});
