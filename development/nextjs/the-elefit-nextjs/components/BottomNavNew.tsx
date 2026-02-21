import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Calendar, User } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
}

interface BottomNavProps {
  hideOnPages?: string[];
}

export default function BottomNavNew({ hideOnPages = [] }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Check if current page should hide the bottom nav
  const shouldHide = hideOnPages.some(page => pathname.includes(page));

  if (shouldHide) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'ai-assistant',
      icon: Sparkles,
      label: 'AI Assistant',
      path: '/ai-coach',
      isActive: pathname === '/ai-coach' || pathname.startsWith('/ai-coach/'),
    },
    {
      id: 'weekly-schedule',
      icon: Calendar,
      label: 'Weekly Schedule',
      path: '/schedule',
      isActive: pathname === '/schedule',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      path: '/profile',
      isActive: pathname === '/profile',
    },
  ];

  const aiCoachSteps = ['/ai-coach/goal', '/ai-coach/details', '/ai-coach/preferences', '/ai-coach/calories'];
  const isAiCoachStep = aiCoachSteps.some(step => pathname.includes(step));

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 w-full items-center justify-center z-50 ${isAiCoachStep ? 'hidden md:flex' : 'flex'
        }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-[80px] w-full max-w-md md:max-w-xl items-center justify-between bg-[#0c0c0c] rounded-t-3xl px-10 py-4 shadow-2xl border border-[#212121] border-b-0 mx-auto">
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <div key={item.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => router.push(item.path)}
                className={`flex h-12 items-center justify-center gap-2 px-5 py-2 w-full rounded-2xl transition-all ${item.isActive ? 'bg-primary' : 'hover:bg-[#212121]'
                  }`}
                aria-label={item.label}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <IconComponent
                  className={`w-5 h-5 ${item.isActive ? 'text-black' : 'text-[#e4e4e4]'}`}
                />
              </button>
              <div
                className={`text-xs text-center font-medium ${item.isActive ? 'text-primary' : 'text-[#e4e4e4]'
                  }`}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
