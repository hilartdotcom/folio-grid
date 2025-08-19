import React, { useEffect, useState } from 'react';
import { Users, Building2, Key, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalContacts: number;
  totalCompanies: number;
  activeMaticenses: number;
  expiringLicenses: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    totalCompanies: 0,
    activeMaticenses: 0,
    expiringLicenses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contactsResult, companiesResult, licensesResult, expiringResult] = await Promise.all([
          supabase.from('contacts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('companies').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('licenses').select('id', { count: 'exact', head: true })
            .is('deleted_at', null)
            .eq('status', 'active'),
          supabase.from('licenses').select('id', { count: 'exact', head: true })
            .is('deleted_at', null)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString().split('T')[0])
            .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        ]);

        setStats({
          totalContacts: contactsResult.count || 0,
          totalCompanies: companiesResult.count || 0,
          activeMaticenses: licensesResult.count || 0,
          expiringLicenses: expiringResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Contacts",
      value: stats.totalContacts,
      description: "Active contacts in your database",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Companies",
      value: stats.totalCompanies,
      description: "Registered companies",
      icon: Building2,
      color: "text-green-600"
    },
    {
      title: "Active Licenses",
      value: stats.activeMaticenses,
      description: "Currently active licenses",
      icon: Key,
      color: "text-purple-600"
    },
    {
      title: "Expiring Soon",
      value: stats.expiringLicenses,
      description: "Licenses expiring within 30 days",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your FolioGrid dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="card-elevated animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your FolioGrid dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title} className="card-elevated hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</div>
              <CardDescription className="text-xs">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Welcome to FolioGrid!</p>
                  <p className="text-xs text-muted-foreground">Start by adding some companies and contacts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">Add Company</span>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">Import Contacts</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">Create License</span>
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}