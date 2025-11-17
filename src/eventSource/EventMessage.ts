export type EventMessage<E> =
	| {
			type: 'event';
			event: E;
	  }
	| {
			type: 'rejection';
			eventId: string;
	  }
	| {
			type: 'requestHistory';
			since: number;
	  }
	| {
			type: 'eventHistory';
			events: E[];
	  };
