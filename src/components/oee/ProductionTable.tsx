import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRegistrosProducao } from '@/hooks/useRegistrosProducao';
import { cn } from '@/lib/utils';
import { getOEEColor, getOEELevel } from '@/types/oee';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

const ProductionTable = () => {
  const { data: registros, isLoading } = useRegistrosProducao();

  const levelLabels = {
    excellent: 'Excelente',
    good: 'Bom',
    warning: 'Atenção',
    critical: 'Crítico',
  };

  return (
    <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Últimos Registros
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !registros?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum registro ainda.</p>
            <Link to="/producao">
              <Button variant="link" className="mt-2">
                Criar primeiro registro
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Turno</TableHead>
                    <TableHead className="font-semibold text-center">OEE</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.slice(0, 5).map((row) => {
                    const oeeValue = Number(row.oee);
                    const level = getOEELevel(oeeValue);
                    return (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {new Date(row.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {row.turnos?.nome || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn("text-center font-bold text-lg", getOEEColor(oeeValue))}>
                          {oeeValue.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-xs",
                              level === 'excellent' && "bg-oee-excellent text-primary-foreground",
                              level === 'good' && "bg-oee-good text-primary-foreground",
                              level === 'warning' && "bg-oee-warning text-secondary-foreground",
                              level === 'critical' && "bg-oee-critical text-primary-foreground"
                            )}
                          >
                            {levelLabels[level]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {registros.length > 5 && (
              <Link to="/producao" className="block mt-4">
                <Button variant="link" className="w-full">
                  Ver todos os registros
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductionTable;
