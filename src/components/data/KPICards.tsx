import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, FileText, MapPin } from 'lucide-react';
import { useKPIData } from '@/hooks/useKPIData';

export function KPICards() {
  const { data, loading } = useKPIData();

  const kpis = [
    {
      title: 'Total Licenses',
      value: data.totalLicenses,
      icon: FileText,
      description: 'Active dispensary licenses'
    },
    {
      title: 'Total Companies',
      value: data.totalCompanies,
      icon: Building2,
      description: 'License holders'
    },
    {
      title: 'Total Contacts',
      value: data.totalContacts,
      icon: Users,
      description: 'People in database'
    },
    {
      title: 'Total States',
      value: data.totalStates,
      icon: MapPin,
      description: 'Jurisdictions covered'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map(kpi => (
        <Card key={kpi.title} className="card-elevated hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpi.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}