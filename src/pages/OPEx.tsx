import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useOPEX, useCreateOPEX, useUpdateOPEX, useDeleteOPEX, type OPEX } from '@/hooks/useOPExDirect';
import { cn } from '@/lib/utils';

const formatDataBrasil = (dataISO: string) => {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

const converterParaISO = (dataBrasil: string) => {
  if (!dataBrasil || dataBrasil.length !== 10) return '';
  const [dia, mes, ano] = dataBrasil.split('/');
  if (!dia || !mes || !ano) return '';
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
};

const DEPARTAMENTOS = [
  'Qualidade', 'Manutenção', 'Produção', 'Processos', 'Compras', 'Diretoria',
  'Almoxarifado', 'RH', 'PCD (Pesquisa e Desenvolvimento)', 'PCP (Planejamento e Controle de Produção)',
  'Comercial', 'Comercio Exterior', 'Financeiro/Contabilidade', 'TI', 'Logistica/Balança', 'Eletrica', 'PCM',
];

const statusConfig = {
  pendente: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', color: '#FBBF24' },
  em_progresso: { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-700 border-blue-200', color: '#3B82F6' },
  pronto: { label: 'Pronto', className: 'bg-green-500/10 text-green-700 border-green-200', color: '#10B981' },
};

const OPExPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [dataInicioDisplay, setDataInicioDisplay] = useState('');
  const [dataPrevistaDisplay, setDataPrevistaDisplay] = useState('');
  const [formData, setFormData] = useState({
    departamento: '',
    descricao: '',
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_prevista_termino: format(new Date(), 'yyyy-MM-dd'),
    status: 'pendente' as 'pendente' | 'em_progresso' | 'pronto',
  });

  const { data: opexList = [], isLoading: opexLoading } = useOPEX();
  const createMutation = useCreateOPEX();
  const updateMutation = useUpdateOPEX();
  const deleteMutation = useDeleteOPEX();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departamento || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          concluido: false,
          data_conclusao: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as OPEX);
        setEditingId(null);
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({
        departamento: '',
        descricao: '',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_prevista_termino: format(new Date(), 'yyyy-MM-dd'),
        status: 'pendente',
      });
      setDataInicioDisplay('');
      setDataPrevistaDisplay('');
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar OPEX:', error);
    }
  };

  const handleEdit = (opex: OPEX) => {
    setFormData({
      departamento: opex.departamento,
      descricao: opex.descricao,
      data_inicio: opex.data_inicio,
      data_prevista_termino: opex.data_prevista_termino,
      status: opex.status,
    });
    setDataInicioDisplay(formatDataBrasil(opex.data_inicio));
    setDataPrevistaDisplay(formatDataBrasil(opex.data_prevista_termino));
    setEditingId(opex.id);
    setOpenDialog(true);
  };

  const handleToggleConcluido = async (opex: OPEX) => {
    await updateMutation.mutateAsync({
      ...opex,
      concluido: !opex.concluido,
      data_conclusao: !opex.concluido ? format(new Date(), 'yyyy-MM-dd') : null,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este OPEx?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredOpex = filterStatus === 'todos' ? opexList : opexList.filter(op => op.status === filterStatus);
  const concluidos = opexList.filter(op => op.concluido).length;
  const emProgresso = opexList.filter(op => op.status === 'em_progresso').length;
  const pendentes = opexList.filter(op => op.status === 'pendente').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">OPEX</h1>
              <p className="text-muted-foreground">Gestão de Atividades por Setor</p>
            </div>
          </div>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setDataInicioDisplay(''); setDataPrevistaDisplay(''); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo OPEX
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar OPEX' : 'Novo OPEX'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Departamento *</Label>
                  <Select value={formData.departamento} onValueChange={(value) => setFormData({ ...formData, departamento: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map((dept) => (
                        <SelectItem key={`dept-${dept}`} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Textarea
                    placeholder="O que fazer?"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Início (DD/MM/YYYY) *</Label>
                  <Input
                    type="text"
                    placeholder="27/01/2026"
                    value={dataInicioDisplay || formatDataBrasil(formData.data_inicio)}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      let formatado = valor;
                      if (valor.length > 2) formatado = valor.slice(0, 2) + '/' + valor.slice(2);
                      if (valor.length > 4) formatado = valor.slice(0, 2) + '/' + valor.slice(2, 4) + '/' + valor.slice(4, 8);
                      setDataInicioDisplay(formatado);
                      if (valor.length === 8) {
                        const dataISO = converterParaISO(formatado);
                        if (dataISO) setFormData({ ...formData, data_inicio: dataISO });
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Prevista (DD/MM/YYYY) *</Label>
                  <Input
                    type="text"
                    placeholder="27/01/2026"
                    value={dataPrevistaDisplay || formatDataBrasil(formData.data_prevista_termino)}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      let formatado = valor;
                      if (valor.length > 2) formatado = valor.slice(0, 2) + '/' + valor.slice(2);
                      if (valor.length > 4) formatado = valor.slice(0, 2) + '/' + valor.slice(2, 4) + '/' + valor.slice(4, 8);
                      setDataPrevistaDisplay(formatado);
                      if (valor.length === 8) {
                        const dataISO = converterParaISO(formatado);
                        if (dataISO) setFormData({ ...formData, data_prevista_termino: dataISO });
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "pendente" | "em_progresso" | "pronto") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_progresso">Em Progresso</SelectItem>
                      <SelectItem value="pronto">Pronto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Atualizar' : 'Criar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{opexList.length}</div>
              <p className="text-muted-foreground text-sm mt-1">Total OPEX</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">{pendentes}</div>
              <p className="text-muted-foreground text-sm mt-1">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{emProgresso}</div>
              <p className="text-muted-foreground text-sm mt-1">Em Progresso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{concluidos}</div>
              <p className="text-muted-foreground text-sm mt-1">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        {opexList.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pendente', value: pendentes, fill: statusConfig.pendente.color },
                        { name: 'Em Progresso', value: emProgresso, fill: statusConfig.em_progresso.color },
                        { name: 'Pronto', value: concluidos, fill: statusConfig.pronto.color },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OPEX por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(
                    opexList.reduce((acc, op) => {
                      acc[op.departamento] = (acc[op.departamento] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([dept, count]) => ({ departamento: dept, quantidade: count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departamento" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtro */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filterStatus === 'todos' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('todos')}
          >
            Todos ({opexList.length})
          </Button>
          <Button
            variant={filterStatus === 'pendente' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pendente')}
            className={filterStatus === 'pendente' ? 'bg-yellow-600' : ''}
          >
            Pendentes ({pendentes})
          </Button>
          <Button
            variant={filterStatus === 'em_progresso' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('em_progresso')}
            className={filterStatus === 'em_progresso' ? 'bg-blue-600' : ''}
          >
            Em Progresso ({emProgresso})
          </Button>
          <Button
            variant={filterStatus === 'pronto' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pronto')}
            className={filterStatus === 'pronto' ? 'bg-green-600' : ''}
          >
            Concluídos ({concluidos})
          </Button>
        </div>

        {/* Lista OPEX */}
        {opexLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredOpex.length > 0 ? (
          <div className="space-y-4">
            {filteredOpex.map((opex) => (
              <Card key={opex.id} className={cn('border-l-4', opex.concluido && 'opacity-60')}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={opex.concluido || false}
                      onCheckedChange={() => handleToggleConcluido(opex)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={cn('text-lg font-semibold', opex.concluido && 'line-through text-muted-foreground')}>
                          {opex.departamento}
                        </h3>
                        <Badge className={statusConfig[opex.status].className}>
                          {statusConfig[opex.status].label}
                        </Badge>
                        {opex.concluido && (
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <p className={cn('text-sm text-muted-foreground mb-3', opex.concluido && 'line-through')}>
                        {opex.descricao}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Início</p>
                          <p className="font-medium">{format(parseISO(opex.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Término Previsto</p>
                          <p className="font-medium">{format(parseISO(opex.data_prevista_termino), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dias Restantes</p>
                          <p className={cn('font-medium', new Date(opex.data_prevista_termino) < new Date() && 'text-red-600')}>
                            {Math.ceil((new Date(opex.data_prevista_termino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(opex)}>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(opex.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Nenhum OPEX encontrado nesta categoria</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OPExPage;
