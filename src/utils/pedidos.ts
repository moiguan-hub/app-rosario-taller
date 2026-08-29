import { supabase } from '../lib/supabase';

export function calcularCosteIndividualPedido(p: any): number {
  if (!p) return 0;
  const m = p.medidas || {};
  let total = parseFloat(m.precioTraje || p.precio_total || '0') || 0;

  // Complementos
  total += parseFloat(m.precio_corbata || m.precioCorbata || '0') || 0;
  total += parseFloat(m.precio_cancan || m.precioCancan || '0') || 0;
  total += parseFloat(m.precio_adorno_pelo || m.precioAdornoPelo || '0') || 0;
  total += parseFloat(m.precio_conjunto_interior || m.precioConjuntoInterior || '0') || 0;

  // Cargos extra propios
  if (Array.isArray(m.cargosExtra)) {
    for (const extra of m.cargosExtra) {
      if (!extra.concepto?.startsWith('[Vinculado]')) {
        total += parseFloat(extra.precio || '0') || 0;
      }
    }
  }
  return total;
}

export async function recalcularPedidoPrincipal(mainOrderId: string) {
  if (!mainOrderId) return null;

  try {
    const { data: todos } = await supabase
      .from('pedidos')
      .select('*')
      .or(`id.eq.${mainOrderId},pedido_principal_id.eq.${mainOrderId}`);

    if (!todos || todos.length === 0) return null;

    const mainOrd = todos.find((p: any) => p.id === mainOrderId);
    if (!mainOrd) return null;

    const secundarios = todos.filter((p: any) => p.pedido_principal_id === mainOrderId);

    // Coste base del pedido principal
    const baseCostMain = calcularCosteIndividualPedido(mainOrd);

    // Limpiar cargos de vinculación anteriores en el pedido principal
    const ownMainCargos = (mainOrd.medidas?.cargosExtra || []).filter(
      (c: any) => !c.concepto?.startsWith('[Vinculado]')
    );

    let totalSuma = baseCostMain;
    const nuevosCargosVinculados: any[] = [];

    for (const sec of secundarios) {
      const secCost = calcularCosteIndividualPedido(sec);
      totalSuma += secCost;
      if (secCost > 0) {
        const rawDesc = sec.medidas?.modelo || sec.descripcion || (sec.detalles_tejido ? sec.detalles_tejido.split(' | ')[0] : '') || sec.categoria || 'Pedido Vinculado';
        const cleanDesc = rawDesc
          .replace(/^\[(SENORA|NINA)\]\s*Modelo:\s*/i, '')
          .replace(/^Modelo:\s*/i, '')
          .trim();

        nuevosCargosVinculados.push({
          concepto: `[Vinculado] ${cleanDesc}`,
          precio: secCost.toString()
        });
      }
    }

    const updatedMedidas = {
      ...mainOrd.medidas,
      cargosExtra: [...ownMainCargos, ...nuevosCargosVinculados]
    };

    await supabase
      .from('pedidos')
      .update({
        precio_total: totalSuma,
        medidas: updatedMedidas
      })
      .eq('id', mainOrderId);

    return { totalSuma, updatedMedidas };
  } catch (err) {
    console.error('Error al recalcular pedido principal:', err);
    return null;
  }
}
