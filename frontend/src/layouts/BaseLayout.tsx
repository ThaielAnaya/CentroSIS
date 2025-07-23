import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/tenrikyoemblem.png';
import { Link } from 'react-router-dom';

const nav = [
    { to: "/home", label: "Inicio"},
    { to: "/students", label: "Alumnos" },
    { to: "/enrollments", label: "Inscripciones" },
    { to: "/payments", label: "Pagos" },
];

export default function BaseLayout() {
    return (
        <div className="min-h-screen min-w-full flex">
            {/* Sidebar */}
            <aside className='w-60 shrink-0 bg-gray-800 text-gray-100 flex flex-col h-screen'>
                <div className='h-16 flex items-center justify-center border-b border-gray-700'>
                    <Link to="/" className='text-xl font-bold'>
                        <img src={logo} alt="Logo" className='w-12 h-12' />
                    </Link>
                </div>

                <nav className='flex-1 overflow-y-auto py-4'>
                    {nav.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                [
                                    'block px-6 py-2',
                                    isActive ? 'bg-gray-700' : 'hover:bg-gray-700/50',
                                ].join(' ')
                            }
                            >
                                {label}
                            </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className='flex-1 bg-gray-100 h-screen overflow-y-auto w-full'>
                <div className='p-6 min-w-[800px]'>
                <Outlet />
                </div>
            </main>
        </div>
    )
}