import { supabase } from '@/integrations/supabase/client';

export async function seedTestData() {
  console.log('🌱 Iniciando seed de dados de teste...');

  try {
    // 1. Verificar se há equipamentos
    const { data: equipamentos, error: eqError } = await supabase
      .from('equipamentos')
      .select('id')
      .limit(1);
    
    if (eqError) {
      console.error('❌ Erro ao buscar equipamentos:', eqError);
      return;
    }

    if (!equipamentos || equipamentos.length === 0) {
      console.log('⚠️ Nenhum equipamento encontrado. Inserindo padrões...');
      const { error: insertEqError } = await supabase
        .from('equipamentos')
        .insert([
          { nome: 'Linha 1 - Extrusão', codigo: 'EXT-001', ciclo_ideal: 2.5, capacidade_hora: 120, status: 'ativo' },
          { nome: 'Linha 2 - Empacotamento', codigo: 'EMP-001', ciclo_ideal: 1.8, capacidade_hora: 200, status: 'ativo' },
          { nome: 'Linha 3 - Moagem', codigo: 'MOA-001', ciclo_ideal: 3.0, capacidade_hora: 100, status: 'ativo' },
          { nome: 'Linha 4 - Secagem', codigo: 'SEC-001', ciclo_ideal: 4.0, capacidade_hora: 80, status: 'ativo' },
        ]);
      
      if (insertEqError) {
        console.error('❌ Erro ao inserir equipamentos:', insertEqError);
      } else {
        console.log('✅ Equipamentos inseridos com sucesso');
      }
    }

    // 2. Verificar se há turnos
    const { data: turnos, error: tError } = await supabase
      .from('turnos')
      .select('id')
      .limit(1);
    
    if (tError) {
      console.error('❌ Erro ao buscar turnos:', tError);
      return;
    }

    if (!turnos || turnos.length === 0) {
      console.log('⚠️ Nenhum turno encontrado. Inserindo padrões...');
      const { error: insertTError } = await supabase
        .from('turnos')
        .insert([
          { nome: 'Manhã', hora_inicio: '06:00', hora_fim: '14:00' },
          { nome: 'Tarde', hora_inicio: '14:00', hora_fim: '22:00' },
          { nome: 'Noite', hora_inicio: '22:00', hora_fim: '06:00' },
        ]);
      
      if (insertTError) {
        console.error('❌ Erro ao inserir turnos:', insertTError);
      } else {
        console.log('✅ Turnos inseridos com sucesso');
      }
    }

    // 3. Verificar e inserir registros de produção para hoje
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data: registros, error: regError } = await supabase
      .from('registros_producao')
      .select('id')
      .eq('data', hoje)
      .limit(1);
    
    if (regError) {
      console.error('❌ Erro ao buscar registros:', regError);
    } else if (!registros || registros.length === 0) {
      console.log('⚠️ Nenhum registro de produção para hoje. Inserindo exemplos...');
      
      // Buscar equipamentos e turnos para inserir dados
      const { data: allEq } = await supabase.from('equipamentos').select('id');
      const { data: allT } = await supabase.from('turnos').select('id');

      if (allEq && allT && allEq.length > 0 && allT.length > 0) {
        const recordsToInsert = [];
        for (const eq of allEq.slice(0, 2)) {
          for (const t of allT.slice(0, 2)) {
            recordsToInsert.push({
              data: hoje,
              equipamento_id: eq.id,
              turno_id: t.id,
              tempo_planejado: 480,
              tempo_real: 450,
              tempo_ciclo_ideal: 2.5,
              tempo_ciclo_real: 2.4,
              total_produzido: 180,
              defeitos: 5,
              capacidade_hora: 120,
            });
          }
        }

        const { error: insertRegError } = await supabase
          .from('registros_producao')
          .insert(recordsToInsert);
        
        if (insertRegError) {
          console.error('❌ Erro ao inserir registros:', insertRegError);
        } else {
          console.log(`✅ ${recordsToInsert.length} registros de produção inseridos`);
        }
      }
    } else {
      console.log('✅ Já existem registros de produção para hoje');
    }

    // 4. Verificar e inserir paradas para hoje
    const { data: paradas, error: parError } = await supabase
      .from('paradas')
      .select('id')
      .eq('data', hoje)
      .limit(1);
    
    if (parError) {
      console.error('❌ Erro ao buscar paradas:', parError);
    } else if (!paradas || paradas.length === 0) {
      console.log('⚠️ Nenhuma parada para hoje. Inserindo exemplos...');
      
      const { data: allEq } = await supabase.from('equipamentos').select('id');
      const { data: allT } = await supabase.from('turnos').select('id');

      if (allEq && allT && allEq.length > 0 && allT.length > 0) {
        const { error: insertParError } = await supabase
          .from('paradas')
          .insert([
            {
              data: hoje,
              turno_id: allT[0].id,
              equipamento_id: allEq[0].id,
              duracao: 30,
              motivo: 'Manutenção preventiva',
              categoria: 'manutencao',
            },
            {
              data: hoje,
              turno_id: allT[1].id,
              equipamento_id: allEq[1].id,
              duracao: 15,
              motivo: 'Parada não planejada',
              categoria: 'nao_planejada',
            },
          ]);
        
        if (insertParError) {
          console.error('❌ Erro ao inserir paradas:', insertParError);
        } else {
          console.log('✅ Paradas inseridas');
        }
      }
    } else {
      console.log('✅ Já existem paradas para hoje');
    }

    // 5. Verificar e inserir produtos bloqueados para hoje
    const { data: bloqueados, error: bloqError } = await supabase
      .from('produtos_bloqueados')
      .select('id')
      .eq('data', hoje)
      .limit(1);
    
    if (bloqError) {
      console.error('❌ Erro ao buscar produtos:', bloqError);
    } else if (!bloqueados || bloqueados.length === 0) {
      console.log('⚠️ Nenhum produto bloqueado para hoje. Inserindo exemplos...');
      
      const { data: allEq } = await supabase.from('equipamentos').select('id');
      const { data: allT } = await supabase.from('turnos').select('id');

      if (allEq && allT && allEq.length > 0 && allT.length > 0) {
        const { error: insertBloqError } = await supabase
          .from('produtos_bloqueados')
          .insert([
            {
              data: hoje,
              turno_id: allT[0].id,
              equipamento_id: allEq[0].id,
              motivo_bloqueio: 'Desvio de especificação',
              quantidade: 5,
              destino: 'Descarte',
            },
            {
              data: hoje,
              turno_id: allT[1].id,
              equipamento_id: allEq[1].id,
              motivo_bloqueio: 'Contaminação',
              quantidade: 3,
              destino: 'Reprocesso',
            },
          ]);
        
        if (insertBloqError) {
          console.error('❌ Erro ao inserir produtos:', insertBloqError);
        } else {
          console.log('✅ Produtos bloqueados inseridos');
        }
      }
    } else {
      console.log('✅ Já existem produtos bloqueados para hoje');
    }

    console.log('✅ Seed de dados completo!');
  } catch (error) {
    console.error('❌ Erro geral no seed:', error);
  }
}
