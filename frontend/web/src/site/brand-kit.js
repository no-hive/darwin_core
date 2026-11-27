/* Copy the original PNG during the user's click, including Safari's deferred
 * Blob path. Never substitute a URL or text for an image clipboard operation. */
(() => {
  const kit=document.querySelector('.brand-assets');
  const status=kit?.querySelector('[data-brand-copy-status]');
  if(!kit||!status)return;
  const es=document.documentElement.lang==='es';
  const copy={
    success:es?'Imagen copiada.':'Image copied.',
    unavailable:es?'Este navegador no permite copiar imágenes. Usa el botón de descarga.':'Image copying is unavailable in this browser. Use the download button.',
    failed:es?'No se pudo copiar la imagen. Permite el acceso al portapapeles o descarga el PNG.':'Could not copy the image. Allow clipboard access or download the PNG.'
  };
  let statusTimer;
  function announce(message){
    clearTimeout(statusTimer);
    status.textContent=message;
    status.hidden=false;
    statusTimer=setTimeout(()=>{status.hidden=true;},6000);
  }
  kit.addEventListener('click',async event=>{
    const button=event.target.closest?.('button[data-brand-copy]');
    if(!button||!kit.contains(button)||button.disabled)return;
    if(!globalThis.isSecureContext||!navigator.clipboard?.write||typeof ClipboardItem!=='function'||(ClipboardItem.supports&&!ClipboardItem.supports('image/png'))){
      announce(copy.unavailable);return;
    }
    const url=new URL(button.dataset.brandCopy,location.href);
    if(url.origin!==location.origin||!url.pathname.startsWith('/assets/brand-kit/')||!url.pathname.endsWith('.png'))return;
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    try{
      const image=fetch(url.href,{credentials:'same-origin'}).then(async response=>{
        if(!response.ok)throw Error('PNG download failed');
        const blob=await response.blob();
        return blob.type==='image/png'?blob:new Blob([blob],{type:'image/png'});
      });
      // write() runs before awaiting the network, retaining the user gesture.
      // Consume a fetch rejection even if construction/write rejects first.
      image.catch(()=>{});
      const item=new ClipboardItem({'image/png':image});
      await navigator.clipboard.write([item]);
      announce(copy.success);
    }catch{
      announce(copy.failed);
    }finally{
      button.disabled=false;
      button.removeAttribute('aria-busy');
    }
  });
  kit.addEventListener('dblclick',event=>{
    if(event.target.closest?.('a,button,input,select,textarea'))return;
    const card=event.target.closest?.('.brand-card');
    const download=card?.querySelector('a[download]');
    if(download)download.click();
  });
})();
