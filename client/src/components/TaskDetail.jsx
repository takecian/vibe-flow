import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { TerminalView } from './TerminalView';
import styles from './TaskDetail.module.css';
import { X, FileText, ArrowLeft, Terminal, MoreVertical, Trash2 } from 'lucide-react';

export function TaskDetail({ taskId, onClose }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, deleteTask } = useTasks();

    // Resolve ID from props (side panel) or params (route)
    const effectiveId = taskId || id;
    const task = tasks.find(t => t.id === effectiveId);
    const [activeTab, setActiveTab] = useState('terminal');
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    if (!task) return null; // Don't show loading in sidebar, just null if not found

    const handleDeleteTask = async () => {
        if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
            await deleteTask(task.id);
            if (onClose) {
                onClose(); // Close side panel
            } else {
                navigate('/'); // Navigate to main board
            }
        }
    };

    return (
        <div className={`${styles.container} ${onClose ? styles.sidePanel : ''}`}>
            <header className={styles.header}>
                {onClose ? (
                    <button className={styles.backButton} onClick={onClose}>
                        <X size={18} />
                    </button>
                ) : (
                    <button className={styles.backButton} onClick={() => navigate('/')}>
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div className={styles.titleSection}>
                    <h1>{task.title}</h1>
                    <span className={`${styles.statusBadge} ${styles[task.status]}`}>{task.status}</span>
                </div>
                <div className={styles.actions}>
                    <button className={`${styles.actionButton} ${activeTab === 'details' ? styles.active : ''}`} onClick={() => setActiveTab('details')}>
                        <FileText size={16} /> Details
                    </button>
                    <button className={`${styles.actionButton} ${activeTab === 'terminal' ? styles.active : ''}`} onClick={() => setActiveTab('terminal')}>
                        <Terminal size={16} /> Terminal
                    </button>
                    <div className={styles.optionsMenu}>
                        <button className={styles.iconButton} onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
                            <MoreVertical size={18} />
                        </button>
                        {showOptionsMenu && (
                            <div className={styles.dropdown}>
                                <button onClick={handleDeleteTask} className={styles.dropdownItem}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.content}>
                {activeTab === 'details' && (
                    <div className={styles.detailsWrapper}>
                        <div className={styles.descriptionCard}>
                            <h3>Description</h3>
                            <p>{task.description || 'No description provided.'}</p>
                        </div>
                    </div>
                )}
                {activeTab === 'terminal' && (
                    <div className={styles.terminalWrapper}>
                        <TerminalView taskId={task.id} />
                    </div>
                )}
            </main>
        </div>
    );
}
