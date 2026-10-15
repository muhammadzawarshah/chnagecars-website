"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

type CarRow = {id: string; title: string}
export default function FilterCars({query, make, model, variant}: {query: string; make: string; model: string; variant?: string}) {
    const [page,setPage] = useState(1);
    const [loaded,setLoaded] = useState<{key:string; data:CarRow[];meta:{total:number}} | null>(null);
    const [failed,setFailed] = useState<string | null>(null);
    const key = JSON.stringify([query,make,model,variant,page]);
    const result = loaded?.key === key ? loaded : null;
    const error = failed === key;
    useEffect(()=> {
        const controller = new AbortController();
        const params = new URLSearchParams(query);
        params.set('make',make); params.set('model',make+':'+model);
        if(variant) params.set('variant',variant); else params.delete('variant');
        params.set('page',String(page)); params.set('pageSize','10');
        fetch('/api/vehicles/filter-cars?'+params,{signal:controller.signal}).then(async response=> {
            if(!response.ok) throw new Error('Unavailable');
            const data=await response.json();
            if(!controller.signal.aborted) setLoaded({...data,key});
        }).catch(()=>{if(!controller.signal.aborted) setFailed(key)});
        return ()=>controller.abort();
    },[query,make,model,variant,page,key]);
    return <div className="py-2 pl-16 pr-3 text-sm text-black" onClick={event=>event.stopPropagation()}>
        {error ? <p>Could not load cars.</p> : !result ? <p>Loading cars…</p> : <>
            <p className="text-[#757575]">Matching cars ({result.meta.total})</p>
            {result.data.map(car=><Link key={car.id} href={'/cars/'+car.id.replaceAll('-','')} className="block border-b border-[#eeeeee] py-2 hover:text-[#957e4e]">{car.title}</Link>)}
            {!result.data.length && <p>No matching cars.</p>}
            <div className="flex gap-4 py-2">
                {page>1 && <button type="button" onClick={()=>setPage(page-1)}>Previous</button>}
                {page*10<result.meta.total && <button type="button" onClick={()=>setPage(page+1)}>More cars</button>}
            </div>
        </>}
    </div>
}
