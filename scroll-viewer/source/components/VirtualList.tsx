import React, {useState, useRef, useEffect} from 'react';
import {Text, Box, useInput, useStdout} from 'ink';

// Генерация тестовых данных (в реальном проекте замените на данные из БД)
export const generateData = (count: number) =>
	Array.from({length: count}, (_, i) => ({
		id: i + 1,
		name: `Item ${i + 1}`,
		description: `Description for item ${i + 1}`,
		status: ['active', 'inactive', 'pending'][i % 3],
	}));

export const VirtualList = ({data = generateData(1000), height = 20}) => {
	const [scrollOffset, setScrollOffset] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const containerRef = useRef(null);
	const {stdout} = useStdout();
	const [terminalHeight, setTerminalHeight] = useState(height);

	// Автоматическая подстройка под размер терминала
	useEffect(() => {
		const actualHeight = stdout?.rows ? stdout.rows - 4 : height;
		setTerminalHeight(actualHeight);
	}, [stdout?.rows, height]);

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => {
				const newIndex = Math.max(0, prev - 1);

				if (newIndex < scrollOffset) {
					setScrollOffset(newIndex);
				}
				return newIndex;
			});
		}

		if (key.downArrow) {
			setSelectedIndex(prev => {
				const newIndex = Math.min(data.length - 1, prev + 1);

				if (newIndex >= scrollOffset + terminalHeight) {
					setScrollOffset(Math.max(0, newIndex - terminalHeight + 1));
				}
				return newIndex;
			});
		}

		if (key.pageUp || key.leftArrow) {
			const newOffset = Math.max(0, scrollOffset - terminalHeight);
			setScrollOffset(newOffset);
			setSelectedIndex(
				Math.min(newOffset + terminalHeight - 1, data.length - 1),
			);
		}

		if (key.pageDown || key.rightArrow) {
			const newOffset = Math.min(
				data.length - terminalHeight,
				scrollOffset + terminalHeight,
			);
			setScrollOffset(newOffset);
			setSelectedIndex(newOffset);
		}

		// // Home/End для навигации
		// if (key.home) {
		// 	setScrollOffset(0);
		// 	setSelectedIndex(0);
		// }

		// if (key.end) {
		// 	const newOffset = Math.max(0, data.length - terminalHeight);
		// 	setScrollOffset(newOffset);
		// 	setSelectedIndex(data.length - 1);
		// }

		// Прокрутка колесиком мыши (если терминал поддерживает)
		if (input === ' ') {
			// Space как аналог PageDown
			const newOffset = Math.min(
				data.length - terminalHeight,
				scrollOffset + terminalHeight,
			);
			setScrollOffset(newOffset);
			setSelectedIndex(newOffset);
		}
	});

	// Видимый диапазон данных
	const visibleData = data.slice(scrollOffset, scrollOffset + terminalHeight);

	return (
		<Box flexDirection="column" ref={containerRef}>
			{/* Заголовок с информацией о позиции */}
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					Показано {scrollOffset + 1}-
					{Math.min(scrollOffset + terminalHeight, data.length)} из{' '}
					{data.length}
				</Text>
				<Text> | </Text>
				<Text color="yellow">Выбрано: {selectedIndex + 1}</Text>
			</Box>

			{/* Виртуальный список */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				height={terminalHeight}
			>
				{visibleData.map((item, index) => {
					const absoluteIndex = scrollOffset + index;
					const isSelected = absoluteIndex === selectedIndex;

					return (
						<Box key={item.id} paddingX={1} paddingY={0}>
							<Text color={isSelected ? 'white' : 'gray'}>
								{String(absoluteIndex + 1).padStart(4, '0')}
							</Text>
							<Text> </Text>
							<Text color={isSelected ? 'white' : undefined}>{item.name}</Text>
							<Text> </Text>
							<Text color="green" dimColor>
								[{item.status}]
							</Text>
							<Text> </Text>
							<Text dimColor>{item.description}</Text>
						</Box>
					);
				})}
			</Box>

			{/* Подсказки по управлению */}
			<Box marginTop={1}>
				<Text dimColor>
					↑↓ - Прокрутка | PgUp/PgDn - Быстрая прокрутка | Home/End - В
					начало/конец | Выбран элемент: {data[selectedIndex]?.name}
				</Text>
			</Box>
		</Box>
	);
};
