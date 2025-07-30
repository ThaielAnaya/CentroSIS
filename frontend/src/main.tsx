import { createRoot } from 'react-dom/client'
import './index.css'
import BaseLayout from './layouts/BaseLayout.tsx'
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter as realCreateBrowserRouter } from 'react-router-dom';
import Home from './pages/HomePage.tsx';
import Students from './pages/StudentsPage.tsx';
/* import Enrollments from './pages/Enrollments';
import Payments from './pages/Payments'; */

const qc = new QueryClient();

const router = realCreateBrowserRouter([
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      { index: true, element: <Home /> },
      { index: true, path: '/home', element: <Home /> },
      { path: '/students', element: <Students /> },
      /* { path: '/enrollments', element: <Enrollments /> },
      { path: '/payments', element: <Payments /> }, */
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={qc}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);

