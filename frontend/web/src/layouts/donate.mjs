import {donations} from '../content/donations.mjs';

const copyIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M15 4H4v11"/></svg>';
const qrIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3M12 3v2m0 3v4H3m9 3v6m3-9h6m0 0v3M6 6h.01M18 6h.01M6 18h.01"/></svg>';
const icon=(file,size)=>`<img src="/assets/donate/${file}" width="${size}" height="${size}" alt="" aria-hidden="true">`;
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function renderDonate(locale){
  const es=locale==='es';
  const pending=es?'Dirección próximamente':'Address coming soon';
  const unavailable=es?'Disponible cuando se añada la dirección':'Available once the receiving address is added';
  return `<main class="donate-main"><h1>${es?'Apoya la ciencia descentralizada':'Support decentralized science'}</h1>
    <ul class="donation-list" aria-label="${es?'Opciones de donación':'Donation options'}">${donations.map(item=>`<li class="donation-row" data-donation-id="${item.id}">
      <div class="donation-currency">${icon(item.currencyIcon,32)}<span><strong>${item.symbol}</strong><small>${item.name}</small></span></div>
      <span class="donation-address${item.address?'':' donation-address-pending'}">${item.address?esc(item.address):pending}</span>
      <div class="donation-actions"><button type="button" data-donation-copy${item.address?` data-address="${esc(item.address)}"`:` disabled title="${unavailable}"`} aria-label="${es?'Copiar dirección de':'Copy address for'} ${item.symbol}${item.address?'':` — ${unavailable}`} ">${copyIcon}</button><button type="button" disabled title="${unavailable}" aria-label="QR · ${item.symbol} — ${unavailable}">${qrIcon}</button></div>
    </li>`).join('')}</ul>
    <p class="donation-copy-status" role="status" aria-live="polite" hidden></p>
  </main>`;
}
