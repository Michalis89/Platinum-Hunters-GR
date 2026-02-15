'use client';

import { useState } from 'react';
import { Database, Ticket } from 'lucide-react';
import { useSelector } from 'react-redux';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { ErrorAlert } from '@/components/ui/alert';
import { selectIsAdminOrModerator } from '@/store/slices/authSlice';
import AdminSupportTicketsPane from '@/app/components/support/AdminSupportTicketsPane.client';
import AdminMediaCurationTable from '@/app/components/support/AdminMediaCurationTable.client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type SupportView = 'tickets' | 'data-curation';

export default function AdminSupportInbox() {
  const isAdmin = useSelector(selectIsAdminOrModerator);
  const [activeView, setActiveView] = useState<SupportView>('tickets');

  if (!isAdmin) {
    return (
      <PageContainer size="md" className="py-20">
        <ErrorAlert message="Δεν έχεις πρόσβαση σε αυτή τη σελίδα." />
      </PageContainer>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === 'tickets'}
                    onClick={() => setActiveView('tickets')}
                    tooltip="Tickets"
                  >
                    <Ticket />
                    <span>Tickets</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === 'data-curation'}
                    onClick={() => setActiveView('data-curation')}
                    tooltip="Data Curation"
                  >
                    <Database />
                    <span>Data Curation</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-4 py-2 backdrop-blur md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-medium text-foreground">
            {activeView === 'tickets' ? 'Tickets' : 'Data Curation'}
          </span>
        </div>
        {activeView === 'tickets' ? (
          <AdminSupportTicketsPane />
        ) : (
          <PageContainer size="full" className="py-10">
            <AdminMediaCurationTable />
          </PageContainer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
