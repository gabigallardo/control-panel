import { Sidebar } from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="flex h-screen w-full bg-panel-600">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;