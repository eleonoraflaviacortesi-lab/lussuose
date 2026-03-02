import { useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/properties': 'Properties',
  '/contacts': 'Buyers',
  '/activities': 'Activities',
  '/settings': 'Settings',
  '/chat': 'Chat',
  '/office': 'Office',
};

interface AppBreadcrumbsProps {
  /** Optional detail name to show as last crumb, e.g. property or contact name */
  detailName?: string;
}

export function AppBreadcrumbs({ detailName }: AppBreadcrumbsProps) {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || 'Page';

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {detailName ? (
            <BreadcrumbLink href={location.pathname}>{currentLabel}</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {detailName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{detailName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
