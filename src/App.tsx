import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';
import { RoleProvider } from './state/role';
import './index.css';

function App() {
  return (
    <RoleProvider>
      <RouterProvider router={router} />
    </RoleProvider>
  );
}

export default App;
