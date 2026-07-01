// Arquivo temporário para testes
import { supabase } from '@/integrations/supabase/client';

export const testQueries = async () => {
  console.log('=== Iniciando diagnóstico ===');
  console.log('URL Supabase:', import.meta.env.VITE_SUPABASE_URL);
  
  try {
    // Test 1: Verificar conexão básica
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Sessão de autenticação:', session ? 'Autenticado' : 'Não autenticado');
  } catch (e) {
    console.error('❌ Erro ao verificar sessão:', e);
  }

  console.log('=== Testando tabelas ===');

  // Test 1: Equipamentos
  try {
    const { data: equipamentos, error, count } = await supabase
      .from('equipamentos')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Equipamentos:', error.message);
    } else {
      console.log('✅ Equipamentos:', count || equipamentos?.length || 0, 'registros');
      if (equipamentos && equipamentos.length > 0) {
        console.log('   Exemplo:', equipamentos[0]);
      }
    }
  } catch (e) {
    console.error('❌ Equipamentos - Exceção:', e);
  }

  // Test 2: Turnos
  try {
    const { data: turnos, error, count } = await supabase
      .from('turnos')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Turnos:', error.message);
    } else {
      console.log('✅ Turnos:', count || turnos?.length || 0, 'registros');
      if (turnos && turnos.length > 0) {
        console.log('   Exemplo:', turnos[0]);
      }
    }
  } catch (e) {
    console.error('❌ Turnos - Exceção:', e);
  }

  // Test 3: Registros de Produção
  try {
    const { data: registros, error, count } = await supabase
      .from('registros_producao')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Registros Produção:', error.message);
    } else {
      console.log('✅ Registros Produção:', count || registros?.length || 0, 'registros');
      if (registros && registros.length > 0) {
        console.log('   Exemplo:', registros[0]);
      }
    }
  } catch (e) {
    console.error('❌ Registros Produção - Exceção:', e);
  }

  // Test 4: Paradas
  try {
    const { data: paradas, error, count } = await supabase
      .from('paradas')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Paradas:', error.message);
    } else {
      console.log('✅ Paradas:', count || paradas?.length || 0, 'registros');
      if (paradas && paradas.length > 0) {
        console.log('   Exemplo:', paradas[0]);
      }
    }
  } catch (e) {
    console.error('❌ Paradas - Exceção:', e);
  }

  // Test 5: Produtos Bloqueados
  try {
    const { data: produtos, error, count } = await supabase
      .from('produtos_bloqueados')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Produtos Bloqueados:', error.message);
    } else {
      console.log('✅ Produtos Bloqueados:', count || produtos?.length || 0, 'registros');
      if (produtos && produtos.length > 0) {
        console.log('   Exemplo:', produtos[0]);
      }
    }
  } catch (e) {
    console.error('❌ Produtos Bloqueados - Exceção:', e);
  }

  // Test 6: Testar query com relacionamentos
  try {
    console.log('\n=== Testando relacionamentos ===');
    const { data: registrosComRel, error } = await supabase
      .from('registros_producao')
      .select(`
        *,
        equipamentos (id, nome),
        turnos (id, nome)
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ Relacionamentos:', error.message);
    } else {
      console.log('✅ Relacionamentos funcionando');
      if (registrosComRel && registrosComRel.length > 0) {
        console.log('   Exemplo com relacionamentos:', registrosComRel[0]);
      }
    }
  } catch (e) {
    console.error('❌ Relacionamentos - Exceção:', e);
  }

  console.log('=== Diagnóstico completo ===');
};

