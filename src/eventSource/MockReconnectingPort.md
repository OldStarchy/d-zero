# MockReconnectingPort

A mock implementation of `ReconnectingPort` for testing event-based systems with WebSocket-like communication patterns.

## Features

- **Full ReconnectingPort Interface**: Implements all methods and events from the ReconnectingPort interface
- **Connection Management**: Simulate connect/disconnect scenarios 
- **Message Queuing**: Queue messages when disconnected and flush on reconnection
- **Event Listener Support**: Full addEventListener/removeEventListener with AbortSignal support
- **Bidirectional Communication**: Factory function to create connected port pairs
- **Error Simulation**: Controlled error conditions for robust testing

## Basic Usage

```typescript
import { MockReconnectingPort } from './MockReconnectingPort';
import type { EventMessage } from './EventMessage';

// Create a mock port (connected by default)
const port = new MockReconnectingPort<EventMessage<YourEvent>>();

// Add event listeners
port.addEventListener('message', (event) => {
  console.log('Received:', event.data);
});

port.addEventListener('connected', () => {
  console.log('Connected!');
});

// Simulate receiving a message
port.receiveMessage({
  type: 'event',
  event: { /* your event data */ }
});

// Simulate connection loss
port.disconnect();

// Messages sent while disconnected are queued
port.postMessage({ type: 'event', event: { /* event */ } });

// Reconnect and queued messages are flushed
port.connect();
```

## Connected Port Pairs

For testing bidirectional communication:

```typescript
import { createMockPortPair } from './MockReconnectingPort';

const { port1, port2 } = createMockPortPair<MessageType1, MessageType2>();

// Messages sent to port1 are delivered to port2's listeners
port1.postMessage(message);

// And vice versa
port2.postMessage(message);
```

## Testing Utilities

### Connection State
```typescript
// Check connection status
expect(port.connected).toBe(true);

// Simulate connection events
port.disconnect();
port.connect();
```

### Message Queuing
```typescript
// Check queued messages when disconnected
const queuedMessages = port.getQueuedMessages();
expect(queuedMessages).toHaveLength(2);

// Clear queue for testing
port.clearQueue();
```

### Event Listeners
```typescript
// Inspect registered listeners
const listeners = port.getListeners();
expect(listeners.get('message')?.size).toBe(1);

// Test AbortSignal cleanup
const controller = new AbortController();
port.addEventListener('message', listener, { signal: controller.signal });
controller.abort(); // Removes listener
```

## Integration with Event Sources

The mock is designed to work seamlessly with `ClientEventSource` and `HostEventSource`:

```typescript
// In your tests
const mockPort = new MockReconnectingPort<EventMessage<YourEvent>>();
const eventSource = new ClientEventSource(initialState, applyEvent, mockPort);

// Test event propagation
eventSource.propose({ /* event data */ });

// Simulate network issues
mockPort.disconnect();
// ... test reconnection logic
mockPort.connect();
```

## Error Simulation

```typescript
// Test error conditions
expect(() => {
  port.receiveMessage(message); // Throws when disconnected
}).toThrow('Cannot receive messages when disconnected');

// Test message errors
port.receiveMessageError(new Error('Network error'));
```

## Common Testing Patterns

### Testing Reconnection Logic
```typescript
it('should handle reconnection gracefully', async () => {
  const port = new MockReconnectingPort(false); // Start disconnected
  
  // Queue messages while offline
  port.postMessage(message1);
  port.postMessage(message2);
  
  // Connect and verify messages are delivered
  port.connect();
  await nextTick(); // Wait for async delivery
  
  expect(messageListener).toHaveBeenCalledTimes(2);
});
```

### Testing Event Listener Cleanup
```typescript
it('should clean up listeners on abort', () => {
  const controller = new AbortController();
  port.addEventListener('message', listener, { signal: controller.signal });
  
  controller.abort();
  
  expect(port.getListeners().get('message')?.size).toBe(0);
});
```

### Testing Bidirectional Communication
```typescript
it('should enable peer-to-peer communication', async () => {
  const { port1, port2 } = createMockPortPair();
  
  port1.addEventListener('message', port1Listener);
  port2.addEventListener('message', port2Listener);
  
  port1.postMessage(message1);
  port2.postMessage(message2);
  
  await nextTick();
  
  expect(port1Listener).toHaveBeenCalledWith(
    expect.objectContaining({ data: message2 })
  );
  expect(port2Listener).toHaveBeenCalledWith(
    expect.objectContaining({ data: message1 })
  );
});
```

## Notes

- Messages are delivered asynchronously (using `setTimeout(0)`) to simulate real network behavior
- The mock creates minimal Event and MessageEvent objects for testing - they may not have all DOM Event properties
- Connection state changes emit events synchronously for easier testing
- AbortSignal support matches the standard EventTarget API
