import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { testQueries } from '@/lib/testQueries';

export const DebugPanel = () => {
  const [logs, setLogs] = useState<string[]>(['Iniciando diagnóstico...']);
  const [isRunning, setIsRunning] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Capturar console.log original
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');
      setLogs(prev => [...prev, message]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');
      setLogs(prev => [...prev, `❌ ${message}`]);
      originalError(...args);
    };

    // Rodar testes
    testQueries().finally(() => setIsRunning(false));

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
      >
        Mostrar Diagnóstico
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 z-50 bg-slate-950 border-slate-700">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
          Diagnóstico
        </CardTitle>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </CardHeader>
      <CardContent className="p-2">
        <div className="bg-slate-900 rounded p-2 max-h-80 overflow-y-auto text-xs font-mono text-slate-100 space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500">Nenhum log...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
