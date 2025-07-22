import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BaseLayout from './layouts/BaseLayout.tsx'
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter as realCreateBrowserRouter } from 'react-router-dom';
import Home from './pages/HomePage.tsx';
/* import Students from './pages/Students';
import Enrollments from './pages/Enrollments';
import Payments from './pages/Payments'; */

const router = realCreateBrowserRouter([
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      { index: true, element: <Home /> },
/*       { path: '/students', element: <Students /> },
      { path: '/enrollments', element: <Enrollments /> },
      { path: '/payments', element: <Payments /> }, */
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);

