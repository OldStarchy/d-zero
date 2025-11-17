import { produce } from 'immer';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BaseEvent } from '@/eventSource/BaseEvent';
import HostEventSource from '@/eventSource/HostEventSource';
import {
	type actions,
	type ActionType,
	builders,
	createDefaultEncounter,
	type Encounter,
	reducers,
} from '@/model/encounter/Encounter';

type Actions = ActionType<(typeof actions)[keyof typeof actions]>;

function combineReducers<
	State,
	T extends Record<string, (state: State, action: any) => void>,
>(reducers: T): (state: State, action: Parameters<T[keyof T]>[1]) => State {
	return (state: State, action: Parameters<T[keyof T]>[1]): State => {
		const type = action.type;

		const reducer = reducers[type as keyof T];
		if (!reducer) {
			return state;
		}
		const result = produce(state, (draft) => {
			reducer(draft as State, action);
		});

		return result;
	};
}

const rootReducer = combineReducers<Encounter, typeof reducers>(reducers);

const encounterSource = new HostEventSource<Actions, Encounter>(
	createDefaultEncounter(''),
	rootReducer,
	() => true,
	(event, _clientId) => event,
);

function useEventSource<Actions, State>(
	source: HostEventSource<Actions, State>,
): [State, (action: Actions) => void] {
	const [state, setState] = useState<State>(source.getState());

	useEffect(() => {
		return source.subscribe(setState);
	}, [source]);

	const dispatch = useCallback(
		(action: Actions) => {
			source.dispatch(action);
		},
		[source],
	);

	return [state, dispatch];
}

function EncounterSandbox() {
	return <EncounterComponent />;
}

function EncounterComponent() {
	const [state, dispatch] = useEventSource(encounterSource);

	const [events, setEvents] = useState<BaseEvent<Actions>[]>([]);

	useEffect(() => {
		return encounterSource.subscribeEvents(setEvents);
	}, []);

	return (
		<div style={{ overflow: 'auto' }}>
			<h2>Encounter Sandbox</h2>
			<div>
				<p>Encounter ID: {state.id}</p>
				<p>Name: {state.name}</p>
				<p>Description: {state.description}</p>
				<Button
					onClick={() => {
						dispatch(
							builders.modifyMetadata({
								name: `${parseInt(state.name ?? '0') + 1 || 1}`,
								description: 'This is a test encounter.',
							}),
						);
					}}
				>
					Modify Metadata
				</Button>
				<Button
					onClick={() =>
						encounterSource.dispatch(builders.advanceTurn())
					}
				>
					Advance Turn
				</Button>
				<Button onClick={() => encounterSource.drop()}>
					Drop Last Event
				</Button>
			</div>
			<ScrollArea style={{ overflow: 'auto' }}>
				<pre>{JSON.stringify(events, null, 2)}</pre>
			</ScrollArea>
		</div>
	);
}

export default EncounterSandbox;
