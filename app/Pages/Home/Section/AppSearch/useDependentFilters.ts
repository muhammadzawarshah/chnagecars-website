"use client"
import { useEffect, useState } from 'react'
import { Make } from '../../Data/makes'
import { buildSearchUrl, SearchValues } from '../../Data/searchUrl'
import { CarSearch } from '@/app/lib/cars/search'

type Option = { value?: string | number; name?: string; slug?: string; count: number; make?: string; model?: string }
type Facets = { total: number; ranges: Record<string, {min: number | null; max: number | null}> } & Record<string, unknown>
const bodies: Record<string, string[]> = { SUV:['suvs','crossovers'], Sedan:['sedans'], Hatchback:['hatchbacks'], 'Coupé':['coupes'], Convertible:['convertibles'], 'Double Cab Bakkie':['double-cabs'], 'Single Cab Bakkie':['bakkies'], 'Extended Cab':['king-cabs','super-cabs'], MPV:['mpvs'], Minibus:['minibuses'], 'Panel Van':['panel-vans'], 'Station Wagon':['station-wagons'], Motorbike:['motorbikes'], Caravan:['caravans'], Boat:['boats'] }
const labels: Record<string,string> = { AUTOMATIC:'Automatic', MANUAL:'Manual', UNKNOWN:'Unknown', PETROL:'Petrol', DIESEL:'Diesel', OTHER:'Other', HYBRID:'Hybrid', ELECTRIC:'Electric', PLUGIN_HYBRID:'Plug-in Hybrid', LPG:'LPG', FOUR_X_TWO:'4X2', FOUR_X_FOUR:'4X4', AWD:'AWD', FWD:'FWD', RWD:'RWD', NEW:'New', USED:'Used', DEMO:'Demo' }
const enumValue = (value: string) => Object.entries(labels).find(([,label])=>label.toLowerCase()===value.toLowerCase())?.[0] ?? value.toUpperCase().replace(/[ -]/g,'_')
export function dependentQuery(values: SearchValues, extras: Record<string,string[]>, preset: CarSearch = {}) {
    const source = new URL(buildSearchUrl(values,extras,preset),'http://local').searchParams;
    const query = new URLSearchParams();
    const aliases: Record<string,string> = { fuel:'fuelType',drive:'drivetrain',minEngine:'minEngineCc',maxEngine:'maxEngineCc',minKw:'minPowerKw',maxKw:'maxPowerKw',dealership:'dealer',vehicleGroup:'condition' };
    source.forEach((value,key)=> {
        if(key==='bodyType') { query.set('category',value.split(',').flatMap(v=>bodies[v]??[]).join(',')); return; }
        if(key==='variant') value=value.split(',').map(v=>v.split(':').at(-1)!).join(',');
        if(key==='specials') { if(value==='On special') query.set('onSpecial','true'); return; }
        if(['fuel','drive','transmission','province','vehicleGroup'].includes(key)) value=value.split(',').map(enumValue).join(',');
        if(!['page','sort','cylinders'].includes(key)) query.set(aliases[key]??key,value);
    });
    return query.toString();
}
export default function useDependentFilters(values: SearchValues, extras: Record<string,string[]>, preset: CarSearch = {}) {
    const query = dependentQuery(values,extras,preset);
    const [state,setState] = useState<{query:string; data:Facets} | null>(null);
    const [error,setError] = useState(false);
    useEffect(()=> {
        const controller = new AbortController();
        const timer = setTimeout(async()=> {
            try {
                const response = await fetch('/api/vehicles/facets?'+query,{signal:controller.signal});
                if(!response.ok) throw new Error('Unavailable');
                const data = await response.json();
                if(!controller.signal.aborted) { setState({query,data}); setError(false); }
            } catch { if(!controller.signal.aborted) setError(true); }
        },200);
        return ()=>{ clearTimeout(timer); controller.abort(); };
    },[query]);
    const data = state?.query===query ? state.data : null;
    const options = (key:string):Option[] => (data?.[key] as Option[] | undefined) ?? [];
    const makeOptions:Make[] = options('makes').map(make=>({name:make.name!,slug:make.slug!,count:make.count,models:options('models').filter(model=>model.make===make.slug).map(model=>({name:model.name!,slug:model.slug!,count:model.count,variants:options('variants').filter(v=>v.make===make.slug&&v.model===model.slug).map(v=>v.slug!)}))}));
    const bodyOptions = Object.entries(bodies).map(([name,slugs])=>({name,count:options('categories').filter(o=>slugs.includes(o.slug!)).reduce((sum,o)=>sum+o.count,0)})).filter(o=>o.count>0);
    const groups:Record<string,string>={fuelType:'fuelType',transmission:'transmission',drive:'drivetrain',colour:'colour',province:'province',vehicleGroup:'condition',seats:'seats',minEngine:'engineCapacityCc',maxEngine:'engineCapacityCc',minKw:'powerKw',maxKw:'powerKw',dealership:'dealerships'};
    const choices = (key:string) => options(groups[key]).map(o=> {
        const raw=String(o.value??o.slug??'');
        const value=key==='dealership'?o.slug!:key.includes('Engine')?raw+' cc':key.includes('Kw')?raw+' kW':labels[raw]??o.name??raw;
        return {value,count:o.count};
    });
    const rangeOptions = <T extends {value:number}>(key:string,items:T[]):T[] => {
        const field=key.includes('Price')?'price':key.includes('Year')?'year':'mileage';
        const range=data?.ranges?.[field];
        if(!range || range.min===null || range.max===null) return [];
        return items.filter(o=>key.startsWith('min')?o.value<=range.max!:o.value>=range.min!);
    };
    return {query,makeOptions,bodyOptions,choices,rangeOptions,total:data?.total,loading:!data&&!error,error};
}
