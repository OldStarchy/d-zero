import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';
import type { Debuff as DebuffObj } from '@/type/Debuff';

import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Separator } from './ui/separator';

export default function Debuff({
	debuff,
	className,
	...props
}: { debuff: DebuffObj } & ComponentPropsWithoutRef<typeof Badge>) {
	const badge = (
		<Badge
			className={cn(
				'border-white',
				{ 'border-dashed': debuff.duration === 1 },
				debuff.color,
				className,
			)}
			{...props}
		>
			{debuff.name}
			{debuff.duration !== undefined ? ` (${debuff.duration})` : ''}
		</Badge>
	);

	if (debuff.description || debuff.notes) {
		return (
			<HoverCard openDelay={100} closeDelay={100}>
				<HoverCardTrigger asChild>{badge}</HoverCardTrigger>
				<HoverCardContent>
					{debuff.notes && <p>{debuff.notes}</p>}
					{debuff.description && debuff.notes && (
						<Separator className="my-1" />
					)}
					{debuff.description && (
						<p className="italic text-muted-foreground">
							{debuff.description}
						</p>
					)}
				</HoverCardContent>
			</HoverCard>
		);
	}
	return badge;
}
