import { LayoutDashboard, FileText, User, LogOut, BrainCircuit, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/documents", icon: FileText, label: "Documents" },
    { to: "/flashcards", icon: BookOpen, label: "Flashcards" },
    { to: "/profile", icon: User, label: "Profile" },
  ];
  const [isSelected, setIsSelected] = useState("/dashboard");
  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64 z-50 flex flex-col`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BrainCircuit className="inline-block h-6 w-6 mr-2" />
          AI Learning Assistant
        </h2>
        <nav className="space-y-4 ">
          {navLinks.map((link) => (
            <Link
              to={link.to}
              key={link.to}
              className={`flex flex-row items-center rounded-md px-3 py-2 ${
                isSelected === link.to ? 'bg-slate-700' : 'hover:bg-slate-700'
              }`}
              onClick={() => setIsSelected(link.to)}
            >
              <link.icon className="h-5 w-5" />
              <span className="ml-2">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 pt-0">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start rounded-md bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          onClick={toggleSidebar}
        >
          <Link to="/logout" className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            LogOut
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;