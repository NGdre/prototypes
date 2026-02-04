import SelectInput from 'ink-select-input';
import React, {FC} from 'react';
import {Text} from 'ink';

export type MenuItem<T extends string = string> = {
	label: string;
	value: T;
	action?: (value: T) => void;
	submenu?: MenuItem[];
};

export const Menu: FC<{
	items: MenuItem[];
	title?: string;
	onNavigate: (submenu: MenuItem[]) => void;
	onMenuPop: () => void;
	onMainMenu: () => void;
}> = ({items, title, onNavigate, onMenuPop, onMainMenu}) => {
	const handleSelect = (item: MenuItem) => {
		if (item.submenu) {
			onNavigate(item.submenu);
		} else {
			if (item.value === 'BACK') onMenuPop();
			if (item.value === 'MAIN') onMainMenu();
			if (item.value === 'EXIT') process.exit(0);

			item.action?.(item.value);
		}
	};

	return (
		<>
			{title && <Text>{title}</Text>}
			<SelectInput
				items={items}
				onSelect={handleSelect}
				itemComponent={({label}) => <Text>{label}</Text>}
			/>
		</>
	);
};
