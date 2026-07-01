import Header from '@/components/oee/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GerenciadorMotivosParadas } from '@/components/oee/GerenciadorMotivosParadas';
import { GerenciadorMotivosBloqueios } from '@/components/oee/GerenciadorMotivosBloqueios';
import { Settings } from 'lucide-react';

const Motivos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Gerenciador de Motivos
            </h1>
            <p className="text-muted-foreground mt-1">
              Cadastre e gerencie os motivos de paradas e bloqueios
            </p>
          </div>
        </div>

        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Motivos de Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paradas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paradas">Motivos de Paradas</TabsTrigger>
                <TabsTrigger value="bloqueios">Motivos de Bloqueios</TabsTrigger>
              </TabsList>

              <TabsContent value="paradas" className="mt-6">
                <GerenciadorMotivosParadas />
              </TabsContent>

              <TabsContent value="bloqueios" className="mt-6">
                <GerenciadorMotivosBloqueios />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Motivos;
