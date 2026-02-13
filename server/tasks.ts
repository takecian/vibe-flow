import { getDB } from './db';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, Application, NextFunction } from 'express';
import { Task, DBData, AppConfig } from './types';
import { Low } from 'lowdb';

type CreateWorktreeFunction = (repoPath: string, taskId: string, branchName: string) => Promise<{ success: boolean; path: string; message?: string }>;
type EnsureTerminalForTaskFunction = (taskId: string) => Promise<void>;
type RunAiForTaskFunction = (taskId: string) => Promise<void>;


async function getTaskById(taskId: string): Promise<Task | undefined> {
    const db: Low<DBData> = getDB();
    await db.read();
    return db.data.tasks.find((t: Task) => t.id === taskId);
}

function setupTaskRoutes(
    app: Application,
    getState: () => AppConfig,
    createWorktree: CreateWorktreeFunction,
    ensureTerminalForTask: EnsureTerminalForTaskFunction,
    runAiForTask: RunAiForTaskFunction
): void {

    // Middleware to ensure DB is ready or check path
    const checkDB = (req: Request, res: Response, next: NextFunction): void => {
        if (!getState().repoPath) {
            res.status(400).json({ error: 'Repository not selected' });
            return;
        }
        next();
    };

    app.get('/api/tasks', checkDB, async (req: Request, res: Response) => {
        try {
            const db: Low<DBData> = getDB();
            await db.read();
            res.json(db.data.tasks);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tasks', checkDB, async (req: Request, res: Response) => {
        const { title, description, status } = req.body;
        const db: Low<DBData> = getDB();
        const newTask: Task = {
            id: uuidv4(),
            title,
            description,
            createdAt: new Date().toISOString(),
            branchName: `feature/task-${Date.now()}`
        };
        db.data.tasks.push(newTask);
        await db.write();

        // Auto-create worktree and terminal for new task
        try {
            const { repoPath } = getState();
            console.log(`Auto-created worktree for task ${newTask.id}`);
            await ensureTerminalForTask(newTask.id);
            // Run AI tool automatically after terminal is ensured
            runAiForTask(newTask.id).catch((e) => console.error(`[Tasks] runAiForTask(${newTask.id}):`, e));
        } catch (e: any) {
            console.error(`Failed to auto-create worktree/terminal for task ${newTask.id}:`, e);
        }

        res.json(newTask);
    });

    app.put('/api/tasks/:id', checkDB, async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = req.body;
        const db: Low<DBData> = getDB();
        const taskIndex = db.data.tasks.findIndex((t: Task) => t.id === id);
        if (taskIndex > -1) {
            db.data.tasks[taskIndex] = { ...db.data.tasks[taskIndex], ...updates };
            await db.write();
            res.json(db.data.tasks[taskIndex]);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    });

    app.delete('/api/tasks/:id', checkDB, async (req: Request, res: Response) => {
        const { id } = req.params;
        const db: Low<DBData> = getDB();
        db.data.tasks = db.data.tasks.filter((t: Task) => t.id !== id);
        await db.write();
        res.json({ success: true });
    });
}

export { setupTaskRoutes, getTaskById };
