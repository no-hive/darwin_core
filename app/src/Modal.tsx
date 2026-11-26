import {useEffect,useRef,type ReactNode} from 'react';
interface Props {id:string;titleId:string;open:boolean;onClose:()=>void;children:ReactNode}
export function Modal({id,titleId,open,onClose,children}:Props){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close();},[open]);
  return <dialog className="proto-dialog" id={id} aria-labelledby={titleId} ref={ref} onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose}>{children}</dialog>;
}
