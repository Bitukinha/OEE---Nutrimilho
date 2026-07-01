import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useEquipamentos, useDeleteEquipamento } from '@/hooks/useEquipamentos';
import EquipamentoForm from '@/components/oee/EquipamentoForm';
import { Pencil, Trash2, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  ativo: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
  inativo: { label: 'Inativo', className: 'bg-muted text-muted-foreground border-muted' },
  manutencao: { label: 'Manutenção', className: 'bg-warning/10 text-warning border-warning/20' },
};

const Equipamentos = () => {
  const { data: equipamentos, isLoading } = useEquipamentos();
  const deleteMutation = useDeleteEquipamento();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Segmentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os segmentos da produção
            </p>
          </div>
          <EquipamentoForm />
        </div>

        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Lista de Segmentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !equipamentos?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum segmento cadastrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Código</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipamentos.map((equip) => {
                      const status = statusConfig[equip.status as keyof typeof statusConfig];
                      return (
                        <TableRow key={equip.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{equip.nome}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {equip.codigo || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(status?.className)}>
                              {status?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EquipamentoForm
                                equipamento={equip}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Segmento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir "{equip.nome}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(equip.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Equipamentos;
