import CreatureInitiativeCard, {
	type CreatureInitiative,
} from '@/components/CharacterInitiativeCard';
import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';

function Page() {
	const creatures: CreatureInitiative[] = [
		{
			name: 'Sybil Snow',
			type: { type: 'player', player: 'Joe Example' },

			images: [sybilProfile],
			ac: 15,
			health: '30/30',
			attributes: {
				str: 16,
				dex: 14,
				con: 15,
				int: 12,
				wis: 13,
				cha: 18,
			},
			debuffs: [
				{
					name: 'Poisoned',
					color: 'bg-green-500',
					description:
						'The creature has disadvantage on attack rolls and ability checks.',
					duration: 3,
				},
				{
					name: 'Stunned',
					color: 'bg-red-500',
					description:
						'The creature is incapacitated and can only take actions that do not require movement.',
					duration: 1,
				},
			],
		},
		{
			name: 'Goblin',
			type: { type: 'npc' },

			images: ['https://example.com/goblin.jpg'],
			ac: 13,
			health: '10/10',
			attributes: {
				str: 8,
				dex: 14,
				con: 10,
				int: 10,
				wis: 8,
				cha: 8,
			},
			debuffs: [
				{
					name: 'Blinded',
					color: 'bg-blue-500',
					description:
						'The creature cannot see and automatically fails any ability check that requires sight.',
				},
			],
		},
	];

	creatures.unshift(creatures[0]);

	return (
		<section className="flex flex-col gap-2">
			{creatures.map((creature) => (
				<CreatureInitiativeCard
					key={creature.name}
					creature={creature}
				/>
			))}
		</section>
	);
}

export default Page;
