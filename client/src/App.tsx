import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetail } from './components/TaskDetail';
import { TerminalProvider } from './context/TerminalContext';

function App() {
  return (
    <Router>
      <TerminalProvider>
        <TaskProvider>
          <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/task/:id" element={<TaskDetail />} />
          </Routes>
        </TaskProvider>
      </TerminalProvider>
    </Router>
  );
}

export default App;
