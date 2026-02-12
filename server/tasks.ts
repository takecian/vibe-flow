import { getDB } from './db';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, Application, NextFunction } from 'express';
import { Task, DBData, AppConfig } from './types';
import { Low } from 'lowdb';

// Assuming createWorktree is defined in git.ts and will be imported there.
// For now, we'll define a type for it to avoid immediate errors.
type CreateWorktreeFunction = (repoPath: string, taskId: string, branchName: string) => Promise<{ success: boolean; path: string; message?: string }>;


async function getTaskById(taskId: string): Promise<Task | undefined> {
    const db: Low<DBData> = getDB();
    await db.read();
    return db.data.tasks.find((t: Task) => t.id === taskId);
}

function setupTaskRoutes(app: Application, getState: () => AppConfig, createWorktree: CreateWorktreeFunction): void {

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
            status: status || 'todo',
            createdAt: new Date().toISOString(),
            branchName: `feature/task-${Date.now()}`
        };
        db.data.tasks.push(newTask);
        await db.write();

        // Auto-create worktree
        try {
            if (createWorktree) {
                const { repoPath } = getState();
                await createWorktree(repoPath, newTask.id, newTask.branchName);
                console.log(`Auto-created worktree for task ${newTask.id}`);
            }
        } catch (e: any) {
            console.error(`Failed to auto-create worktree for task ${newTask.id}:`, e);
            // Don't fail the request, just log it. User can retry via UI.
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
