export const LOCAL_STORAGE_NAMESPACE = 'dnd';

type PageInfo = {
	title: string;
	url: string;
};

export const PAGES = {
	CREATURE_EDITOR: {
		title: 'Custom Heros & Creatures',
		url: '/characters',
	},
	ROOM_MANAGEMENT: {
		title: 'Create/Join Room',
		url: '/room',
	},
	ENCOUNTER: {
		title: 'Game Master View',
		url: '/encounter',
	},
} as const satisfies Record<string, PageInfo>;

export const DEFINITIONS = {
	ARMOR_CLASS_DESCRIPTION:
		'Armor Class represents how difficult it is to land a successful hit on a creature.',
	HEALTH_DESCRIPTION:
		'Health represents the amount of damage a creature can take before falling unconscious.',
	INITIATIVE_DESCRIPTION:
		'Initiative determines the order of turns in combat.',
};
