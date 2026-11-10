import { EmployeesPage } from './features/employees/pages/EmployeesPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { useAuth } from './features/auth/auth-context';

function App() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'anonymous') return <LoginPage />;

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
