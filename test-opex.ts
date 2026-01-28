// Teste para verificar se a tabela opex existe
import { supabase } from './src/integrations/supabase/client';

async function testOPEX() {
  try {
    console.log('Testando acesso à tabela opex...');
    
    const { data, error, status } = await supabase
      .from('opex')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro:', error.message);
      console.error('Status:', status);
    } else {
      console.log('✅ Tabela opex existe e é acessível!');
      console.log('Dados:', data);
    }
  } catch (err) {
    console.error('Erro ao testar:', err);
  }
}

testOPEX();
