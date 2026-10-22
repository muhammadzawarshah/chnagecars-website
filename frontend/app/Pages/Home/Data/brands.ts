import { appSearchHref, CarSearch, carSearchHref, slugify } from "@/app/lib/cars/search"

export type BrandModel = {
    name: string
    href: string
}

export type Brand = {
    name: string
    logo: string
    href: string
    models: BrandModel[]
}

export type Province = {
    name: string
    image: string
    href: string
}

function brand(name: string, logo: string, models: string[][], filter: CarSearch = {}): Brand {
    const make = slugify(name);
    return {
        name,
        logo,
        // Like the app, a brand card opens the Search screen for that brand.
        href: appSearchHref({ ...filter, make }),
        models: models.map(([model, label]) => ({ name: label, href: carSearchHref({ ...filter, make, model }) })),
    };
}

export const carBrands: Brand[] = [
    brand("Alfa Romeo", "/img/brand-logos/alpha-romeo-logo.png", [["giulia", "Alfa Romeo Giulia"], ["giulietta", "Alfa Romeo Giulietta"], ["stelvio", "Alfa Romeo Stelvio"], ["tonale", "Alfa Romeo Tonale"]]),
    brand("Audi", "/img/brand-logos/audi-logo.webp", [["a1", "Audi A1"], ["a3-sportback", "Audi A3 Sportback"], ["a4", "Audi A4"], ["a5", "Audi A5"], ["q2", "Audi Q2"], ["q3", "Audi Q3"], ["q5", "Audi Q5"], ["rs3", "Audi RS3"]]),
    brand("BMW", "/img/brand-logos/bmw-logo1.png", [["1-series", "BMW 1 Series"], ["2-series", "BMW 2 Series"], ["3-series", "BMW 3 Series"], ["4-series", "BMW 4 Series"], ["5-series", "BMW 5 Series"], ["6-series", "BMW 6 Series"], ["m3", "BMW M3"], ["m5", "BMW M5"]]),
    brand("Chery", "/img/brand-logos/chery-logo.webp", [["j2", "Chery J2"], ["tiggo", "Chery Tiggo"], ["tiggo-4-pro", "Chery Tiggo 4 Pro"], ["tiggo-7", "Chery Tiggo 7"], ["tiggo-8-pro", "Chery Tiggo 8 Pro"], ["omoda", "Chery Omoda"]]),
    brand("Ford", "/img/brand-logos/ford-logo.webp", [["ecosport", "Ford Ecosport"], ["everest", "Ford Everest"], ["fiesta", "Ford Fiesta"], ["focus", "Ford Focus"], ["kuga", "Ford Kuga"], ["mustang", "Ford Mustang"], ["puma", "Ford Puma"], ["ranger", "Ford Ranger"]]),
    brand("GWM", "/img/brand-logos/gwm-logo.webp", [["h5", "GWM H5"], ["ldv", "GWM LDV"], ["ora", "GWM Ora"], ["p-series", "GWM P-Series"], ["steed-5", "GWM Steed 5"], ["steed-5e", "GWM Steed 5E"], ["tank-300", "GWM Tank 300"]]),
    brand("Haval", "/img/brand-logos/haval-logo.webp", [["h1", "Haval H1"], ["h2", "Haval H2"], ["h6", "Haval H6"], ["h9", "Haval H9"], ["jolion", "Haval Jolion"]]),
    brand("Honda", "/img/brand-logos/honda-logo.png", [["ballade", "Honda Ballade"], ["br-v", "Honda BR-V"], ["brio", "Honda Brio"], ["cr-v", "Honda CR-V"]]),
    brand("Hyundai", "/img/brand-logos/hyundai-logo.webp", [["creta", "Hyundai Creta"], ["h1", "Hyundai H1"], ["i10", "Hyundai i10"], ["i20", "Hyundai i20"], ["santa-fe", "Hyundai Santa Fe"], ["staria", "Hyundai Staria"], ["tucson", "Hyundai Tucson"], ["venue", "Hyundai Venue"]]),
    brand("Isuzu", "/img/brand-logos/isuzu-logo1.png", [["d-max", "Isuzu D-Max"], ["kb", "Isuzu KB"], ["mu-x", "Isuzu MU-X"]]),
    brand("Jaguar", "/img/brand-logos/jaguar-logo.jpg", [["e-pace", "Jaguar E-Pace"], ["f-pace", "Jaguar F-Pace"], ["f-type", "Jaguar F-Type"], ["i-pace", "Jaguar I-Pace"], ["xe", "Jaguar XE"], ["xf", "Jaguar XF"], ["xkr", "Jaguar XKR"]]),
    brand("Kia", "/img/brand-logos/kia-logo1.webp", [["carnival", "Kia Carnival"], ["k-2700", "Kia K2700"], ["pegas", "Kia Pegas"], ["picanto", "Kia Picanto"], ["seltos", "Kia Seltos"], ["sonet", "Kia Sonet"], ["sorento", "Kia Sorento"], ["sportage", "Kia Sportage"]]),
    brand("Mahindra", "/img/brand-logos/mahindra-logo.webp", [["kuv-100", "Mahindra KUV 100"], ["scorpio", "Mahindra Scorpio"]]),
    brand("Mazda", "/img/brand-logos/mazda-logo.png", [["2", "Mazda 2"], ["3", "Mazda 3"], ["bt-50", "Mazda BT-50"], ["cx-3", "Mazda CX-3"], ["cx-30", "Mazda CX-30"], ["cx-5", "Mazda CX-5"], ["cx-60", "Mazda CX-60"]]),
    brand("Mercedes-Benz", "/img/brand-logos/mercedes-logo.webp", [["a-class", "Mercedes A-Class"], ["b-class", "Mercedes B-Class"], ["c-class", "Mercedes C-Class"], ["clk-class-coupe", "Mercedes CLK Class Coupe"], ["cls-class", "Mercedes CLS Class"], ["e-class", "Mercedes E-Class"], ["g-class", "Mercedes G-Class"], ["glc", "Mercedes GLC"]]),
    brand("Mitsubishi", "/img/brand-logos/mitsubishi-logo.webp", [["asx", "Mitsubishi ASX"], ["eclipse-cross", "Mitsubishi Eclipse Cross"], ["pajero", "Mitsubishi Pajero"]]),
    brand("Nissan", "/img/brand-logos/nissan-logo.webp", [["almera", "Nissan Almera"], ["magnite", "Nissan Magnite"], ["navara", "Nissan Navara"], ["np200", "Nissan NP200"], ["np300-hardbody", "Nissan NP300 Hardbody"], ["nv350", "Nissan NV350"], ["qashqai", "Nissan Qashqai"], ["x-trail", "Nissan X-Trail"]]),
    brand("Opel", "/img/brand-logos/opel-logo.png", [["adam", "Opel Adam"], ["astra", "Opel Astra"], ["combo", "Opel Combo"], ["corsa", "Opel Corsa"], ["crossland", "Opel Crossland"], ["grandland", "Opel Grandland"], ["mokka", "Opel Mokka"]]),
    brand("Peugeot", "/img/brand-logos/peugeot-logo.png", [["2008", "Peugeot 2008"], ["208", "Peugeot 208"], ["3008", "Peugeot 3008"], ["308", "Peugeot 308"], ["5008", "Peugeot 5008"], ["landtrek", "Peugeot Landtrek"]]),
    brand("Renault", "/img/brand-logos/renault-logo.webp", [["captur", "Renault Captur"], ["clio", "Renault Clio"], ["duster", "Renault Duster"], ["kadjar", "Renault Kadjar"], ["kiger", "Renault Kiger"], ["kwid", "Renault Kwid"], ["sandero", "Renault Sandero"], ["triber", "Renault Triber"]]),
    brand("Suzuki", "/img/brand-logos/suzuki-logo.webp", [["baleno", "Suzuki Baleno"], ["celerio", "Suzuki Celerio"], ["ertiga", "Suzuki Ertiga"], ["fronx", "Suzuki Fronx"], ["grand-vitara", "Suzuki Grand Vitara"], ["jimny", "Suzuki Jimny"], ["s-presso", "Suzuki S-Presso"], ["super-carry", "Suzuki Super Carry"], ["swift", "Suzuki Swift"]]),
    brand("Toyota", "/img/brand-logos/toyota-logo.webp", [["corolla-cross", "Toyota Corolla Cross"], ["corolla-quest", "Toyota Corolla Quest"], ["fortuner", "Toyota Fortuner"], ["hilux", "Toyota Hilux"], ["starlet", "Toyota Starlet"], ["quantum", "Toyota Quantum"], ["urban-cruiser", "Toyota Urban Cruiser"], ["vitz", "Toyota Vitz"]]),
    brand("Volkswagen", "/img/brand-logos/vw-logo.webp", [["amarok", "Volkswagen Amarok"], ["golf-vii", "Volkswagen Golf VII"], ["polo", "Volkswagen Polo"], ["polo-classic", "Volkswagen Polo Classic"], ["polo-vivo", "Volkswagen Polo Vivo"], ["t-cross", "Volkswagen T-Cross"], ["tiguan", "Volkswagen Tiguan"], ["t-roc", "Volkswagen T-Roc"]]),
    brand("Volvo", "/img/brand-logos/volvo-logo.webp", [["xc40", "Volvo XC40"], ["xc60", "Volvo XC60"], ["xc90", "Volvo XC90"]]),
];

