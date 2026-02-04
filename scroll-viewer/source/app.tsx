import React from 'react';
import {DefaultItemRenderer, VirtualList} from './components/ui/VirtualList.js';
import {generateData} from './components/VirtualList.js';
// import MainMenu from './components/menu/MainMenu.js';

export default function App() {
	return (
		<>
			{/* <MainMenu /> */}
			<VirtualList
				height={5}
				data={generateData(50)}
				renderItem={({item, index, isSelected, isVisible}) => (
					<DefaultItemRenderer
						index={index}
						isSelected={isSelected}
						isVisible={isVisible}
						item={item}
					/>
				)}
			/>
		</>
	);
}
