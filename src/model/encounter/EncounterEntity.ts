import { z } from 'zod';

import type { CreatureIdBrand as CreatureBrand } from '@/db/record/Creature';
import { creatureSchema } from '@/db/record/Creature';

declare const EncounterEntityBrand: unique symbol;
export type EncounterEntityBrand = typeof EncounterEntityBrand;

export const encounterEntitySchema = z.object({
	id: z.string().brand<EncounterEntityBrand>(),
	effect: z.literal('invisible').optional(),
	healthDisplay: z.string(),
	initiative: z.number(),

	creature: creatureSchema.omit({ id: true, revision: true }).extend({
		originalCratureId: z.string().brand<CreatureBrand>().optional(),
	}),
});
