import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportModal } from './ImportModal';
import { ImportDiagnosticsModal } from './ImportDiagnosticsModal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Upload, Zap } from 'lucide-react';

interface ImportButtonProps {
  tableName: 'licenses' | 'companies' | 'contacts';
  onImportComplete?: () => void;
  className?: string;
}

export function ImportButton({ tableName, onImportComplete, className }: ImportButtonProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const { canManageData, loading } = useUserRoles();

  if (loading || !canManageData()) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowImportModal(true)}
        className={className}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Data
      </Button>

      <Button
        size="sm"
        onClick={() => setShowDiagnosticsModal(true)}
        className={className}
      >
        <Zap className="h-4 w-4 mr-2" />
        Advanced Import
      </Button>

      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        tableName={tableName}
        onImportComplete={onImportComplete}
      />

      <ImportDiagnosticsModal
        open={showDiagnosticsModal}
        onOpenChange={setShowDiagnosticsModal}
        tableName={tableName}
        onImportComplete={onImportComplete}
      />
    </>
  );
}