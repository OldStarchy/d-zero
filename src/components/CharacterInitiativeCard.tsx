import { Droplets, Shield } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { DEFINITIONS } from '@/const';
import { cn } from '@/lib/utils';
import type { Debuff as DebuffType } from '@/type/Debuff';

import Debuff from './Debuff';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Separator } from './ui/separator';

export type CreatureInitiative = {
	name: string;
	type: { type: 'npc' } | { type: 'player'; player: string };

	images: string[];
	ac: number;
	health: string;

	attributes: {
		str: number;
		dex: number;
		con: number;
		int: number;
		wis: number;
		cha: number;
	};

	debuffs: DebuffType[];
};

function getTextInitials(text: string) {
	return text
		.replace(/[^a-zA-Z0-9 ]+/g, ' ')
		.replace(/(?:^| )(\w)\w+/g, (_, initial: string) =>
			initial.toUpperCase(),
		);
}

function CreatureInitiativeCard({
	creature,
}: {
	creature: CreatureInitiative;
}) {
	const [expanded, setExpanded] = useState(false);

	//TODO(#21): animate between expanded and collapsed states
	return (
		<Card
			className="transition-all py-2"
			onClick={() => setExpanded((e) => !e)}
		>
			<CardContent className="px-2">
				{expanded ? (
					<div className="flex flex-col gap-4 p-2">
						<div className="flex items-center gap-4">
							<Avatar className="size-15">
								<AvatarImage src={creature.images[0]} />
								<AvatarFallback>
									{getTextInitials(creature.name)}
								</AvatarFallback>
							</Avatar>

							<div className="flex flex-col gap-2 grow">
								<span className="text-lg font-semibold">
									{creature.name}
								</span>

								<div className="flex gap-4">
									{creature.type.type === 'npc' ? (
										<p className="italic text-muted-foreground">
											NPC
										</p>
									) : (
										<p>{creature.type.player}</p>
									)}
								</div>
							</div>

							<DescriptiveText
								name="Armor Class"
								Icon={Shield}
								value={creature.ac}
								description={
									DEFINITIONS.ARMOR_CLASS_DESCRIPTION
								}
							/>

							<DescriptiveText
								name="Health"
								Icon={Droplets}
								value={creature.health}
								description={DEFINITIONS.HEALTH_DESCRIPTION}
							/>
						</div>

						<div className="flex gap-4">
							<div className="grid grid-cols-4 gap-4">
								<p>STR</p>
								<p>{creature.attributes.str}</p>
								<p>DEX</p>
								<p>{creature.attributes.dex}</p>
								<p>CON</p>
								<p>{creature.attributes.con}</p>
								<p>INT</p>
								<p>{creature.attributes.int}</p>
								<p>WIS</p>
								<p>{creature.attributes.wis}</p>
								<p>CHA</p>
								<p>{creature.attributes.cha}</p>
							</div>

							<div className="grow" />

							<div className="flex flex-col justify-stretch items-stretch gap-2">
								{creature.debuffs.map((debuff, index) => (
									<Debuff
										key={index}
										debuff={debuff}
										className="w-auto"
									/>
								))}
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-4">
						<Avatar className="size-10">
							<AvatarImage src={creature.images[0]} />
							<AvatarFallback>
								{getTextInitials(creature.name)}
							</AvatarFallback>
						</Avatar>

						<span className="grow">{creature.name}</span>

						<DescriptiveText
							name="Armor Class"
							Icon={Shield}
							value={creature.ac}
							description={DEFINITIONS.ARMOR_CLASS_DESCRIPTION}
						/>

						<DescriptiveText
							name="Health"
							Icon={Droplets}
							value={creature.health}
							description={DEFINITIONS.HEALTH_DESCRIPTION}
						/>

						<div className="flex gap-1 items-center">
							{creature.debuffs.map((debuff, index) => (
								<DebuffDot
									key={index}
									className="size-3"
									debuff={debuff}
								/>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default CreatureInitiativeCard;

function DescriptiveText({
	name,
	Icon,
	value,
	description,
}: {
	name: string;
	Icon: React.ComponentType<{ className?: string }>;
	value: ReactNode;
	description: string;
}) {
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<div className="flex gap-1 items-center">
					{value}
					<Icon className="size-4" />
				</div>
			</HoverCardTrigger>
			<HoverCardContent>
				<p className="flex items-center gap-1">
					<Icon className="size-4 inline" />
					{name}: {value}
				</p>
				<Separator className="my-1" />
				<p className="italic text-muted-foreground">{description}</p>
			</HoverCardContent>
		</HoverCard>
	);
}

function DebuffDot({
	debuff,
	className,
}: {
	debuff: DebuffType;
	className?: string;
}) {
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Badge
					className={cn(
						'block p-0 border-white',
						{ 'border-dashed': debuff.duration === 1 },
						debuff.color,
						className,
					)}
				/>
			</HoverCardTrigger>
			<HoverCardContent>
				<p>
					{debuff.name}
					{debuff.duration !== undefined
						? ` (${debuff.duration})`
						: ''}
				</p>
				{debuff.notes && (
					<>
						<Separator className="my-1" />
						<p>{debuff.notes}</p>
					</>
				)}
				{debuff.description && (
					<>
						<Separator className="my-1" />
						<p className="italic text-muted-foreground">
							{debuff.description}
						</p>
					</>
				)}
			</HoverCardContent>
		</HoverCard>
	);
}
