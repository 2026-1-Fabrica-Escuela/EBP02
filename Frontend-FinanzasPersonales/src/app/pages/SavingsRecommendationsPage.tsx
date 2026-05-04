import { useMemo, useState } from "react";
import { AlertTriangle, Info, Lightbulb, Sparkles, TrendingDown } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentSelect } from "../components/ui/FluentSelect";
import { useApp, type Transaction } from "../context/AppContext";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const buildMonthOptions = (): { value: string; label: string }[] => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let monthOffset = 0; monthOffset < 24; monthOffset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    options.push({ value, label });
  }

  return options;
};

const buildMotivo = (
  category: string,
  count: number,
  total: number,
  pct: number,
  isTopSpender: boolean,
): string => {
  const pctStr = pct.toFixed(0);
  const templates: Record<string, string> = {
    "Alimentación": `Registraste ${count} gastos en alimentación (${pctStr}% del gasto mensual). Planificar menús semanales, cocinar en casa y reducir pedidos a domicilio puede disminuir significativamente este rubro.`,
    "Transporte": `Tus gastos en transporte suman ${formatCurrency(total)} este mes. Considera combinar el transporte público con rutas a pie para trayectos cortos y reducir viajes en taxi o plataformas digitales.`,
    "Servicios": `Los servicios representan el ${pctStr}% de tu gasto mensual. Revisa que no tengas suscripciones activas que ya no utilizas y compara tarifas de proveedores alternativos.`,
    "Entretenimiento": `Tienes ${count} movimientos en entretenimiento (${pctStr}% del total). Evalúa las suscripciones activas, busca alternativas gratuitas y establece un límite mensual para este tipo de gasto.`,
    "Salud": `Tus gastos en salud ascienden a ${formatCurrency(total)}. Considera planes preventivos, revisa si tu seguro médico cubre consultas frecuentes y compara precios en farmacias.`,
    "Educación": `Inviertes ${formatCurrency(total)} en educación (${pctStr}% del presupuesto). Busca cursos en línea gratuitos o con descuento como complemento, y prioriza las formaciones con mayor retorno esperado.`,
    "Ropa": `Registraste ${count} compras de ropa por ${formatCurrency(total)}. Planificar compras en temporadas de descuento y crear una lista de prendas necesarias antes de comprar puede reducir gastos impulsivos.`,
    "Otros gastos": `Los gastos varios totalizan ${formatCurrency(total)} este mes (${pctStr}%). Clasificar mejor estos movimientos te ayudará a detectar fugas de presupuesto y establecer límites más precisos.`,
  };

  if (templates[category]) {
    return templates[category];
  }

  if (isTopSpender) {
    return `${category} es tu categoría con mayor gasto este mes (${pctStr}% del total). Establecer un límite mensual y revisar cada movimiento puede generar un ahorro notable.`;
  }

  if (count >= 4) {
    return `Realizaste ${count} movimientos frecuentes en ${category}. Reducir la frecuencia o consolidar compras puede optimizar este gasto.`;
  }

  return `Tus gastos en ${category} representan el ${pctStr}% del gasto mensual. Una reducción moderada generaría un ahorro acumulado importante.`;
};

interface Recommendation {
  category: string;
  motivo: string;
  ahorroEstimado: number;
}

interface MonthResult {
  recs: Recommendation[];
  hasEnoughData: boolean;
  monthLabel: string;
}

const generateRecommendations = (expenses: Transaction[]): Recommendation[] => {
  const groupedByCategory: Record<string, { count: number; total: number }> = {};

  for (const transaction of expenses) {
    if (!groupedByCategory[transaction.category]) {
      groupedByCategory[transaction.category] = { count: 0, total: 0 };
    }

    groupedByCategory[transaction.category].count += 1;
    groupedByCategory[transaction.category].total += transaction.amount;
  }

  const grandTotal = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const entries = Object.entries(groupedByCategory).sort((left, right) => right[1].total - left[1].total);
  const topCategory = entries[0]?.[0];

  const recommendations = entries.map(([category, { count, total }]) => {
    const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
    const isTopSpender = category === topCategory;
    const reductionRate = isTopSpender ? 0.2 : count >= 4 ? 0.15 : 0.1;
    const ahorroEstimado = Math.round(total * reductionRate);

    return {
      category,
      motivo: buildMotivo(category, count, total, pct, isTopSpender),
      ahorroEstimado,
    };
  });

  return recommendations.sort((left, right) => right.ahorroEstimado - left.ahorroEstimado);
};

