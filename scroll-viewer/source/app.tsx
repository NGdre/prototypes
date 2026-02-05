import React from 'react';
import {VirtualList} from './components/ui/VirtualList.js';
import {
	generateTaskData,
	TaskRenderer,
} from './components/task/TaskRenderer.js';

export default function App() {
	return (
		<>
			{/* <MainMenu /> */}
			<VirtualList
				height={5}
				data={generateTaskData(50)}
				renderItem={({item, index, isSelected, isVisible}) => (
					<TaskRenderer
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
