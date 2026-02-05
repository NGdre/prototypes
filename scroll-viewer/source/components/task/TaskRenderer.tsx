import {Box, Text} from 'ink';
import React from 'react';
import {TaskFields} from '../menu/MainMenu.js';
import {RenderItemProps} from '../ui/VirtualList.js';
import {getRandomDate} from '../../utils.js';

export function TaskRenderer<T extends TaskFields>({
	item: task,
	index,
	isSelected,
}: RenderItemProps<T>) {
	return (
		<Box paddingX={1} paddingY={0}>
			<Text color={isSelected ? 'white' : 'gray'}>
				{String(index + 1).padStart(4, '0')}
			</Text>
			<Text> | </Text>
			<Text color={isSelected ? 'white' : undefined}>
				{task.title || `Item ${index + 1}`}
			</Text>
			{task.scheduledAt && (
				<>
					<Text> | Запланировано на: </Text>
					<Text color="green" dimColor>
						[{task.scheduledAt}]
					</Text>
				</>
			)}
		</Box>
	);
}

export const generateTaskData = (count: number) =>
	Array.from({length: count}, (_, i) => ({
		id: i + 1,
		title: `Task ${i + 1}`,
		description: `Description for task ${i + 1}`,
		scheduledAt:
			i > 5 ? getRandomDate(new Date(2020, 0, 1)).toDateString() : undefined,
	}));
