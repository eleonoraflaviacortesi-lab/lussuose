import { useMemo } from 'react';
import { useDailyData } from './useDailyData';
import { useOperations } from './useOperations';
import { useSedeTargets } from './useSedeTargets';

export const useKPIs = (period: 'week' | 'month' | 'year' = 'month') => {
  const { allData, isLoading: dataLoading } = useDailyData();
  const { operations, isLoading: opsLoading } = useOperations();
  const { targets: sedeTargets, isLoading: targetsLoading } = useSedeTargets();

  const kpis = useMemo(() => {
    if (!allData) return null;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredData = allData.filter(d => new Date(d.date) >= startDate);

    const totals = filteredData.reduce(
      (acc, d) => ({
        contatti: acc.contatti + (d.contatti_reali || 0),
        notizie: acc.notizie + (d.notizie_reali || 0),
        clienti: acc.clienti + (d.clienti_gestiti || 0),
        appuntamenti: acc.appuntamenti + (d.appuntamenti_vendita || 0),
        acquisizioni: acc.acquisizioni + (d.acquisizioni || 0),
        incarichi: acc.incarichi + (d.incarichi_vendita || 0),
        vendite: acc.vendite + (d.vendite_numero || 0),
        fatturato: acc.fatturato + Number(d.vendite_valore || 0),
        trattativeChiuse: acc.trattativeChiuse + (d.trattative_chiuse || 0),
        fatturatoCredito: acc.fatturatoCredito + Number(d.fatturato_a_credito || 0),
      }),
      {
        contatti: 0,
        notizie: 0,
        clienti: 0,
        appuntamenti: 0,
        acquisizioni: 0,
        incarichi: 0,
        vendite: 0,
        fatturato: 0,
        trattativeChiuse: 0,
        fatturatoCredito: 0,
      }
    );

    // Dynamic targets from sede_targets, scaled by period
    const multiplier = period === 'year' ? 12 : period === 'week' ? 0.25 : 1;
    
    const targets = {
      contatti: Math.round((sedeTargets?.contatti_target || 0) * multiplier),
      notizie: Math.round((sedeTargets?.notizie_target || 0) * multiplier),
      clienti: 0, // No sede target for clienti
      appuntamenti: Math.round((sedeTargets?.appuntamenti_target || 0) * multiplier),
      acquisizioni: Math.round((sedeTargets?.acquisizioni_target || 0) * multiplier),
      incarichi: Math.round((sedeTargets?.incarichi_target || 0) * multiplier),
      vendite: Math.round((sedeTargets?.vendite_target || 4) * multiplier),
      fatturato: Number(sedeTargets?.fatturato_target || 100000) * multiplier,
      trattativeChiuse: Math.round((sedeTargets?.trattative_chiuse_target || 0) * multiplier),
      fatturatoCredito: 0, // No target for this
    };

    return {
      contatti: { value: totals.contatti, target: targets.contatti, delta: totals.contatti - targets.contatti },
      notizie: { value: totals.notizie, target: targets.notizie, delta: totals.notizie - targets.notizie },
      clienti: { value: totals.clienti, target: targets.clienti, delta: totals.clienti - targets.clienti },
      appuntamenti: { value: totals.appuntamenti, target: targets.appuntamenti, delta: totals.appuntamenti - targets.appuntamenti },
      acquisizioni: { value: totals.acquisizioni, target: targets.acquisizioni, delta: totals.acquisizioni - targets.acquisizioni },
      incarichi: { value: totals.incarichi, target: targets.incarichi, delta: totals.incarichi - targets.incarichi },
      vendite: { value: totals.vendite, target: targets.vendite, delta: totals.vendite - targets.vendite },
      fatturato: { value: totals.fatturato, target: targets.fatturato, delta: totals.fatturato - targets.fatturato },
      trattativeChiuse: { value: totals.trattativeChiuse, target: targets.trattativeChiuse, delta: totals.trattativeChiuse - targets.trattativeChiuse },
      fatturatoCredito: { value: totals.fatturatoCredito, target: targets.fatturatoCredito, delta: totals.fatturatoCredito - targets.fatturatoCredito },
    };
  }, [allData, period, sedeTargets]);

  const chartData = useMemo(() => {
    if (!allData) return [];

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);

    const filteredData = allData
      .filter(d => new Date(d.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filteredData.map(d => ({
      date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      contatti: d.contatti_reali || 0,
      notizie: d.notizie_reali || 0,
      appVendita: d.appuntamenti_vendita || 0,
      vendite: d.vendite_numero || 0,
    }));
  }, [allData]);

  return {
    kpis,
    chartData,
    isLoading: dataLoading || opsLoading || targetsLoading,
  };
};