export const motorbikeBrands: Brand[] = [
    brand("BMW", "/img/brand-logos/bmw-logo1.png", [["r-series", "BMW R Series"], ["s1000rr", "BMW S1000RR"], ["s-series", "BMW S Series"], ["f-series", "BMW F Series"], ["gs", "BMW GS"], ["rr", "BMW RR"]], { bodyType: "Motorbike" }),
    brand("Ducati", "/img/brand-logos/ducati-logo.PNG", [["1098-s", "Ducati 1098 S"], ["1299", "Ducati 1299"], ["panigale", "Ducati Panigale"], ["v4s", "Ducati V4S"]], { bodyType: "Motorbike" }),
    brand("Harley Davidson", "/img/brand-logos/harley-logo.png", [["cvo", "Harley Davidson CVO"], ["dyna", "Harley Davidson Dyna"], ["road-king", "Harley Davidson Road King"], ["sportster", "Harley Davidson Sportster"], ["softail", "Harley Davidson Softail"], ["street-glide", "Harley Davidson Street Glide"]], { bodyType: "Motorbike" }),
    brand("Honda", "/img/brand-logos/honda-logo.png", [["1000-fireblade", "Honda 1000 Fireblade"], ["750-dct", "Honda 750 DCT"], ["800-crossrunner", "Honda 800 Crossrunner"]], { bodyType: "Motorbike" }),
    brand("Indian", "/img/brand-logos/indian-logo.jpg", [["scout", "Indian Scout"]], { bodyType: "Motorbike" }),
    brand("Kawasaki", "/img/brand-logos/Kawasaki-Logo.png", [["1400-abs", "Kawasaki 1400 ABS"], ["650", "Kawasaki 650"], ["900", "Kawasaki 900"], ["classic", "Kawasaki Classic"], ["h2", "Kawasaki H2"], ["zx-10r", "Kawasaki ZX 10R"]], { bodyType: "Motorbike" }),
    brand("KTM", "/img/brand-logos/ktm-logo.png", [["1290-super-adventure", "KTM 1290 Super Adventure"], ["390", "KTM 390"], ["adventure-r", "KTM Adventure R"], ["duke", "KTM Duke"], ["1290-super-adventure-r", "KTM 1290 Super Adventure R"], ["super-adventure-s", "KTM Super Adventure S"]], { bodyType: "Motorbike" }),
    brand("Moto Guzzi", "/img/brand-logos/moto-guzzi-logo.jpg", [["audace", "Moto Guzzi Audace"], ["touring", "Moto Guzzi Touring"], ["tt", "Moto Guzzi TT"]], { bodyType: "Motorbike" }),
    brand("Suzuki", "/img/brand-logos/suzuki-logo.webp", [["boulevard", "Suzuki Boulevard"], ["burgman", "Suzuki Burgman"], ["hayabusa", "Suzuki Hayabusa"], ["gsx", "Suzuki GSX"], ["gsx-r1000", "Suzuki GSX-R1000"], ["gsx-s1000", "Suzuki GSX-S1000"]], { bodyType: "Motorbike" }),
    brand("Triumph", "/img/brand-logos/Triumph-Logo.png", [["bonneville", "Triumph Bonneville"], ["rocket", "Triumph Rocket"], ["street-triple", "Triumph Street Triple"], ["speed-twin", "Triumph Speed Twin"], ["tiger", "Triumph Tiger"], ["tiger-1200", "Triumph Tiger 1200"]], { bodyType: "Motorbike" }),
    brand("Vespa", "/img/brand-logos/vespa-logo.jpg", [["300-super", "Vespa 300 Super"], ["300-supertech", "Vespa 300 Supertech"], ["946", "Vespa 946"], ["electrica", "Vespa Electrica"], ["granturismo", "Vespa Granturismo"], ["gts-300", "Vespa GTS 300"], ["limited-edition", "Vespa Limited Edition"]], { bodyType: "Motorbike" }),
    brand("Yamaha", "/img/brand-logos/yamaha-logo.jpg", [["07-tracer", "Yamaha 07 Tracer"], ["500", "Yamaha 500"], ["grizzly-660", "Yamaha Grizzly 660"], ["mt", "Yamaha MT"], ["r1", "Yamaha R1"], ["yzf-r1", "Yamaha YZF-R1"]], { bodyType: "Motorbike" }),
];

