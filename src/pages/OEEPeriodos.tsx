import { Link } from 'react-router-dom';
import Header from '@/components/oee/Header';
import DashboardOEEPeriodos from '@/components/oee/DashboardOEEPeriodos';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const OEEPeriodos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Navegação */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              OEE por Períodos
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise semanal, mensal e anual do OEE geral e por segmento
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <DashboardOEEPeriodos />
      </main>
    </div>
  );
};

export default OEEPeriodos;
