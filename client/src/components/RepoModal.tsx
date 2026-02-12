import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from './RepoModal.module.css';
import { pickFolder, checkAITools } from '../api'; // updateConfig is not directly used here
import { FolderOpen } from 'lucide-react';
import { AppConfig, AiToolsCheckResult } from '../types'; // Import AppConfig and AiToolsCheckResult interfaces

interface RepoModalProps {
    onSave: (path: string, aiTool: string) => void;
    initialConfig: AppConfig | null;
    onClose?: () => void;
}

export function RepoModal({ onSave, initialConfig, onClose }: RepoModalProps) {
    const [path, setPath] = useState<string>('');
    const [aiTool, setAiTool] = useState<string>('claude');
    const [availableTools, setAvailableTools] = useState<AiToolsCheckResult>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [checkingTools, setCheckingTools] = useState<boolean>(true);

    useEffect(() => {
        if (initialConfig?.repoPath) setPath(initialConfig.repoPath);
        if (initialConfig?.aiTool) setAiTool(initialConfig.aiTool);

        async function check() {
            try {
                const tools: AiToolsCheckResult = await checkAITools();
                console.log('Available AI Tools:', tools);
                setAvailableTools(tools);
            } catch (e) {
                console.error('Failed to check AI tools', e);
            } finally {
                setCheckingTools(false);
            }
        }
        check();
    }, [initialConfig]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (path.trim()) {
            onSave(path.trim(), aiTool);
        }
    };

    const handleBrowse = async () => {
        setLoading(true);
        try {
            const result = await pickFolder();
            if (result.path) {
                setPath(result.path);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to open folder picker. Please paste the path manually.');
        } finally {
            setLoading(false);
        }
    };

    const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPath(e.target.value);
    };

    const handleAiToolChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAiTool(e.target.value);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Configuration</h2>
                <p>Setup your repository and AI assistant.</p>
                <form onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label>Repository Path</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                value={path}
                                onChange={handlePathChange}
                                placeholder="/Users/username/projects/my-repo"
                                className={styles.input}
                                autoFocus
                            />
                            <button type="button" onClick={handleBrowse} className={styles.iconButton} title="Browse Folder">
                                <FolderOpen size={20} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label>AI Assistant</label>
                        <div className={styles.toolGrid}>
                            {['claude', 'codex', 'gemini'].map(tool => (
                                <label key={tool} className={`${styles.toolOption} ${aiTool === tool ? styles.selected : ''} ${!availableTools[tool as keyof AiToolsCheckResult] ? styles.disabled : ''}`}>
                                    <input
                                        type="radio"
                                        name="aiTool"
                                        value={tool}
                                        checked={aiTool === tool}
                                        onChange={handleAiToolChange}
                                        disabled={!availableTools[tool as keyof AiToolsCheckResult]}
                                    />
                                    <span className={styles.toolName}>{tool}</span>
                                    {availableTools[tool as keyof AiToolsCheckResult] ? <span className={styles.statusAvailable}>●</span> : <span className={styles.statusUnavailable}>○</span>}
                                </label>
                            ))}
                        </div>
                        {checkingTools && <span className={styles.checking}>Checking tools...</span>}
                    </div>

                    <div className={styles.buttonGroup}>
                        {onClose && (
                            <button type="button" onClick={onClose} className={styles.cancelButton}>
                                Cancel
                            </button>
                        )}
                        <button type="submit" className={styles.button} disabled={loading || !path}>
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