const CATEGORY_COLORS: Record<string, string> = {
  Alimentación: "#FFC107",
  Transporte: "#00C853",
  Servicios: "#FF5252",
  Entretenimiento: "#FF6D00",
  Salud: "#7C4DFF",
  Educación: "#00BCD4",
  Ropa: "#EC407A",
  "Otros gastos": "#78909C",
};

const catColor = (category: string) => CATEGORY_COLORS[category] ?? "#1A237E";

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const accentColor = catColor(recommendation.category);

  return (
    <FluentCard padding="md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accentColor}18` }}>
            <TrendingDown size={20} style={{ color: accentColor }} />
          </div>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] text-white" style={{ background: accentColor }}>
            {recommendation.category}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-[0.8125rem] leading-relaxed text-[#4a4a5a]">{recommendation.motivo}</p>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="mb-0.5 text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Ahorro estimado</p>
          <p className="text-[1.125rem] font-bold text-[#00C853]">{formatCurrency(recommendation.ahorroEstimado)}</p>
        </div>
      </div>
    </FluentCard>
  );
}

export function SavingsRecommendationsPage() {
  const { user, transactions } = useApp();
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthError, setMonthError] = useState(false);
  const [result, setResult] = useState<MonthResult | null>(null);

  const handleGenerate = () => {
    if (!selectedMonth) {
      setMonthError(true);
      setResult(null);
      return;
    }

    setMonthError(false);

    const monthLabel = monthOptions.find((option) => option.value === selectedMonth)?.label ?? selectedMonth;
    const activeUserId = user?.id;

    if (!activeUserId) {
      setResult({ recs: [], hasEnoughData: false, monthLabel });
      return;
    }

    const expenses = transactions.filter(
      (transaction) =>
        transaction.userId === activeUserId &&
        transaction.type === "gasto" &&
        transaction.date.startsWith(selectedMonth),
    );

    if (expenses.length < 3) {
      setResult({ recs: [], hasEnoughData: false, monthLabel });
      return;
    }

    const recs = generateRecommendations(expenses);
    setResult({ recs, hasEnoughData: true, monthLabel });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Recomendaciones Personales</h1>
        <p className="text-[#6b7280]">Análisis inteligente de tus gastos para identificar oportunidades de ahorro</p>
      </div>

      <FluentCard padding="lg">
        <p className="mb-5 text-[0.8125rem] text-[#6b7280]">Selecciona el mes que deseas analizar</p>

        <div className="flex flex-col items-end gap-4 sm:flex-row">
          <div className="flex-1">
            <FluentSelect
              label="Mes *"
              value={selectedMonth}
              onChange={(value) => {
                setSelectedMonth(value);
                setMonthError(false);
                setResult(null);
              }}
              options={monthOptions}
              placeholder="— Selecciona un mes —"
              error={monthError ? "Campo obligatorio" : undefined}
            />
          </div>

          <FluentButton className="w-full sm:w-auto" onClick={handleGenerate}>
            <Sparkles size={18} />
            Generar recomendaciones
          </FluentButton>
        </div>

        {monthError && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">Debes seleccionar un mes para generar recomendaciones.</p>
          </div>
        )}
      </FluentCard>

      {result && (
        <>
          {!result.hasEnoughData ? (
            <FluentCard>
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFC107]/10">
                  <Info size={28} className="text-[#FFC107]" />
                </div>
                <p className="text-[#1a1a2e]">Datos insuficientes</p>
                <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
                  No hay datos suficientes para generar recomendaciones.
                </p>
              </div>
            </FluentCard>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[0.8125rem] text-[#6b7280]">
                  <Lightbulb size={15} />
                  <span>
                    Recomendaciones para <strong className="text-[#1a1a2e]">{result.monthLabel}</strong>
                  </span>
                </div>
                <span className="rounded-full border border-[#e0e0e0]/60 bg-white px-2.5 py-0.5 text-[0.75rem] text-[#6b7280]">
                  {result.recs.length} {result.recs.length === 1 ? "recomendación" : "recomendaciones"}
                </span>
              </div>

              {result.recs.map((recommendation) => (
                <RecommendationCard key={recommendation.category} recommendation={recommendation} />
              ))}
            </div>
          )}
        </>
      )}

      {!result && !monthError && (
        <FluentCard>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A237E]/10">
              <Lightbulb size={28} className="text-[#1A237E]" />
            </div>
            <p className="text-[#1a1a2e]">Análisis personalizado de gastos</p>
            <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
              Selecciona un mes y haz clic en "Generar recomendaciones" para obtener sugerencias personalizadas basadas en tus hábitos financieros
            </p>
          </div>
        </FluentCard>
      )}
    </div>
  );
}