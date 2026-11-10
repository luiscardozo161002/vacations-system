import { EmployeesPage } from './features/employees/pages/EmployeesPage';

function App() {
  return (
    <div id="app-backdrop">
      <div id="app-shell">
        <div className="main-col">
          <main className="page-content">
            <EmployeesPage />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
