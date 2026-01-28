import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useOPEX, useCreateOPEX, useUpdateOPEX, useDeleteOPEX, type OPEX } from '@/hooks/useOPEx';
import { useOPExMetricas } from '@/hooks/useOPExMetricas';
import { cn } from '@/lib/utils';

// Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
const formatDataBrasil = (dataISO: string) => {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

// Função para converter DD/MM/YYYY para YYYY-MM-DD
const converterParaISO = (dataBrasil: string) => {
  if (!dataBrasil || dataBrasil.length !== 10) return '';
  const [dia, mes, ano] = dataBrasil.split('/');
  // Validar se é uma data válida
  if (!dia || !mes || !ano || isNaN(parseInt(dia)) || isNaN(parseInt(mes)) || isNaN(parseInt(ano))) return '';
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
};

const DEPARTAMENTOS = [
  'Qualidade',
  'Manutenção',
  'Produção',
  'Processos',
  'Compras',
  'Diretoria',
  'Almoxarifado',
  'RH',
  'PCD (Pesquisa e Desenvolvimento)',
  'PCP (Planejamento e Controle de Produção)',
  'Comercial',
  'Comercio Exterior',
  'Financeiro/Contabilidade',
  'TI',
  'Logistica/Balança',
  'Eletrica',
  'PCM',
];

const statusConfig = {
  pendente: {
    label: 'Pendente',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  em_progresso: {
    label: 'Em Progresso',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  pronto: {
    label: 'Pronto',
    className: 'bg-success/10 text-success border-success/20',
  },
};

const OPExPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataInicioDisplay, setDataInicioDisplay] = useState('');
  const [dataPrevistaDisplay, setDataPrevistaDisplay] = useState('');
  const [formData, setFormData] = useState({
    departamento: '',
    descricao: '',
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_prevista_termino: format(new Date(), 'yyyy-MM-dd'),
    status: 'pendente' as 'pendente' | 'em_progresso' | 'pronto',
  });

  const { data: opexList, isLoading: opexLoading } = useOPEX();
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
        status: 'pendente' as 'pendente' | 'em_progresso' | 'pronto',
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
      status: (opex.status || 'pendente') as 'pendente' | 'em_progresso' | 'pronto',
    });
    setDataInicioDisplay(formatDataBrasil(opex.data_inicio));
    setDataPrevistaDisplay(formatDataBrasil(opex.data_prevista_termino));
    setEditingId(opex.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este OPEx?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const isLoading = opexLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">OPEX</h1>
              <p className="text-muted-foreground mt-1">Gestão de Atividades por Setor</p>
            </div>
          </div>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    departamento: '',
                    descricao: '',
                    data_inicio: format(new Date(), 'yyyy-MM-dd'),
                    data_prevista_termino: format(new Date(), 'yyyy-MM-dd'),
                    status: 'pendente',
                  });
                }}
              >
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
                  <Label htmlFor="departamento">Departamento *</Label>
                  <Select value={formData.departamento} onValueChange={(value) => setFormData({ ...formData, departamento: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    placeholder="O que o setor precisa fazer?"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início (DD/MM/YYYY) *</Label>
                  <Input
                    id="data_inicio"
                    type="text"
                    placeholder="27/01/2026"
                    value={dataInicioDisplay || formatDataBrasil(formData.data_inicio)}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      let formatado = valor;
                      
                      if (valor.length > 0) {
                        if (valor.length > 2) {
                          formatado = valor.slice(0, 2) + '/' + valor.slice(2);
                        }
                        if (valor.length > 4) {
                          formatado = valor.slice(0, 2) + '/' + valor.slice(2, 4) + '/' + valor.slice(4, 8);
                        }
                      }
                      
                      setDataInicioDisplay(formatado);
                      
                      if (valor.length === 8) {
                        const dataISO = converterParaISO(formatado);
                        if (dataISO) {
                          setFormData({ ...formData, data_inicio: dataISO });
                        }
                      }
                    }}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_prevista">Data Prevista de Término (DD/MM/YYYY) *</Label>
                  <Input
                    id="data_prevista"
                    type="text"
                    placeholder="27/01/2026"
                    value={dataPrevistaDisplay || formatDataBrasil(formData.data_prevista_termino)}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      let formatado = valor;
                      
                      if (valor.length > 0) {
                        if (valor.length > 2) {
                          formatado = valor.slice(0, 2) + '/' + valor.slice(2);
                        }
                        if (valor.length > 4) {
                          formatado = valor.slice(0, 2) + '/' + valor.slice(2, 4) + '/' + valor.slice(4, 8);
                        }
                      }
                      
                      setDataPrevistaDisplay(formatado);
                      
                      if (valor.length === 8) {
                        const dataISO = converterParaISO(formatado);
                        if (dataISO) {
                          setFormData({ ...formData, data_prevista_termino: dataISO });
                        }
                      }
                    }}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'pendente' | 'em_progresso' | 'pronto') => setFormData({ ...formData, status: value })}>
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Atualizar' : 'Criar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* OPEX List */}
        {opexLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráficos de Métricas */}
            {opexList && opexList.length > 0 && <OPExCharts data={opexList} />}

            {/* Lista de OPEX */}
            <div className="grid grid-cols-1 gap-4">
              {opexList && opexList.length > 0 ? (
                opexList.map((opex) => (
                <Card key={opex.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{opex.departamento}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{opex.descricao}</p>
                      </div>
                      <Badge variant="outline" className={cn('ml-4', statusConfig[opex.status].className)}>
                        {statusConfig[opex.status].label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Início</p>
                        <p className="font-medium">{format(parseISO(opex.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Término Previsto</p>
                        <p className="font-medium">{format(parseISO(opex.data_prevista_termino), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Dias Restantes</p>
                        <p className="font-medium">
                          {Math.ceil((new Date(opex.data_prevista_termino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(opex)}
                        disabled={isLoading}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(opex.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deletar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Nenhum OPEX cadastrado</p>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente de Gráficos
const OPExCharts = ({ data }: { data: OPEX[] }) => {
  const metricas = useOPExMetricas(data);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metricas.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metricas.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico por Setor */}
      <Card>
        <CardHeader>
          <CardTitle>OPEX por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricas.porDepartamento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departamento" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="concluidas" fill="#10b981" name="Concluídas" />
              <Bar dataKey="emProgresso" fill="#60a5fa" name="Em Progresso" />
              <Bar dataKey="pendentes" fill="#fbbf24" name="Pendentes" />
              <Bar dataKey="atrasadas" fill="#ef4444" name="Atrasadas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-500">{metricas.pendentes}</div>
          <p className="text-muted-foreground text-sm mt-1">Aguardando Início</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações Concluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-500">{metricas.concluidas}</div>
          <p className="text-muted-foreground text-sm mt-1">Finalizadas com Sucesso</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Em Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-500">{metricas.emProgresso}</div>
          <p className="text-muted-foreground text-sm mt-1">Sendo Executadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações Atrasadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-500">{metricas.atrasadas}</div>
          <p className="text-muted-foreground text-sm mt-1">Passaram da Data Prevista</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OPExPage;
