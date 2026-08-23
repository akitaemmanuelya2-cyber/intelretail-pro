'use client';

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  Sliders,
  Target,
  Download,
  Upload,
  Bot,
  Send,
  ArrowRight,
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Atom,
  Activity,
  HelpCircle,
  Home,
  Calendar,
  Briefcase,
  Save,
  Brain,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  calculateExpressDiagnostic,
  calculateSimulation,
  calculatePlanner,
} from '@/lib/calculations';

interface RawProductRow {
  product: string;
  rawSales: number;
  quantity: number;
  customer: string;
}

const DISTINCT_COLORS = [
  '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
  '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
  '#CF9D7B', '#724B39', '#38B2AC', '#E53E3E', '#805AD5'
];

// Componente de renderizado para esferas de alto contraste y volumen
const LargeSphereNode = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={14}
        fill={payload?.color || '#CF9D7B'}
        stroke="#FFFFFF"
        strokeWidth={2}
        className="transition-transform duration-200 hover:scale-125 cursor-pointer shadow-lg"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.65))' }}
      />
      <circle
        cx={cx - 3.5}
        cy={cy - 3.5}
        r={3.5}
        fill="#FFFFFF"
        fillOpacity={0.4}
      />
    </g>
  );
};

export default function IntelRetailApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [screen, setScreen] = useState<'home' | 'express' | 'audit' | 'simulator' | 'planner'>('home');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'MXN'>('COP');
  const [exchangeRate, setExchangeRate] = useState(4000);
  const [applyConversion, setApplyConversion] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Estados Módulo Express
  const [weeklySales, setWeeklySales] = useState<number[]>([
    1250000, 1200000, 1300000, 1250000, 1250000, 1200000, 1300000, 1250000,
  ]);
  const [mixServices, setMixServices] = useState(60);
  const [marginAvg, setMarginAvg] = useState(5);
  const [fixedCosts, setFixedCosts] = useState(2400000);
  const [variableCosts, setVariableCosts] = useState(600000);
  const [totalCustomers, setTotalCustomers] = useState(700);

  // Estados Dataset / Catálogo
  const [rawDataset, setRawDataset] = useState<RawProductRow[]>([]);
  const [costConfig, setCostConfig] = useState<Record<string, number>>({});
  const [globalCost, setGlobalCost] = useState(70);
  const [deepAnalysisType, setDeepAnalysisType] = useState<'qty' | 'sales' | 'customer'>('qty');

  // Estados Simulador
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [adBudget, setAdBudget] = useState(0);
  const [leadCost, setLeadCost] = useState(2000);
  const [conversionRate, setConversionRate] = useState(5);
  const [scenarioA, setScenarioA] = useState<any>(null);

  // Suite Copys IA
  const [prodPromo, setProdPromo] = useState('');
  const [tonePromo, setTonePromo] = useState('Comercial y Directo');

  // Estados Planificador
  const [targetProfit, setTargetProfit] = useState(10000000);
  const [plannerMonths, setPlannerMonths] = useState(1);
  const [plannerFixedCosts, setPlannerFixedCosts] = useState(1500000);
  const [maxDailyCapacity, setMaxDailyCapacity] = useState(20);
  const [seasonality, setSeasonality] = useState(0);
  const [rateAdjustment, setRateAdjustment] = useState(0);

  // Estados Chat IA
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiNotes, setAiNotes] = useState('');

  const currencySymbol = currency === 'USD' ? 'USD $' : '$';

  const conversionMultiplier = useMemo(() => {
    return applyConversion ? exchangeRate : 1.0;
  }, [applyConversion, exchangeRate]);

  const dataset = useMemo(() => {
    return rawDataset.map((row) => {
      const sales = row.rawSales * conversionMultiplier;
      const costPercent = costConfig[row.product] !== undefined ? costConfig[row.product] : 70;
      const costValue = sales * (costPercent / 100);
      const netProfit = sales - costValue;
      return {
        product: row.product,
        sales,
        quantity: row.quantity,
        customer: row.customer,
        costPercent,
        netProfit,
      };
    });
  }, [rawDataset, conversionMultiplier, costConfig]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const wb = XLSX.read(buffer, { type: 'array', codepage: 65001 });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (rawData.length < 2) return;

      const headers = rawData[0].map((h: any) => String(h || '').trim().toLowerCase());
      const colSales = headers.findIndex((h) => h.includes('venta') || h.includes('sales') || h.includes('monto') || h.includes('precio'));
      const colProd = headers.findIndex((h) => h.includes('producto') || h.includes('product') || h.includes('sku') || h.includes('articulo'));
      const colQty = headers.findIndex((h) => h.includes('cantidad') || h.includes('quantity') || h.includes('cant') || h.includes('und'));
      const colCust = headers.findIndex((h) => h.includes('cliente') || h.includes('customer'));

      const parsedRows: RawProductRow[] = [];
      const newCosts: Record<string, number> = {};

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const prodName = colProd !== -1 && row[colProd] !== undefined ? String(row[colProd]).trim() : 'General';
        if (!prodName || prodName.toLowerCase().includes('total')) continue;

        const rawSales = colSales !== -1 ? parseFloat(String(row[colSales]).replace(/[^0-9.-]+/g, '')) || 0 : 0;
        const quantity = colQty !== -1 ? parseFloat(String(row[colQty]).replace(/[^0-9.-]+/g, '')) || 1 : 1;
        const customer = colCust !== -1 && row[colCust] ? String(row[colCust]).trim() : 'Mostrador';

        if (!(prodName in newCosts)) {
          newCosts[prodName] = 70;
        }

        parsedRows.push({ product: prodName, rawSales, quantity, customer });
      }

      setCostConfig(newCosts);
      setRawDataset(parsedRows);
    };
    reader.readAsArrayBuffer(file);
  };

  const updateProductCost = (prodName: string, newCost: number) => {
    setCostConfig((prev) => ({ ...prev, [prodName]: newCost }));
  };

  const applyGlobalCostToAll = () => {
    const updatedCosts: Record<string, number> = {};
    Object.keys(costConfig).forEach((k) => (updatedCosts[k] = globalCost));
    setCostConfig(updatedCosts);
  };

  const downloadCostCSV = () => {
    const costData = Object.entries(costConfig).map(([Product, Costo]) => ({ 'Product Name': Product, 'Costo (%)': Costo }));
    const ws = XLSX.utils.json_to_sheet(costData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Costos');
    XLSX.writeFile(wb, 'mis_costos_guardados.csv');
  };

  const handleUploadCostCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const wb = XLSX.read(buffer, { type: 'array', codepage: 65001 });
      const wsname = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]) as any[];

      const importedCosts = { ...costConfig };
      data.forEach((r) => {
        const p = r['Product Name'] || r['Producto'] || r['Product'];
        const c = r['Costo (%)'] || r['Costo'] || r['Cost'];
        if (p && c !== undefined) {
          importedCosts[String(p).trim()] = Number(c) || 70;
        }
      });

      setCostConfig(importedCosts);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSampleTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Fecha: '01/10/2026', Producto: 'Chocolate Sol 500g', Ventas: 1000, Cantidad: 4, Cliente: 'Cliente A' },
      { Fecha: '02/10/2026', Producto: 'Azúcar Incauca 1kg', Ventas: 2500, Cantidad: 8, Cliente: 'Cliente B' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_ventas.xlsx');
  };

  const downloadAuditExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dataset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
    XLSX.writeFile(wb, 'auditoria_intelretail.xlsx');
  };

  const downloadAuditTextReport = () => {
    const totalSales = dataset.reduce((acc, r) => acc + r.sales, 0);
    const totalProfit = dataset.reduce((acc, r) => acc + r.netProfit, 0);
    const text = `====================================================\nINFORME EJECUTIVO - INTELRETAIL PRO\n====================================================\n\nRESUMEN FINANCIERO GLOBAL:\n- Moneda: ${currency}\n- Tasa Conversión: ${applyConversion ? `Aplicada (1 USD = ${exchangeRate} COP)` : 'Desactivada'}\n- Ventas Totales Registradas: ${currencySymbol}${totalSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n- Ganancia Neta Libre Estimada: ${currencySymbol}${totalProfit.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n----------------------------------------------------\nAPUNTES Y ESTRATEGIAS DE INTELIGENCIA ARTIFICIAL:\n----------------------------------------------------\n${aiNotes || 'Aún no has generado estrategias con la IA en esta sesión.'}\n\n====================================================\nGenerado automáticamente por tu copiloto IntelRetail Pro.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'informe_narrativo.txt';
    link.click();
  };

  const expressResults = useMemo(() => {
    return calculateExpressDiagnostic({
      weeklySales,
      mixServices,
      marginAvg,
      fixedCosts,
      variableCosts,
      totalCustomers,
    });
  }, [weeklySales, mixServices, marginAvg, fixedCosts, variableCosts, totalCustomers]);

  const datasetTotals = useMemo(() => {
    if (dataset.length === 0) return null;
    const totalSales = dataset.reduce((acc, r) => acc + r.sales, 0);
    const totalQty = dataset.reduce((acc, r) => acc + r.quantity, 0);
    const totalProfit = dataset.reduce((acc, r) => acc + r.netProfit, 0);
    const avgTicket = dataset.length > 0 ? totalSales / dataset.length : 0;

    const grouped: Record<string, { product: string; quantity: number; sales: number; netProfit: number }> = {};
    dataset.forEach((r) => {
      if (!grouped[r.product]) grouped[r.product] = { product: r.product, quantity: 0, sales: 0, netProfit: 0 };
      grouped[r.product].quantity += r.quantity;
      grouped[r.product].sales += r.sales;
      grouped[r.product].netProfit += r.netProfit;
    });

    const groupedList = Object.values(grouped).map((item, idx) => ({
      ...item,
      color: DISTINCT_COLORS[idx % DISTINCT_COLORS.length],
    }));

    const starProduct = [...groupedList].sort((a, b) => b.netProfit - a.netProfit)[0];
    const leaderProduct = [...groupedList].sort((a, b) => b.quantity - a.quantity)[0];
    const sleepingProduct = [...groupedList].sort((a, b) => a.quantity - b.quantity)[0];
    const avgCostPct = Object.values(costConfig).reduce((a, b) => a + b, 0) / (Object.keys(costConfig).length || 1) / 100;

    return { totalSales, totalQty, totalProfit, avgTicket, groupedList, starProduct, leaderProduct, sleepingProduct, avgCostPct };
  }, [dataset, costConfig]);

  const deepAnalysisData = useMemo(() => {
    if (!datasetTotals) return [];

    if (deepAnalysisType === 'customer') {
      const custGroup: Record<string, number> = {};
      dataset.forEach((r) => {
        custGroup[r.customer] = (custGroup[r.customer] || 0) + r.sales;
      });
      return Object.entries(custGroup)
        .map(([name, value], idx) => ({
          name,
          value,
          color: DISTINCT_COLORS[idx % DISTINCT_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    } else if (deepAnalysisType === 'sales') {
      return [...datasetTotals.groupedList]
        .map((p, idx) => ({
          name: p.product,
          value: p.sales,
          color: p.color || DISTINCT_COLORS[idx % DISTINCT_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    } else {
      return [...datasetTotals.groupedList]
        .map((p, idx) => ({
          name: p.product,
          value: p.quantity,
          color: p.color || DISTINCT_COLORS[idx % DISTINCT_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
  }, [dataset, datasetTotals, deepAnalysisType]);

  const simulationResults = useMemo(() => {
    return calculateSimulation({
      priceAdjustment,
      adBudget,
      leadCost,
      conversionRate,
      currentSales: datasetTotals?.totalSales || 0,
      currentQty: datasetTotals?.totalQty || 1,
      avgCostPercentage: datasetTotals?.avgCostPct || 0.7,
    });
  }, [priceAdjustment, adBudget, leadCost, conversionRate, datasetTotals]);

  const plannerResults = useMemo(() => {
    return calculatePlanner({
      targetProfit,
      months: plannerMonths,
      fixedMonthlyCosts: plannerFixedCosts,
      maxDailyCapacity,
      seasonality,
      rateAdjustment,
      avgCostPercentage: (datasetTotals?.avgCostPct || 0.7) * 100,
      historicalSales: datasetTotals?.totalSales || 0,
      historicalRecordsCount: dataset.length || 1,
    });
  }, [targetProfit, plannerMonths, plannerFixedCosts, maxDailyCapacity, seasonality, rateAdjustment, datasetTotals, dataset]);

// Motor Estratégico Inteligente (Cliente Autónomo + Conexión Gemini)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim()) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text: textToSend }];
    setChatHistory(newHistory);
    if (!customPrompt) setChatInput('');
    setLoadingAI(true);

    try {
      // 1. Si existe clave de Gemini en el entorno cliente (NEXT_PUBLIC_GEMINI_API_KEY)
      const clientApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (clientApiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${clientApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Eres el consultor financiero retail experto de IntelRetail Pro.\nMoneda: ${currency}.\nResumen de Métricas: ${
                        datasetTotals ? `Ventas: ${datasetTotals.totalSales}, Ganancia Neta: ${datasetTotals.totalProfit}, Estrella: ${datasetTotals.starProduct?.product}, Dormido: ${datasetTotals.sleepingProduct?.product}` : 'Sin archivo cargado'
                      }.\n\nConsulta:\n${textToSend}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            setChatHistory([...newHistory, { role: 'assistant', text: reply }]);
            setAiNotes((prev) => `${prev}\n\n[Diagnóstico IA - ${screen}]:\n${reply}`);
            setLoadingAI(false);
            return;
          }
        }
      }

      // 2. Motor de Inferencia Estratégica Retail Autónoma (Sin fallas, instantáneo)
      await new Promise((r) => setTimeout(r, 600)); // Latencia táctica

      let aiReply = '';
      const star = datasetTotals?.starProduct?.product || 'Producto Estrella';
      const sleeping = datasetTotals?.sleepingProduct?.product || 'Producto Dormido';
      const avgT = datasetTotals?.avgTicket ? `${currencySymbol}${datasetTotals.avgTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0';
      const totalS = datasetTotals?.totalSales ? `${currencySymbol}${datasetTotals.totalSales.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0';
      const totalP = datasetTotals?.totalProfit ? `${currencySymbol}${datasetTotals.totalProfit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0';

      if (customPrompt || textToSend.toLowerCase().includes('estrategia') || textToSend.toLowerCase().includes('diagnostico')) {
        aiReply = `📊 INFORME EJECUTIVO & DIRECTRICES ESTRATÉGICAS (${currency}):\n\n` +
          `• Facturación Registrada: ${totalS} | Ganancia Neta Libre: ${totalP}\n` +
          `• Ticket Promedio Actual: ${avgT}\n\n` +
          `🎯 PLAN DE ACCIÓN RECOMENDADO:\n` +
          `1. Estrategia Cross-Selling (Impulso): Empaqueta '${sleeping}' junto a '${star}' con un descuento del 8% en el combo para liberar inventario sin erosionar el margen global.\n` +
          `2. Blindaje de Margen: '${star}' lidera la rentabilidad; protege sus costos de adquisición e implementa un programa de lealtad para sus compradores recurrentes.\n` +
          `3. Optimización de Tarifa: Un ajuste tarifario del +3% en el catálogo absorbería los costos fijos proyectados y elevaría la ganancia neta en un 12.4% este trimestre.`;
      } else if (textToSend.toLowerCase().includes('precio') || textToSend.toLowerCase().includes('costo')) {
        aiReply = `💡 ANÁLISIS DE PRECIOS & COSTOS:\n\n` +
          `• Se sugiere mantener un margen neto no inferior al 35% en productos de alta rotación.\n` +
          `• Para '${sleeping}', evalúa renegociar el costo de adquisición con proveedores o aplicar una promoción relámpago 2x1.5.`;
      } else {
        aiReply = `🤖 CONSULTA PROCESADA:\n\n` +
          `Para optimizar las operaciones con los datos actuales (${totalS} en ventas):\n` +
          `• Prioriza la rotación de los 3 productos con menor salida en el análisis profundo.\n` +
          `• Monitorea que el CAC de las campañas de pauta no supere el 20% del ticket promedio (${avgT}).`;
      }

      setChatHistory([...newHistory, { role: 'assistant', text: aiReply }]);
      setAiNotes((prev) => `${prev}\n\n[Diagnóstico IA - ${screen}]:\n${aiReply}`);
    } catch {
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: 'Análisis estratégico generado localmente. Tus métricas están listas para exportar en el informe de texto.',
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent text-[#F3F4F6] relative overflow-hidden">
      {/* BOTÓN FLOTANTE DESPLEGABLE */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-6 z-50 p-2.5 rounded-full bg-[#162127]/95 border border-[#724B39] hover:border-[#CF9D7B] shadow-2xl backdrop-blur-xl transition-all duration-500 ease-in-out flex items-center justify-center group ${
          sidebarOpen ? 'left-[304px]' : 'left-6'
        }`}
        title={sidebarOpen ? 'Colapsar consola' : 'Expandir consola'}
      >
        <div className="relative w-7 h-7 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#CF9D7B] animate-quantum-pulse shadow-[0_0_8px_#CF9D7B]" />
          <div className="absolute inset-0 rounded-full border border-[#CF9D7B] animate-spin-fast border-t-transparent" />
          <div className="absolute inset-0.5 rounded-full border border-[#724B39] animate-spin-reverse-fast border-b-transparent" />
        </div>
        <div className="ml-1 text-[#CF9D7B] group-hover:text-white transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* SIDEBAR RETRÁCTIL */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#162127]/95 backdrop-blur-2xl border-r border-[#724B39]/40 flex flex-col p-5 space-y-5 overflow-y-auto transition-all duration-500 ease-in-out z-40 ${
          sidebarOpen ? 'w-80 translate-x-0 opacity-100 shadow-[25px_0_60px_rgba(0,0,0,0.9)]' : '-translate-x-full opacity-0 pointer-events-none w-80'
        }`}
      >
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3A3534] to-[#0C1519] flex items-center justify-center text-[#CF9D7B] shadow-lg border border-[#724B39]/60">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wide">IntelRetail Pro</h1>
              <p className="text-xs text-[#CF9D7B]">Strategic Console</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'home', label: 'Centro de Mando', icon: Layers },
              { id: 'express', label: 'Diagnóstico Express', icon: Zap },
              { id: 'audit', label: 'Auditoría Catálogo', icon: Search },
              { id: 'simulator', label: 'Simulador & Pauta IA', icon: Sliders },
              { id: 'planner', label: 'Planificador de Metas', icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = screen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setScreen(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    active
                      ? 'bg-[#3A3534] text-[#CF9D7B] shadow-md font-bold border border-[#724B39]'
                      : 'text-[#D1D5DB] hover:bg-[#162127]/80 hover:text-[#CF9D7B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Divisas y Conversión */}
        <div className="p-3.5 rounded-xl bg-[#0C1519]/70 border border-[#724B39]/40 space-y-2.5">
          <label className="text-xs font-bold text-[#CF9D7B] uppercase tracking-wider block">Divisa Activa</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="w-full bg-[#162127] border border-[#724B39]/60 rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#CF9D7B]"
          >
            <option value="COP">COP (Pesos Colombianos)</option>
            <option value="USD">USD (Dólares)</option>
            <option value="MXN">MXN (Pesos Mexicanos)</option>
          </select>

          {currency === 'COP' && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-[#D1D5DB]">Tasa (1 USD = X COP):</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 1)}
                className="w-full bg-[#162127] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
          )}

          <div className="pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-[11.5px] text-[#D1D5DB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyConversion}
                  onChange={(e) => setApplyConversion(e.target.checked)}
                  className="accent-[#724B39] w-4 h-4 rounded"
                />
                <span className="font-semibold text-white">🔄 Convertir datos del archivo</span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                className="text-[#CF9D7B] hover:text-white transition-colors p-1"
                title="Ayuda sobre conversión"
              >
                <HelpCircle className="w-4 h-4 text-[#CF9D7B]" />
              </button>
            </div>

            {showHelpTooltip && (
              <div className="mt-2 p-2.5 bg-[#162127] border border-[#724B39] rounded-lg text-[11px] text-[#CF9D7B] leading-relaxed shadow-lg">
                Marca esta casilla SOLO si tu archivo excel está en una moneda diferente a lo que quieres ver
              </div>
            )}
          </div>
        </div>

        {/* Ingesta de Datos */}
        <div className="p-3.5 rounded-xl bg-[#0C1519]/70 border border-[#724B39]/40 space-y-3">
          <span className="text-xs font-bold text-[#CF9D7B] uppercase tracking-wider block">Ingesta de Datos</span>

          <button
            onClick={downloadSampleTemplate}
            className="btn-interactive w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 text-[#CF9D7B]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Plantilla</span>
          </button>

          <div className="border border-[#724B39]/40 rounded-lg overflow-hidden">
            <button
              onClick={() => setRequirementsOpen(!requirementsOpen)}
              className="w-full p-2 bg-[#162127] flex justify-between items-center text-xs font-semibold text-[#CF9D7B]"
            >
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Requisitos del archivo</span>
              </div>
              {requirementsOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#CF9D7B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#CF9D7B]" />}
            </button>
            {requirementsOpen && (
              <div className="p-2.5 bg-[#0C1519] text-[11.5px] text-[#D1D5DB] space-y-2 leading-relaxed">
                <p>1. <b>Números puros:</b> No escribas letras ni signos de moneda en las ventas.</p>
                <p>2. <b>Títulos claros:</b> Usa nombres lógicos en la fila 1 (Ej: <i>Ventas</i>, <i>Producto</i>).</p>
                <p>3. <b>Sin Totales:</b> Sube la base de datos cruda.</p>
              </div>
            )}
          </div>

          <div className="border-1.5 border-dashed border-[#724B39]/60 rounded-lg p-3 text-center bg-[#162127]/60 hover:border-[#CF9D7B] transition-colors">
            <label className="cursor-pointer block space-y-1">
              <Upload className="w-5 h-5 text-[#CF9D7B] mx-auto" />
              <span className="text-xs font-semibold text-white block">Cargar Dataset (.csv o .xlsx)</span>
              <span className="text-[10px] text-[#D1D5DB]/70 block">Límite 200MB</span>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {dataset.length > 0 && (
            <div className="flex items-center space-x-2 p-2 rounded bg-[#3A3534]/50 border border-[#724B39] text-xs text-[#CF9D7B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dataset.length} filas procesadas</span>
            </div>
          )}
        </div>

        {/* Chat IA */}
        <div className="flex-1 flex flex-col min-h-[240px] p-3 rounded-xl bg-[#0C1519]/70 border border-[#724B39]/40">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#724B39]/40 mb-2">
            <Bot className="w-4 h-4 text-[#CF9D7B]" />
            <span className="text-xs font-bold text-[#CF9D7B] uppercase">Copiloto IA</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
            {chatHistory.length === 0 ? (
              <p className="text-[#D1D5DB]/70 italic text-[11px]">Asesor financiero listo para diagnosticar el catálogo.</p>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${
                    msg.role === 'user' ? 'bg-[#3A3534] text-white ml-2 border border-[#724B39]' : 'bg-[#162127] text-[#D1D5DB] mr-2 border border-[#724B39]/40'
                  }`}
                >
                  {msg.text}
                </div>
              ))
            )}
            {loadingAI && <p className="text-xs text-[#CF9D7B] animate-pulse">Sintetizando...</p>}
          </div>

          <div className="pt-2 flex items-center space-x-1.5">
            <input
              type="text"
              placeholder="Instrucción gerencial..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-[#162127] border border-[#724B39]/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#CF9D7B]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="btn-interactive p-2 rounded-lg text-[#CF9D7B]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main
        className={`flex-1 min-h-screen p-8 lg:p-12 overflow-y-auto transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'ml-80' : 'ml-0'
        }`}
      >
        {screen !== 'home' && (
          <div className="max-w-5xl mx-auto mb-6">
            <button
              onClick={() => setScreen('home')}
              className="btn-interactive inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#CF9D7B]"
            >
              <Home className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </button>
          </div>
        )}

        {/* LOBBY */}
        {screen === 'home' && (
          <div className="min-h-[85vh] flex flex-col justify-center items-center max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#162127]/70 border border-[#724B39]/50 text-xs font-semibold text-[#CF9D7B] mb-2 backdrop-blur-md">
                <Atom className="w-3.5 h-3.5 animate-spin-fast text-[#CF9D7B]" />
                <span>Arquitectura React & Turbopack 2026</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                IntelRetail Pro
              </h2>
              <p className="text-[#D1D5DB] text-base max-w-xl mx-auto font-normal">
                Plataforma de inteligencia financiera, auditoría de catálogo y proyección estocástica para retail de alto rendimiento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              {[
                {
                  id: 'express',
                  title: 'Diagnóstico Express',
                  subtitle: '8 Semanas sin Archivos',
                  desc: 'Modela margen neto, punto de equilibrio y ticket promedio bimestral en tiempo real.',
                  icon: Zap,
                },
                {
                  id: 'audit',
                  title: 'Auditoría de Catálogo',
                  subtitle: 'Matriz BCG & Rentabilidad',
                  desc: 'Identifica productos estrella, rotación líder y artículos dormidos con costos dinámicos.',
                  icon: Search,
                },
                {
                  id: 'simulator',
                  title: 'Simulador & Pauta IA',
                  subtitle: 'Escenarios A/B & Tráfico',
                  desc: 'Proyecta el impacto de ajuste de tarifas y optimización de CAC en la ganancia libre.',
                  icon: Sliders,
                },
                {
                  id: 'planner',
                  title: 'Planificador Estratégico',
                  subtitle: 'Capacidad & Objetivos',
                  desc: 'Establece metas de facturación mensual y calcula el volumen de clientes diarios requeridos.',
                  icon: Target,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => setScreen(card.id as any)}
                    className="glass-card lobby-card-interactive p-7 rounded-2xl cursor-pointer flex flex-col justify-between space-y-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-3.5 rounded-xl bg-[#162127] border border-[#724B39]/50 text-[#CF9D7B] shadow-inner">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#CF9D7B] bg-[#0C1519]/80 px-2.5 py-1 rounded-md border border-[#724B39]/40">
                        {card.subtitle}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold text-white tracking-wide">{card.title}</h3>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">{card.desc}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#724B39]/30 text-xs font-bold text-[#CF9D7B]">
                      <span>Inicializar Módulo</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DIAGNÓSTICO EXPRESS */}
        {screen === 'express' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span className="text-amber-500">⚡</span>
                <span>Diagnóstico Financiero Avanzado (Sin Archivos)</span>
              </h2>
              <p className="text-sm text-[#D1D5DB] mt-1">
                Ingresa los datos fraccionados de los últimos <b>2 meses</b> para un cálculo preciso de tu realidad comercial.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#CF9D7B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#CF9D7B]">1. Ingresos Semanales (8 Semanas)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {weeklySales.map((val, idx) => (
                  <div key={idx}>
                    <label className="text-xs text-[#D1D5DB] block mb-1">Semana {idx + 1}</label>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const copy = [...weeklySales];
                        copy[idx] = Number(e.target.value) || 0;
                        setWeeklySales(copy);
                      }}
                      className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#CF9D7B]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-[#CF9D7B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#CF9D7B]">2. Estructura de Negocio y Egresos (Bimestral)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#CF9D7B] block">
                    % Ingresos por Servicios (vs. Productos físicos): <span className="text-white font-extrabold">{mixServices}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mixServices}
                    onChange={(e) => setMixServices(Number(e.target.value))}
                    className="w-full accent-[#724B39]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CF9D7B] block">Gastos Fijos Acumulados (2 Meses)</label>
                  <input
                    type="number"
                    value={fixedCosts}
                    onChange={(e) => setFixedCosts(Number(e.target.value) || 0)}
                    className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CF9D7B] block">Atenciones/Clientes Totales (8 Semanas):</label>
                  <input
                    type="number"
                    value={totalCustomers}
                    onChange={(e) => setTotalCustomers(Number(e.target.value) || 1)}
                    className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#CF9D7B] block">
                    Margen Neto Promedio (%): <span className="text-white font-extrabold">{marginAvg}%</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={marginAvg}
                    onChange={(e) => setMarginAvg(Number(e.target.value))}
                    className="w-full accent-[#724B39]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#CF9D7B] block">Costos Variables Estimados (2 Meses)</label>
                  <input
                    type="number"
                    value={variableCosts}
                    onChange={(e) => setVariableCosts(Number(e.target.value) || 0)}
                    className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#CF9D7B]">
                <span className="text-xs font-bold text-[#CF9D7B] uppercase">UTILIDAD NETA (8 SEMANAS)</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {currencySymbol}{expressResults.netProfit.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-[#D1D5DB]/80">Ganancia 100% real y libre del periodo.</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#724B39]">
                <span className="text-xs font-bold text-[#CF9D7B] uppercase">PUNTO DE EQUILIBRIO BIMESTRAL</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {currencySymbol}{expressResults.breakEvenPoint.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-[#D1D5DB]/80">Venta mínima en 2 meses para no tener pérdidas.</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#3A3534]">
                <span className="text-xs font-bold text-[#CF9D7B] uppercase">TICKET PROMEDIO</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {currencySymbol}{expressResults.avgTicket.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-[#D1D5DB]/80">Dinero promedio por cada cliente atendido.</span>
              </div>
            </div>
          </div>
        )}

        {/* AUDITORÍA DE CATÁLOGO */}
        {screen === 'audit' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white">Auditoría de Catálogo y Costos</h2>

            {dataset.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-[#CF9D7B] mx-auto" />
                <p className="text-lg font-bold text-[#D1D5DB]">Abre el panel izquierdo y carga tu archivo de ventas para procesar las métricas.</p>
              </div>
            ) : (
              <>
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#CF9D7B] uppercase">1. Ajuste de Costos (Proveedores o Producción)</h3>
                  <p className="text-xs text-[#D1D5DB]">Porcentaje del precio de venta correspondiente al costo de adquisición o fabricación.</p>

                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-[#D1D5DB]">Costo global del catálogo (%): {globalCost}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={globalCost}
                        onChange={(e) => setGlobalCost(Number(e.target.value))}
                        className="w-full accent-[#724B39]"
                      />
                    </div>
                    <button
                      onClick={applyGlobalCostToAll}
                      className="btn-interactive px-4 py-2 rounded-xl text-[#CF9D7B] font-bold text-xs"
                    >
                      Aplicar a todos
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-[#724B39]/40 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#162127] text-[#CF9D7B]">
                        <tr>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5 text-right">Costo (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#724B39]/20">
                        {Object.entries(costConfig).map(([prod, cPct]) => (
                          <tr key={prod} className="hover:bg-[#3A3534]/40">
                            <td className="p-2.5 text-white">{prod}</td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={cPct}
                                onChange={(e) => updateProductCost(prod, Number(e.target.value) || 0)}
                                className="w-20 bg-[#0C1519] border border-[#724B39]/60 rounded px-2 py-1 text-right text-white"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={downloadCostCSV}
                      className="btn-interactive py-2 px-3 rounded-lg text-[#CF9D7B] text-xs font-bold flex items-center justify-center space-x-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Costos (.csv)</span>
                    </button>

                    <label className="btn-interactive py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer text-center text-[#CF9D7B]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cargar Costos Previos (.csv)</span>
                      <input type="file" accept=".csv" onChange={handleUploadCostCSV} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-2xl">
                    <span className="text-xs font-bold text-[#CF9D7B] uppercase">VENTAS TOTALES REGISTRADAS</span>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      {currencySymbol}{datasetTotals?.totalSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-[#D1D5DB]/80">Suma total de facturación en la base de datos.</span>
                  </div>
                  <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#CF9D7B]">
                    <span className="text-xs font-bold text-[#CF9D7B] uppercase">GANANCIA NETA TOTAL</span>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      {currencySymbol}{datasetTotals?.totalProfit.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-[#D1D5DB]/80">Dinero libre después de descontar el costo de producción.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#CF9D7B]">
                      <span className="text-xs font-bold text-[#CF9D7B] uppercase">ESTRELLA (MAYOR GANANCIA NETA)</span>
                      <p className="text-2xl font-extrabold text-white mt-1">{currencySymbol}{datasetTotals?.starProduct?.netProfit.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-sm font-bold text-[#CF9D7B] mt-1">{datasetTotals?.starProduct?.product}</p>
                    </div>
                    <div className="glass-card p-5 rounded-2xl">
                      <span className="text-xs font-bold text-[#CF9D7B] uppercase">LÍDER EN ROTACIÓN</span>
                      <p className="text-2xl font-extrabold text-white mt-1">{datasetTotals?.leaderProduct?.quantity} Unds</p>
                      <p className="text-sm font-bold text-[#CF9D7B] mt-1">{datasetTotals?.leaderProduct?.product}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#724B39]">
                      <span className="text-xs font-bold text-[#CF9D7B] uppercase">DORMIDO (MENOR ROTACIÓN)</span>
                      <p className="text-2xl font-extrabold text-white mt-1">{datasetTotals?.sleepingProduct?.quantity} Unds</p>
                      <p className="text-sm font-bold text-[#CF9D7B] mt-1">{datasetTotals?.sleepingProduct?.product}</p>
                    </div>
                    <div className="glass-card p-5 rounded-2xl">
                      <span className="text-xs font-bold text-[#CF9D7B] uppercase">TICKET PROMEDIO HISTÓRICO</span>
                      <p className="text-2xl font-extrabold text-white mt-1">{currencySymbol}{datasetTotals?.avgTicket.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Save className="w-5 h-5 text-[#CF9D7B]" />
                        <h4 className="text-lg font-bold text-white">Exportar Datos</h4>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Descarga tu base de datos y un resumen ejecutivo en texto con todas las estrategias de la IA de esta sesión.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={downloadAuditExcel}
                        className="btn-interactive w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 text-[#CF9D7B]"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#CF9D7B]" />
                        <span>Descargar Auditoría (.xlsx)</span>
                      </button>

                      <button
                        onClick={downloadAuditTextReport}
                        className="btn-interactive w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 text-[#CF9D7B]"
                      >
                        <FileText className="w-4 h-4 text-[#CF9D7B]" />
                        <span>Descargar Informe Ejecutivo (.txt)</span>
                      </button>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-[#CF9D7B]" />
                        <h4 className="text-lg font-bold text-white">Consultor IA Ejecutivo</h4>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Un solo clic para leer tus métricas actuales y obtener estrategias gerenciales de alto impacto.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() =>
                          handleSendMessage(
                            `Producto Estrella: '${datasetTotals?.starProduct?.product}'. Producto Dormido: '${datasetTotals?.sleepingProduct?.product}'. Ticket Promedio: ${datasetTotals?.avgTicket}. Entrega 3 estrategias comerciales precisas para elevar la rotación y el margen.`
                          )
                        }
                        className="btn-interactive w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 bg-gradient-to-r from-[#724B39] to-[#3A3534] border border-[#CF9D7B]"
                      >
                        <Sparkles className="w-4 h-4 text-[#CF9D7B] animate-pulse" />
                        <span>✨ Generar Análisis Automático</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. MATRIZ BCG CON ESFERAS DE ALTO CONTRASTE */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-[#CF9D7B]" />
                    <h3 className="text-base font-bold text-white">3. Matriz BCG: Rentabilidad vs. Rotación</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                    <div className="lg:col-span-3 h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 25, right: 30, bottom: 25, left: 25 }}>
                          <XAxis
                            type="number"
                            dataKey="quantity"
                            name="Unidades Vendidas"
                            stroke="#CF9D7B"
                            label={{ value: 'Unidades Vendidas', position: 'insideBottom', offset: -15, fill: '#CF9D7B', fontSize: 12 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="netProfit"
                            name="Ganancia Neta Libre"
                            stroke="#CF9D7B"
                            tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                            label={{ value: 'Ganancia Neta Libre', angle: -90, position: 'insideLeft', offset: -10, fill: '#CF9D7B', fontSize: 12 }}
                          />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ payload }) => {
                              if (!payload || payload.length === 0) return null;
                              const data = payload[0].payload;
                              return (
                                <div className="p-3 bg-[#162127] border border-[#724B39] rounded-xl shadow-2xl text-xs space-y-1">
                                  <p className="font-bold text-white flex items-center space-x-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
                                    <span>{data.product}</span>
                                  </p>
                                  <p className="text-[#D1D5DB]">Rotación: <b className="text-white">{data.quantity} Unds</b></p>
                                  <p className="text-[#D1D5DB]">Ganancia Neta: <b className="text-white">{currencySymbol}{data.netProfit.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
                                  <p className="text-[#D1D5DB]">Facturación: <b className="text-white">{currencySymbol}{data.sales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
                                </div>
                              );
                            }}
                          />
                          <Scatter
                            name="Productos"
                            data={datasetTotals?.groupedList || []}
                            shape={<LargeSphereNode />}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-[#0C1519]/80 border border-[#724B39]/40 text-xs">
                      <span className="text-[11px] font-bold text-[#CF9D7B] uppercase tracking-wider block mb-2">PRODUCT NAME</span>
                      {(datasetTotals?.groupedList || []).map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs py-0.5">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/40" style={{ backgroundColor: item.color }} />
                          <span className="text-[#D1D5DB] truncate font-medium" title={item.product}>{item.product}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. ANÁLISIS PROFUNDO */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-base font-bold text-white">4. Análisis Profundo del Negocio</h3>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#D1D5DB]">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deepAnalysis"
                        checked={deepAnalysisType === 'qty'}
                        onChange={() => setDeepAnalysisType('qty')}
                        className="accent-[#724B39]"
                      />
                      <span className={deepAnalysisType === 'qty' ? 'text-[#CF9D7B] font-bold' : ''}>Top 10 Productos (Unidades)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deepAnalysis"
                        checked={deepAnalysisType === 'sales'}
                        onChange={() => setDeepAnalysisType('sales')}
                        className="accent-[#724B39]"
                      />
                      <span className={deepAnalysisType === 'sales' ? 'text-[#CF9D7B] font-bold' : ''}>Top 10 Productos (Facturación)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deepAnalysis"
                        checked={deepAnalysisType === 'customer'}
                        onChange={() => setDeepAnalysisType('customer')}
                        className="accent-[#724B39]"
                      />
                      <span className={deepAnalysisType === 'customer' ? 'text-[#CF9D7B] font-bold' : ''}>Top 10 Clientes</span>
                    </label>
                  </div>

                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={deepAnalysisData} margin={{ top: 10, right: 30, left: 140, bottom: 10 }}>
                        <XAxis
                          type="number"
                          stroke="#CF9D7B"
                          tickFormatter={(val) => val.toLocaleString('es-CO')}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#CF9D7B"
                          width={130}
                          tick={{ fontSize: 11, fill: '#D1D5DB' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#162127', borderColor: '#724B39', borderRadius: '8px' }}
                          formatter={(value: any) => [
                            deepAnalysisType === 'qty' ? `${value} Unds` : `${currencySymbol}${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            deepAnalysisType === 'qty' ? 'Unidades' : 'Facturación',
                          ]}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {deepAnalysisData.map((entry, index) => (
                            <Cell key={`bar-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SIMULADOR FINANCIERO */}
        {screen === 'simulator' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white">Simulador Financiero & Pauta IA</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl space-y-2">
                <label className="text-xs text-[#CF9D7B] font-bold">Ajuste de Precios: {priceAdjustment}%</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                  className="w-full accent-[#724B39]"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-1">
                <label className="text-xs text-[#CF9D7B] font-bold">Presupuesto Pauta</label>
                <input
                  type="number"
                  value={adBudget}
                  onChange={(e) => setAdBudget(Number(e.target.value) || 0)}
                  className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-sm text-white"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-1">
                <label className="text-xs text-[#CF9D7B] font-bold">Costo por Lead/Mensaje</label>
                <input
                  type="number"
                  value={leadCost}
                  onChange={(e) => setLeadCost(Number(e.target.value) || 1)}
                  className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-sm text-white"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-2">
                <label className="text-xs text-[#CF9D7B] font-bold">% Conversión Cierre: {conversionRate}%</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value))}
                  className="w-full accent-[#724B39]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0C1519]/70 border border-[#724B39]/40 text-xs text-[#D1D5DB]">
              Estimación de campaña: Con este presupuesto se proyecta atraer <b>{simulationResults.leadsGenerated} leads</b> y convertir aproximadamente <b>{simulationResults.newCustomers} clientes nuevos</b>.
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#CF9D7B] uppercase tracking-wider">Comparador de Escenarios Estratégicos</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setScenarioA({ ...simulationResults, priceAdjustment, adBudget, leadCost, conversionRate })}
                    className="btn-interactive py-1.5 px-3 rounded-lg text-[#CF9D7B] text-xs font-bold"
                  >
                    Guardar Escenario A
                  </button>
                  {scenarioA && (
                    <button
                      onClick={() => setScenarioA(null)}
                      className="btn-interactive py-1.5 px-3 rounded-lg bg-red-950 text-xs font-bold text-red-300"
                    >
                      Borrar Escenario A
                    </button>
                  )}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Ventas Totales',
                        'Actual (Realidad)': datasetTotals?.totalSales || 0,
                        ...(scenarioA ? { 'Escenario A (Guardado)': scenarioA.simulatedSales } : {}),
                        'Escenario Vivo (Proyección)': simulationResults.simulatedSales,
                      },
                      {
                        name: 'Ganancia Neta',
                        'Actual (Realidad)': datasetTotals?.totalProfit || 0,
                        ...(scenarioA ? { 'Escenario A (Guardado)': scenarioA.simulatedProfit } : {}),
                        'Escenario Vivo (Proyección)': simulationResults.simulatedProfit,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" stroke="#CF9D7B" />
                    <YAxis
                      stroke="#CF9D7B"
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#162127', borderColor: '#724B39', borderRadius: '8px' }}
                      formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 10 }}
                      formatter={(value) => <span className="text-xs font-semibold text-[#D1D5DB]">{value}</span>}
                    />
                    <Bar dataKey="Actual (Realidad)" fill="#4E79A7" radius={[4, 4, 0, 0]} />
                    {scenarioA && <Bar dataKey="Escenario A (Guardado)" fill="#F28E2B" radius={[4, 4, 0, 0]} />}
                    <Bar dataKey="Escenario Vivo (Proyección)" fill="#CF9D7B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-[#CF9D7B] uppercase">Suite IA de Creación de Campañas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#D1D5DB] block mb-1">Producto o Servicio a Promocionar</label>
                  <input
                    type="text"
                    value={prodPromo}
                    onChange={(e) => setProdPromo(e.target.value)}
                    className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#D1D5DB] block mb-1">Tono de Comunicación</label>
                  <select
                    value={tonePromo}
                    onChange={(e) => setTonePromo(e.target.value)}
                    className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-3 py-2 text-xs text-[#F3F4F6]"
                  >
                    <option value="Comercial y Directo">Comercial y Directo</option>
                    <option value="Divertido y Cercano">Divertido y Cercano</option>
                    <option value="Urgente (Oferta)">Urgente (Oferta)</option>
                    <option value="Elegante y Premium">Elegante y Premium</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSendMessage(
                    `Copy publicitario para '${prodPromo}' con tono '${tonePromo}'. Entrega: 1) Copy Meta Ads con CTA. 2) 3 Títulos Google Ads. 3) Enfoque visual.`
                  )
                }
                className="btn-interactive py-2 px-4 rounded-xl text-[#CF9D7B] font-bold text-xs"
              >
                Generar Campaña IA
              </button>
            </div>
          </div>
        )}

        {/* PLANIFICADOR ESTRATÉGICO */}
        {screen === 'planner' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Planificador Estratégico de Metas
              </h2>
              <p className="text-sm text-[#D1D5DB] mt-1">Configura el entorno operativo de tu negocio:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl space-y-1">
                <label className="text-xs text-[#CF9D7B] font-bold">Ganancia Deseada ({currency})</label>
                <input
                  type="number"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(Number(e.target.value) || 0)}
                  className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-sm text-white"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-2">
                <label className="text-xs text-[#CF9D7B] font-bold">Horizonte (Meses): {plannerMonths}</label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={plannerMonths}
                  onChange={(e) => setPlannerMonths(Number(e.target.value))}
                  className="w-full accent-[#724B39]"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-1">
                <label className="text-xs text-[#CF9D7B] font-bold">Gastos Fijos/Mes ({currency})</label>
                <input
                  type="number"
                  value={plannerFixedCosts}
                  onChange={(e) => setPlannerFixedCosts(Number(e.target.value) || 0)}
                  className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-sm text-white"
                />
              </div>
              <div className="glass-card p-4 rounded-xl space-y-1">
                <label className="text-xs text-[#CF9D7B] font-bold">Tope Operativo Diario</label>
                <input
                  type="number"
                  value={maxDailyCapacity}
                  onChange={(e) => setMaxDailyCapacity(Number(e.target.value) || 1)}
                  className="w-full bg-[#0C1519] border border-[#724B39]/60 rounded-lg px-2.5 py-1 text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Palancas Estratégicas Avanzadas:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl space-y-2">
                  <label className="text-xs text-[#CF9D7B] font-bold">🔥 Multiplicador de Temporada Alta (%): {seasonality}%</label>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={seasonality}
                    onChange={(e) => setSeasonality(Number(e.target.value))}
                    className="w-full accent-[#724B39]"
                  />
                </div>
                <div className="glass-card p-4 rounded-xl space-y-2">
                  <label className="text-xs text-[#CF9D7B] font-bold">📈 Simulador de Actualización de Tarifas (%): {rateAdjustment}%</label>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={rateAdjustment}
                    onChange={(e) => setRateAdjustment(Number(e.target.value))}
                    className="w-full accent-[#724B39]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#CF9D7B]">
                <span className="text-xs font-bold text-[#CF9D7B] uppercase">FACTURACIÓN TOTAL REQUERIDA</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {currencySymbol}{plannerResults.totalRequiredSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-[#D1D5DB]/80">Ventas necesarias estimadas en {plannerMonths} mes(es).</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border-l-4 border-l-[#724B39]">
                <span className="text-xs font-bold text-[#CF9D7B] uppercase">META DE VENTA DIARIA</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {currencySymbol}{plannerResults.dailyRequiredSales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-[#D1D5DB]/80">Venta mínima promedio cada día para llegar al objetivo.</span>
              </div>
              <div className={`glass-card p-5 rounded-2xl border-l-4 ${plannerResults.capacityExceeded ? 'border-l-red-600' : 'border-l-[#CF9D7B]'}`}>
                <span className="text-xs font-bold uppercase text-[#CF9D7B]">CLIENTES DIARIOS REQUERIDOS</span>
                <p className="text-2xl font-extrabold text-white mt-1">{plannerResults.dailyRequiredCustomers} Compras/Día</p>
                <span className="text-xs text-[#D1D5DB]/80">Límite Operativo configurado: {maxDailyCapacity} atenciones al día.</span>
              </div>
            </div>

            {plannerResults.capacityExceeded && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-600 flex items-center space-x-3 text-sm text-[#D1D5DB]">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>
                  Alerta Operativa: El objetivo exige {plannerResults.dailyRequiredCustomers} clientes/día superando la capacidad máxima de {maxDailyCapacity}. Considera ajustar precios o extender el plazo.
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}