import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Orders', href: '/admin/orders', icon: '📦' },
    { name: 'Menu', href: '/admin/menu', icon: '🍽️' },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-waakye-dark text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-waakye-light/30">
          <h1 className="text-2xl font-heading font-bold">
            Waakye<span className="text-plantain">Admin</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Management Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-pepper text-white'
                    : 'text-gray-300 hover:bg-waakye-light/20 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-waakye-light/30 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-waakye-light/20"
          >
            <span className="text-xl">🌐</span>
            <span className="text-sm">View Website</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-pepper transition-colors rounded-lg hover:bg-waakye-light/20"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;