import z from 'zod';

import {
	type EncounterEntityBrand,
	encounterEntitySchema,
} from './EncounterEntity';

declare const EncounterBrand: unique symbol;
export type EncounterBrand = typeof EncounterBrand;

export const encounterSchema = z.object({
	id: z.string().brand<EncounterBrand>(),
	name: z.string().nullable(),
	description: z.string().nullable(),
	backgroundImage: z.string().nullable(),
	currentTurn: z.string().brand<EncounterEntityBrand>().nullable(),
	entities: z.array(encounterEntitySchema),
});
export type Encounter = z.infer<typeof encounterSchema>;

export function createDefaultEncounter(id: string): Encounter {
	return {
		id: id as string & z.$brand<EncounterBrand>,
		name: null,
		description: null,
		backgroundImage: null,
		currentTurn: null,
		entities: [],
	};
}

export function createAction<
	ActionType extends string,
	State,
	ActionPayloadSchema extends z.ZodType,
	PayloadCreator extends (...args: any[]) => z.infer<ActionPayloadSchema>,
>({
	type,
	schema,
	reducer,
	creator,
}: {
	type: ActionType;
	schema: ActionPayloadSchema;
	reducer: (
		state: State,
		action: { type: ActionType; payload: z.infer<ActionPayloadSchema> },
	) => void;
	creator: PayloadCreator;
}) {
	function action(...args: Parameters<PayloadCreator>) {
		return {
			type: type,
			payload: creator(...args),
		};
	}

	return {
		type,
		action,
		reducer,
		schema,
	};
}
export type ActionType<T extends { action: (...args: any[]) => any }> =
	ReturnType<T['action']>;

const modifyMetadataAction = createAction({
	type: 'modifyMetadata',
	schema: z.object({
		name: z.string().nullable().optional(),
		description: z.string().nullable().optional(),
		backgroundImage: z.string().nullable().optional(),
	}),
	reducer: (state: Encounter, action) => {
		if (!state) return state;

		if (action.payload.name !== undefined) {
			state.name = action.payload.name;
		}
		if (action.payload.description !== undefined) {
			state.description = action.payload.description;
		}
		if (action.payload.backgroundImage !== undefined) {
			state.backgroundImage = action.payload.backgroundImage;
		}
	},
	creator: (payload) => payload,
});
type ModifyMetadataAction = ActionType<typeof modifyMetadataAction>;

const advanceTurnAction = createAction({
	type: 'advanceTurn',
	schema: z.void(),
	reducer: (state: Encounter, _action) => {
		if (!state) return state;

		const index = state.entities.findIndex(
			(e) => e.id === state.currentTurn,
		);

		if (index === -1 || state.entities.length === 0) {
			state.currentTurn = state.entities[0]?.id ?? null;
		} else {
			const nextIndex = (index + 1) % state.entities.length;
			state.currentTurn = state.entities[nextIndex].id;
		}
	},
	creator: () => ({}),
});
type AdvanceTurnAction = ActionType<typeof advanceTurnAction>;

const jumpToTurnAction = createAction({
	type: 'jumpToTurn',
	schema: z.object({
		turnId: z.string().brand<EncounterEntityBrand>().nullable(),
	}),
	reducer: (state: Encounter, action) => {
		if (!state) return state;

		if (
			action.payload.turnId === null ||
			state.entities.some((e) => e.id === action.payload.turnId)
		) {
			state.currentTurn = action.payload.turnId;
		}
	},
	creator: (payload) => payload,
});
type JumpToTurnAction = ActionType<typeof jumpToTurnAction>;

function selectMetadata(state: Encounter) {
	return {
		name: state.name,
		description: state.description,
		backgroundImage: state.backgroundImage,
	};
}
function selectCurrentTurnEntity(state: Encounter) {
	return state.entities.find((e) => e.id === state.currentTurn) || null;
}
function selectEntities(state: Encounter) {
	return state.entities;
}

export function initialState(): Encounter {
	return {
		id: '' as string & z.$brand<EncounterBrand>,
		name: null,
		description: null,
		backgroundImage: null,
		currentTurn: null,
		entities: [],
	};
}

export const actions = {
	modifyMetadataAction,
	advanceTurnAction,
	jumpToTurnAction,
};

export const builders = {
	[modifyMetadataAction.type]: modifyMetadataAction.action,
	[advanceTurnAction.type]: advanceTurnAction.action,
	[jumpToTurnAction.type]: jumpToTurnAction.action,
};

export const reducers = {
	[modifyMetadataAction.type]: modifyMetadataAction.reducer,
	[advanceTurnAction.type]: advanceTurnAction.reducer,
	[jumpToTurnAction.type]: jumpToTurnAction.reducer,
};

export const selectors = {
	selectMetadata,
	selectCurrentTurnEntity,
	selectEntities,
};
