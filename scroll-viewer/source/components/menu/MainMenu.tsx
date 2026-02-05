import React, {useMemo, useRef, useState} from 'react';
import {MenuManager} from '../ui/MenuManager.js';
import {MenuItem} from '../ui/Menu.js';
import {
	TextInputContainer,
	TextInputContainerProps,
} from '../TextInputContainer.js';

export type TaskFields = {
	title: string;
	description?: string;
	deadline?: string;
	scheduledAt?: string;
};

type DisplayStatus = 'text_input' | 'menu' | 'list';

export default function MainMenu() {
	const newTaskFields = useRef<TaskFields | null>(null);
	const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('menu');
	const [textInputProps, setTextInputProps] =
		useState<TextInputContainerProps | null>(null);
	const [tasks, setTasks] = useState<TaskFields[]>([]);

	if (newTaskFields.current) console.log(newTaskFields.current);

	console.log(tasks);

	const items = useMemo<MenuItem[]>(
		() => [
			{
				label: 'Новая задача',
				value: 'NEW_TASK',
				submenu: [
					{
						label: 'Название задачи',
						value: 'TASK_TITLE',
						action() {
							setDisplayStatus('text_input');
							setTextInputProps({
								label: 'Название задачи',
								onSubmit(inputValue) {
									newTaskFields.current = Object.assign(
										{},
										newTaskFields.current,
										{title: inputValue},
									);

									setDisplayStatus('menu');
								},
							});
						},
					},
					{
						label: 'Описание задачи',
						value: 'TASK_DESCRIPTION',
						action() {
							setDisplayStatus('text_input');
							setTextInputProps({
								label: 'Описание задачи',
								onSubmit(inputValue) {
									newTaskFields.current = Object.assign(
										{},
										newTaskFields.current,
										{description: inputValue},
									);

									setDisplayStatus('menu');
								},
							});
						},
					},
					{
						label: 'Готово!',
						value: 'BACK',
						action() {
							if (newTaskFields.current)
								setTasks(prevTasks => {
									return [...prevTasks, newTaskFields.current!];
								});
							newTaskFields.current = null;
						},
					},
				],
			},
			{
				label: 'Показать все задачи',
				value: 'ALL_TASKS',
				action() {
					setDisplayStatus('list');
				},
			},
			{
				label: 'Выход',
				value: 'EXIT',
			},
		],
		[],
	);

	return (
		<>
			<MenuManager menuItems={items} show={displayStatus === 'menu'} />
			{displayStatus === 'text_input' && (
				<TextInputContainer {...textInputProps} hideOnSumbit />
			)}
		</>
	);
}
