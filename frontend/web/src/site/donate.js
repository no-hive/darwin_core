(() => {
 const main=document.querySelector('.donate-main'),status=main?.querySelector('.donation-copy-status');
 if(!main||!status)return;
 const es=document.documentElement.lang==='es';let timer;
 function announce(message){status.textContent=message;status.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{status.hidden=true;},6000);}
 async function copy(button){
  const address=button?.dataset.address;if(!address||button.disabled)return;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(address);announce(es?'Dirección copiada.':'Address copied.');}
  catch{announce(es?'No se pudo copiar la dirección.':'Could not copy the address.');}
 }
 main.addEventListener('click',event=>{const button=event.target.closest?.('[data-donation-copy]');if(button)copy(button);});
 main.addEventListener('dblclick',event=>{if(event.target.closest?.('a,button,input,select,textarea'))return;copy(event.target.closest?.('.donation-row')?.querySelector('[data-donation-copy]'));});
})();
