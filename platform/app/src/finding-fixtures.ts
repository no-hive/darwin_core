/** UI fixtures only. No IDs or coordinates are resolved by an external service. */
export const TAXON_FIXTURES=[
 {scientificName:'Bathyraja',taxonID:'urn:dwc-demo:taxon:bathyraja',taxonRank:'genus',kingdom:'Animalia',phylum:'Chordata',class:'Chondrichthyes',order:'Rajiformes',family:'Arhynchobatidae',genus:'Bathyraja'},
 {scientificName:'Porites',taxonID:'urn:dwc-demo:taxon:porites',taxonRank:'genus',kingdom:'Animalia',phylum:'Cnidaria',class:'Anthozoa',order:'Scleractinia',family:'Poritidae',genus:'Porites'},
 {scientificName:'Chromodoris',taxonID:'urn:dwc-demo:taxon:chromodoris',taxonRank:'genus',kingdom:'Animalia',phylum:'Mollusca',class:'Gastropoda',order:'Nudibranchia',family:'Chromodorididae',genus:'Chromodoris'},
 {scientificName:'Zostera',taxonID:'urn:dwc-demo:taxon:zostera',taxonRank:'genus',kingdom:'Plantae',phylum:'Tracheophyta',class:'Liliopsida',order:'Alismatales',family:'Zosteraceae',genus:'Zostera'}
];
export const TAXON_KEYS=['taxonID','taxonRank','kingdom','phylum','class','order','family','genus','scientificNameAuthorship','specificEpithet','infraspecificEpithet'];
export const PLACE_FIXTURES=[
 {id:'monterey',locality:'Monterey Bay',decimalLatitude:'36.70',decimalLongitude:'-122.00',geodeticDatum:'EPSG:4326',country:'United States',countryCode:'US',stateProvince:'California',waterBody:'Pacific Ocean'},
 {id:'palau',locality:'Palau lagoon',decimalLatitude:'7.35',decimalLongitude:'134.45',geodeticDatum:'EPSG:4326',country:'Palau',countryCode:'PW',stateProvince:'',waterBody:'Pacific Ocean'},
 {id:'mediterranean',locality:'Western Mediterranean',decimalLatitude:'39.50',decimalLongitude:'2.50',geodeticDatum:'EPSG:4326',country:'',countryCode:'',stateProvince:'',waterBody:'Mediterranean Sea'}
];
export const PLACE_KEYS=['country','countryCode','stateProvince','waterBody'];
