// A row shares one receiving address only across its explicitly listed networks.
// Public receiving addresses only. Null keeps payment actions unavailable.
const ethereum={id:'ethereum',name:'Ethereum',icon:'eth.png'};
const base={id:'base',name:'Base',icon:'base-round'};
const arbitrum={id:'arbitrum',name:'Arbitrum One',icon:'arbitrum.png'};
export const donations = [
  {id:'eth',symbol:'ETH',name:'Ethereum',currencyIcon:'eth.png',address:null,networks:[base,ethereum,arbitrum]},
  {id:'usdt',symbol:'USDT',name:'Tether',currencyIcon:'usdt.png',address:null,networks:[ethereum,{...arbitrum,asset:'USDT0'}]},
  {id:'usdc',symbol:'USDC',name:'USD Coin',currencyIcon:'usdc.png',address:null,networks:[base,ethereum,arbitrum]},
  {id:'btc',symbol:'BTC',name:'Bitcoin',currencyIcon:'btc.png',address:null,networks:[{id:'bitcoin',name:'Bitcoin',icon:'btc.png'}]},
  {id:'sol',symbol:'SOL',name:'Solana',currencyIcon:'sol.png',address:null,networks:[{id:'solana',name:'Solana',icon:'sol.png'}]},
  {id:'ltc',symbol:'LTC',name:'Litecoin',currencyIcon:'ltc.png',address:null,networks:[{id:'litecoin',name:'Litecoin',icon:'ltc.png'}]}
];
