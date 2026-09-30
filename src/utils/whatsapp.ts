import { Order, Reservation } from '../types';
import { RESTAURANT_INFO } from '../data/initialCatalog';

export function createWhatsAppOrderLink(order: Order): string {
  const itemsSummary = order.items
    .map(i => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString('fr-FR')} F`)
    .join('\n');

  const modeText = order.mode === 'delivery'
    ? `Livraison à : ${order.quartier ? `${order.quartier}, ` : ''}${order.address || ''}${order.indications ? ` (${order.indications})` : ''}`
    : `Retrait sur place (heure souhaitée : ${order.pickupTime || 'Dès que prêt'})`;

  const message = [
    `Bonjour Bineta ! 👩🏾‍🍳`,
    `Je vous contacte concernant ma commande *${order.orderNumber}* (${order.customerName}).`,
    ``,
    `*Détails :*`,
    itemsSummary,
    `*Total : ${order.total.toLocaleString('fr-FR')} FCFA* (Espèces)`,
    `*Mode :* ${modeText}`,
    order.notes ? `*Note :* ${order.notes}` : '',
    ``,
    `Merci beaucoup !`,
  ].filter(Boolean).join('\n');

  return `https://wa.me/221755089731?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppDirectLink(customMessage?: string): string {
  const text = customMessage || `Bonjour Chez Bineta, je souhaite des renseignements sur vos délices ! 😋`;
  return `https://wa.me/221755089731?text=${encodeURIComponent(text)}`;
}

export function createWhatsAppReservationLink(res: Reservation): string {
  const itemsText = res.items.map(i => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity}`).join('\n');
  const message = [
    `Bonjour Bineta, je vous contacte concernant ma réservation pour le dimanche :`,
    `Nom : ${res.customerName}`,
    `Date : ${res.date} à ${res.desiredTime}`,
    `Mode : ${res.mode === 'delivery' ? `Livraison (${res.quartier || ''} ${res.address || ''})` : 'Retrait'}`,
    `Articles souhaités :`,
    itemsText,
    res.notes ? `Note : ${res.notes}` : '',
  ].filter(Boolean).join('\n');

  return `https://wa.me/221755089731?text=${encodeURIComponent(message)}`;
}
