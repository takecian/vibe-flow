import React, { useState, FormEvent, ChangeEvent } from 'react';
import modalStyles from './CreateTaskModal.module.css';

interface CreateTaskModalProps {
    onClose: () => void;
    onCreate: (title: string, description: string) => void;
}

export function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title.trim(), description.trim());
            onClose();
        }
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    return (
        <div className={modalStyles.overlay}>
            <div className={modalStyles.modal}>
                <h2>Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Task Title"
                        className={modalStyles.input}
                        autoFocus
                    />
                    <textarea
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Task Description (optional)"
                        className={modalStyles.textarea}
                        rows={4}
                    />
                    <div className={modalStyles.actions}>
                        <button type="button" onClick={onClose} className={modalStyles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" className={modalStyles.createButton}>
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
