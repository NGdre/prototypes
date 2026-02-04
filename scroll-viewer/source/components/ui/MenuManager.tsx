import {Box} from 'ink';
import React, {useState} from 'react';
import {Menu, MenuItem} from './Menu.js';

export const MenuManager = ({
	menuItems,
	show = true,
}: {
	menuItems: MenuItem[];
	show: boolean;
}) => {
	const [menuStack, setMenuStack] = useState<MenuItem[][]>([menuItems]);

	const handleNavigate = (submenu: MenuItem[]) => {
		setMenuStack([...menuStack, submenu]);
	};

	const handleBack = () => {
		if (menuStack.length > 1) {
			setMenuStack(menuStack.slice(0, -1));
		}
	};

	const handleBackToMain = () => {
		if (menuStack.length > 1) {
			setMenuStack(menuStack.slice(0, 1));
		}
	};

	const currentMenu = menuStack[menuStack.length - 1] as MenuItem[];

	if (!show) return null;

	return (
		<Box flexDirection="column">
			<Menu
				items={currentMenu}
				onNavigate={handleNavigate}
				onMenuPop={handleBack}
				onMainMenu={handleBackToMain}
			/>
		</Box>
	);
};
