import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/api/catalog';
export function usePublicBookingResource<T>(path: string, enabled = true) {
  const [attempt,setAttempt]=useState(0), [state,setState]=useState<{data:T|null;error:string;loading:boolean}>({data:null,error:'',loading:true});
  useEffect(()=>{if(!enabled){setState({data:null,error:'',loading:false});return;}const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let active=true;
    fetch(API_BASE_URL+'/api/v1/booking/public'+path,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Chưa tải được đánh giá.');return response.json() as Promise<T>;}).then(data=>{if(active)setState({data,error:'',loading:false});}).catch(error=>{if(active)setState({data:null,error:error.name==='AbortError'?'Kết nối quá lâu.':error.message,loading:false});}).finally(()=>clearTimeout(timeout));
    return()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[path,attempt,enabled]);
  return {...state,retry:()=>setAttempt(x=>x+1)};
}
