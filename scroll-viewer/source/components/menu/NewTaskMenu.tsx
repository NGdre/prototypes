import React from 'react';
import SelectInput from 'ink-select-input';
import {Text} from 'ink';
// import {TextInputContainer} from '../TextInputContainer.js';

export default function NewTaskMenu() {
	const handleSelect = (item: {label: string; value: string}) => {
		// `item` = { label: 'First', value: 'first' }
		console.log(item);
	};

	const items = [
		{
			label: 'Название задачи',
			value: 'TASK_TITLE',
		},
		{
			label: 'Описание задачи',
			value: 'TASK_DESCRIPTION',
		},
		{
			label: 'Готово!',
			value: 'DONE',
		},
	];

	return (
		<>
			<Text>Главное Меню</Text>
			<SelectInput items={items} onSelect={handleSelect} />
			{/* <TextInputContainer
				label="Введите название задачи:"
				onSubmit={value => {
					console.log(value);
				}}
				hideOnSumbit
			/> */}
		</>
	);
}
