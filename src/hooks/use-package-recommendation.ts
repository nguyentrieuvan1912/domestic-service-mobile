import { useCallback, useEffect, useState } from 'react';
import { catalogGet } from '@/api/catalog';
import type { CatalogDetail, PackageRecommendation } from '@/api/catalog-types';
import { serviceAnswersIssue } from '@/utils/service-requirements';

export function usePackageRecommendation(detail: CatalogDetail | undefined, answers: Record<string, unknown>, maxStaffCount: number, maxDurationMinutes: number, active: boolean) {
  const field=detail?.requirements.find(item=>item.fieldKey==='areaM2'&&item.fieldType==='NUMBER');
  const area=Number(answers.areaM2);
  const enabled=!!field && Number.isFinite(area) && area>0 && !serviceAnswersIssue([field],answers);
  const measurementKey=enabled?`${detail!.service.id}:${area}`:'';
  const inputKey=measurementKey+':'+maxStaffCount+':'+maxDurationMinutes;
  const [attempt,setAttempt]=useState(0);
  const [state,setState]=useState<{key:string;data:PackageRecommendation|null;loading:boolean;error:string}>({key:'',data:null,loading:false,error:''});
  useEffect(()=>{
    if(!enabled||!active)return;
    const controller=new AbortController();let current=true;
    setState({key:inputKey,data:null,loading:true,error:''});
    const timer=setTimeout(()=>{
      const query=new URLSearchParams({areaM2:String(area),maxStaffCount:String(maxStaffCount),maxDurationMinutes:String(maxDurationMinutes)});
      void catalogGet<PackageRecommendation>(`/services/${detail!.service.id}/recommendation?${query}`,controller.signal)
        .then(data=>{if(current)setState({key:inputKey,data,loading:false,error:''});})
        .catch(error=>{if(current&&!controller.signal.aborted)setState({key:inputKey,data:null,loading:false,error:error instanceof Error?error.message:'Chưa kiểm tra được gói phù hợp.'});});
    },350);
    return()=>{current=false;clearTimeout(timer);controller.abort();};
  },[inputKey,enabled,active,attempt]);
  const retry=useCallback(()=>setAttempt(value=>value+1),[]);
  return {measurementKey,data:enabled&&state.key===inputKey?state.data:null,loading:enabled&&active&&(state.key!==inputKey||state.loading),error:enabled&&state.key===inputKey?state.error:'',retry};
}
