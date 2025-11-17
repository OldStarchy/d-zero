import z from 'zod';

import { defineRecordType, type RecordType } from '@/db/RecordType';
import EncounterApi from '@/type/EncounterApi';
import {encounterSchema, type Encounter} from '@/model/encounter/Encounter';


type EncounterFilter = { id?: string; name?: string };
export type EncounterRecordType = RecordType<Encounter, EncounterFilter>;

export const EncounterCollectionSchema = defineRecordType({
	name: 'encounter',
	schema: encounterSchema,
	filterFn: (record, filter: EncounterFilter) => {
		if (!filter) return true;

		if (filter.id && record.id !== filter.id) return false;

		if (
			filter.name &&
			!record.name?.toLowerCase().includes(filter.name.toLowerCase())
		)
			return false;

		return true;
	},
	documentClass: EncounterApi,
});

export type EncounterCollectionSchema = typeof EncounterCollectionSchema;