export const exoticBrands: Brand[] = [
    brand("Aston Martin", "/img/brand-logos/astin-martin-logo.png", [["db11", "Aston Martin DB11"], ["dbs", "Aston Martin DBS"], ["dbx", "Aston Martin DBX"], ["rapide", "Aston Martin Rapide"], ["vanquish", "Aston Martin Vanquish"], ["vantage", "Aston Martin Vantage"]]),
    brand("Bentley", "/img/brand-logos/bentley-logo.jpg", [["arnage", "Bentley Arnage"], ["bentayga", "Bentley Bentayga"], ["continental", "Bentley Continental"], ["flying-spur", "Bentley Flying Spur"], ["turbo-r", "Bentley Turbo R"]]),
    brand("Ferrari", "/img/ferrari/ferrari.png", [["458-speciale", "Ferrari 458 Speciale"], ["488-gtb", "Ferrari 488 GTB"], ["599-gtb", "Ferrari 599 GTB"], ["812-superfast", "Ferrari 812 Superfast"], ["california-t", "Ferrari California T"], ["f8", "Ferrari F8"], ["roma", "Ferrari Roma"], ["scuderia", "Ferrari Scuderia"], ["sf90", "Ferrari SF90"]]),
    brand("Lamborghini", "/img/brand-logos/lamborghini-logo1.jpg", [["aventador", "Lamborghini Aventador"], ["gallardo", "Lamborghini Gallardo"], ["huracan", "Lamborghini Huracan"], ["urus", "Lamborghini Urus"]]),
    brand("Maserati", "/img/brand-logos/maserati-logo.png", [["3200-gt", "Maserati 3200 GT"], ["ghibli", "Maserati Ghibli"], ["granturismo", "Maserati Granturismo"], ["grecale", "Maserati Grecale"], ["quattroporte", "Maserati Quattroporte"]]),
    brand("Mclaren", "/img/brand-logos/mclaren-logo.png", [["570", "Mclaren 570"], ["600lt", "Mclaren 600LT"], ["650s", "Mclaren 650S"], ["675lt", "Mclaren 675LT"], ["720s", "Mclaren 720S"]]),
    brand("Porsche", "/img/porsche-logo.png", [["boxster", "Porsche Boxster"], ["cayenne", "Porsche Cayenne"], ["cayman", "Porsche Cayman"], ["macan", "Porsche Macan"], ["panamera", "Porsche Panamera"], ["taycan", "Porsche Taycan"], ["911", "Porsche 911"]]),
    brand("Rolls Royce", "/img/brand-logos/rolls-royce-logo.png", [["cullinan", "Rolls Royce Cullinan"], ["ghost", "Rolls Royce Ghost"], ["wraith", "Rolls Royce Wraith"]]),
];

export const provinces: Province[] = [
    { name: "Eastern Cape", image: "/img/province-images/eastern-cape.jpg", href: carSearchHref({ province: "eastern-cape" }) },
    { name: "Free State", image: "/img/province-images/free-state.jpg", href: carSearchHref({ province: "free-state" }) },
    { name: "Gauteng", image: "/img/province-images/gauteng.jpg", href: carSearchHref({ province: "gauteng" }) },
    { name: "Kwazulu-Natal", image: "/img/province-images/kwazulu-natal.jpg", href: carSearchHref({ province: "kwazulu-natal" }) },
    { name: "Limpopo", image: "/img/province-images/limpopo.jpg", href: carSearchHref({ province: "limpopo" }) },
    { name: "Mpumalanga", image: "/img/province-images/mpumalanga.jpg", href: carSearchHref({ province: "mpumalanga" }) },
    { name: "Northern Cape", image: "/img/province-images/northern-cape.png", href: carSearchHref({ province: "northern-cape" }) },
    { name: "North-West", image: "/img/province-images/north-west.jpg", href: carSearchHref({ province: "north-west" }) },
    { name: "Western Cape", image: "/img/province-images/western-cape.jpg", href: carSearchHref({ province: "western-cape" }) },
];
