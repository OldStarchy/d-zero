import type { RouteObject } from 'react-router';

import Layout from '@/layout/layout';
import DatabaseViewer from '@/views/DatabaseViewer';
import Encounter from '@/views/Encounter';
import Launch from '@/views/Launch';
import Monsters from '@/views/Monsters';
import PopoutView from '@/views/Popout';
import RoomConfigurator from '@/views/Room';
import Sandbox from '@/views/Sandbox';
import EntityPropertyPanel from '@/views/sandbox/forms/EntityPropertyPanel';

import CustomCreatureEditor from './views/CustomCreatureEditor';
import Components from './views/sandbox/Components';

export const sandboxRoutes: RouteObject[] = [
	{
		index: true,
		Component: Sandbox,
	},
	{
		path: '/sandbox/components',
		Component: Components,
	},
	{
		path: '/sandbox/forms/entity-property-panel',
		Component: EntityPropertyPanel,
	},
];

const routes: RouteObject[] = [
	{
		Component: Layout,
		children: [
			{
				index: true,
				Component: Launch,
			},
			{
				path: '/encounter',
				Component: Encounter,
			},
			{
				path: '/room',
				Component: RoomConfigurator,
			},
			{
				path: '/characters',
				Component: CustomCreatureEditor,
			},
			{
				path: '/monsters',
				Component: Monsters,
			},
			{
				path: '/database',
				Component: DatabaseViewer,
			},
			{
				path: '/sandbox',
				children: sandboxRoutes,
			},
		],
	},
	{
		path: '/popout/',
		Component: PopoutView,
	},
];

export default routes;
