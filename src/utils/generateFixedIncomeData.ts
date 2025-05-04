import { faker } from '@faker-js/faker';

// Fixed Income instrument types
const instrumentTypes = [
  'Government Bond', 'Corporate Bond', 'Municipal Bond', 'Treasury Bill', 
  'Treasury Note', 'Treasury Bond', 'Agency Bond', 'Mortgage-Backed Security', 
  'Asset-Backed Security', 'Commercial Mortgage-Backed Security', 
  'Collateralized Debt Obligation', 'Covered Bond', 'High-Yield Bond', 
  'Investment-Grade Bond', 'Inflation-Protected Security', 'Zero-Coupon Bond',
  'Convertible Bond', 'Callable Bond', 'Putable Bond', 'Floating Rate Note'
];

// Credit ratings
const creditRatings = [
  'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 
  'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 
  'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'
];

// Countries
const countries = [
  'US', 'UK', 'DE', 'FR', 'JP', 'CA', 'IT', 'CH', 'AU', 'ES', 
  'NL', 'SE', 'NO', 'DK', 'FI', 'SG', 'HK', 'KR', 'BR', 'MX', 
  'ZA', 'RU', 'IN', 'CN'
];

// Currencies
const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 
  'SEK', 'NOK', 'DKK', 'BRL', 'CNY', 'HKD', 'INR', 'MXN', 
  'SGD', 'ZAR', 'KRW', 'RUB'
];

// Risk buckets
const riskBuckets = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'];

// Sectors
const sectors = [
  'Government', 'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Consumer Staples', 'Industrials', 'Energy', 'Materials', 'Utilities',
  'Telecommunications', 'Real Estate', 'Transportation', 'Education', 'Defense'
];

// Index families
const indexFamilies = ['Bloomberg', 'FTSE', 'iBoxx', 'J.P. Morgan', 'Markit', 'ICE BofA', 'S&P'];

// Settlement types
const settlementTypes = ['T+1', 'T+2', 'T+3', 'T+0', 'Custom'];

// Generate a random date between start and end
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Random date within last 20 years
const getRandomDate = () => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 20);
  return randomDate(start, end);
};

// Random date in future (up to 30 years)
const getRandomFutureDate = () => {
  const start = new Date();
  const end = new Date();
  end.setFullYear(start.getFullYear() + 30);
  return randomDate(start, end);
};

// Calculate years between two dates
const yearsBetween = (d1: Date, d2: Date) => {
  return Math.abs(d2.getFullYear() - d1.getFullYear() + 
    (d2.getMonth() - d1.getMonth()) / 12 + 
    (d2.getDate() - d1.getDate()) / 365.25);
};

// Generate a single fixed income instrument position
const generatePosition = (id: number) => {
  // Basic instrument data
  const issueDate = getRandomDate();
  const maturityDate = getRandomFutureDate();
  const issuePrice = faker.number.float({ min: 90, max: 110, precision: 0.01 });
  const faceValue = faker.number.int({ min: 1000, max: 1000000 }) * 1000;
  const couponRate = faker.number.float({ min: 0.5, max: 8, precision: 0.001 });
  const ytm = faker.number.float({ min: 0.1, max: 10, precision: 0.001 });
  const instrumentType = faker.helpers.arrayElement(instrumentTypes);
  const currency = faker.helpers.arrayElement(currencies);
  const country = faker.helpers.arrayElement(countries);
  
  // Reference data
  const isin = `${faker.string.alpha({ casing: 'upper', length: 2 })}${faker.string.alphanumeric({ length: 10 })}`;
  const cusip = faker.string.alphanumeric({ length: 9 });
  const sedol = faker.string.alphanumeric({ length: 7, casing: 'upper' });
  const bloombergTicker = `${faker.string.alpha({ length: 3, casing: 'upper' })} ${faker.string.numeric({ length: 4 })} ${faker.helpers.arrayElement(['Corp', 'Govt', 'Muni'])}`;
  
  // Credit and risk data
  const creditRating = faker.helpers.arrayElement(creditRatings);
  const riskBucket = faker.helpers.arrayElement(riskBuckets);
  const duration = faker.number.float({ min: 0.1, max: 25, precision: 0.01 });
  const modifiedDuration = duration / (1 + ytm / 100);
  const convexity = faker.number.float({ min: 0.01, max: 200, precision: 0.01 });
  
  // Position specific data
  const quantity = faker.number.int({ min: 1, max: 1000 }) * 1000;
  const marketValue = faker.number.float({ min: 0.8, max: 1.2, precision: 0.0001 }) * faceValue * quantity / 1000;
  const unrealizedGainLoss = faker.number.float({ min: -0.1, max: 0.1, precision: 0.0001 }) * marketValue;
  const sector = faker.helpers.arrayElement(sectors);
  const portfolioWeight = faker.number.float({ min: 0.01, max: 5, precision: 0.01 });
  const benchmarkWeight = faker.number.float({ min: 0, max: 3, precision: 0.01 });
  const activeWeight = portfolioWeight - benchmarkWeight;
  
  // Yield and spread data
  const yieldToWorst = faker.number.float({ min: ytm * 0.9, max: ytm, precision: 0.001 });
  const spreadDuration = faker.number.float({ min: duration * 0.7, max: duration * 0.9, precision: 0.01 });
  const optionAdjustedSpread = faker.number.float({ min: 10, max: 500, precision: 0.1 });
  const zSpread = faker.number.float({ min: optionAdjustedSpread * 0.9, max: optionAdjustedSpread * 1.1, precision: 0.1 });
  const assetSwapSpread = faker.number.float({ min: optionAdjustedSpread * 0.8, max: optionAdjustedSpread * 1.2, precision: 0.1 });
  
  // Liquidity and market data
  const bidPrice = faker.number.float({ min: 95, max: 105, precision: 0.01 });
  const askPrice = faker.number.float({ min: bidPrice, max: bidPrice * 1.02, precision: 0.01 });
  const bidAskSpread = askPrice - bidPrice;
  const volume30Day = faker.number.int({ min: 10000, max: 100000000 });
  const averageDailyVolume = volume30Day / 30;
  const lastTradeDate = randomDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30), new Date());
  
  // Benchmark and index data
  const benchmarkName = `${faker.helpers.arrayElement(indexFamilies)} ${faker.helpers.arrayElement(['Aggregate', 'Corporate', 'Treasury', 'High Yield', 'Municipal'])} ${faker.helpers.arrayElement(['1-3 Yr', '3-5 Yr', '5-7 Yr', '7-10 Yr', '10+ Yr', 'All'])}`;
  const indexWeight = faker.number.float({ min: 0, max: 0.5, precision: 0.0001 });
  const trackingError = faker.number.float({ min: 0.01, max: 2, precision: 0.01 });
  const informationRatio = faker.number.float({ min: -2, max: 2, precision: 0.01 });
  
  // Issuer information
  const issuerName = faker.company.name();
  const issuerType = faker.helpers.arrayElement(['Corporate', 'Government', 'Agency', 'Municipal', 'Supranational']);
  const issuerCountry = country;
  const issuerIndustry = sector;
  const issuerOutstanding = faker.number.int({ min: 1000000, max: 100000000 }) * 1000;
  const issuerDefaultProbability = faker.number.float({ min: 0.01, max: 10, precision: 0.01 });
  
  // Call/put features
  const hasCallFeature = faker.datatype.boolean(0.3);
  const hasPutFeature = faker.datatype.boolean(0.15);
  const nextCallDate = hasCallFeature ? randomDate(new Date(), maturityDate) : null;
  const nextPutDate = hasPutFeature ? randomDate(new Date(), maturityDate) : null;
  const callPrice = hasCallFeature ? faker.number.float({ min: 100, max: 105, precision: 0.01 }) : null;
  const putPrice = hasPutFeature ? faker.number.float({ min: 95, max: 100, precision: 0.01 }) : null;
  
  // Cash flow data
  const nextCouponDate = randomDate(new Date(), new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()));
  const previousCouponDate = randomDate(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()), new Date());
  const couponFrequency = faker.helpers.arrayElement([1, 2, 4, 12]); // Annual, Semi-annual, Quarterly, Monthly
  const dayCountConvention = faker.helpers.arrayElement(['30/360', 'Actual/360', 'Actual/365', 'Actual/Actual']);
  const accrued = (couponRate / 100) * (faceValue / 1000) * (faker.number.float({ min: 0, max: 1, precision: 0.01 }));
  
  // Performance data
  const totalReturn1D = faker.number.float({ min: -1, max: 1, precision: 0.001 });
  const totalReturn1W = faker.number.float({ min: -2, max: 2, precision: 0.001 });
  const totalReturn1M = faker.number.float({ min: -3, max: 3, precision: 0.001 });
  const totalReturn3M = faker.number.float({ min: -5, max: 5, precision: 0.001 });
  const totalReturn6M = faker.number.float({ min: -8, max: 8, precision: 0.001 });
  const totalReturn1Y = faker.number.float({ min: -15, max: 15, precision: 0.001 });
  const totalReturnYTD = faker.number.float({ min: -10, max: 10, precision: 0.001 });
  
  // Risk metrics
  const volatility30D = faker.number.float({ min: 0.1, max: 15, precision: 0.01 });
  const volatility90D = faker.number.float({ min: 0.1, max: 12, precision: 0.01 });
  const sharpeRatio = faker.number.float({ min: -1, max: 3, precision: 0.01 });
  const beta = faker.number.float({ min: 0.5, max: 1.5, precision: 0.01 });
  const valueatrisk95 = faker.number.float({ min: 0.5, max: 10, precision: 0.01 });
  const expectedShortfall = faker.number.float({ min: valueatrisk95, max: valueatrisk95 * 1.5, precision: 0.01 });
  
  // Settlement type
  const settlementType = faker.helpers.arrayElement(settlementTypes);
  
  return {
    id,
    
    // Basic instrument data
    instrumentType,
    instrumentName: `${issuerName} ${couponRate.toFixed(2)}% ${maturityDate.getFullYear()}`,
    issueDate: issueDate.toISOString().split('T')[0],
    maturityDate: maturityDate.toISOString().split('T')[0],
    timeToMaturity: yearsBetween(new Date(), maturityDate).toFixed(2),
    issuePrice,
    faceValue,
    couponRate,
    couponType: faker.helpers.arrayElement(['Fixed', 'Floating', 'Zero', 'Step-Up', 'PIK']),
    ytm,
    currency,
    country,
    
    // Reference data
    isin,
    cusip,
    sedol,
    bloombergTicker,
    
    // Credit and risk data
    creditRating,
    riskBucket,
    duration,
    modifiedDuration,
    convexity,
    
    // Position specific data
    quantity,
    marketValue,
    marketPrice: marketValue / quantity * 1000,
    unrealizedGainLoss,
    costBasis: marketValue - unrealizedGainLoss,
    sector,
    portfolioWeight,
    benchmarkWeight,
    activeWeight,
    
    // Yield and spread data
    yieldToWorst,
    spreadDuration,
    optionAdjustedSpread,
    zSpread,
    assetSwapSpread,
    
    // Liquidity and market data
    bidPrice,
    askPrice,
    bidAskSpread,
    volume30Day,
    averageDailyVolume,
    lastTradeDate: lastTradeDate.toISOString().split('T')[0],
    
    // Benchmark and index data
    benchmarkName,
    indexWeight,
    trackingError,
    informationRatio,
    
    // Issuer information
    issuerName,
    issuerType,
    issuerCountry,
    issuerIndustry,
    issuerOutstanding,
    issuerDefaultProbability,
    
    // Call/put features
    hasCallFeature,
    hasPutFeature,
    nextCallDate: nextCallDate ? nextCallDate.toISOString().split('T')[0] : null,
    nextPutDate: nextPutDate ? nextPutDate.toISOString().split('T')[0] : null,
    callPrice,
    putPrice,
    
    // Cash flow data
    nextCouponDate: nextCouponDate.toISOString().split('T')[0],
    previousCouponDate: previousCouponDate.toISOString().split('T')[0],
    couponFrequency,
    dayCountConvention,
    accrued,
    
    // Performance data
    totalReturn1D,
    totalReturn1W,
    totalReturn1M,
    totalReturn3M,
    totalReturn6M,
    totalReturn1Y,
    totalReturnYTD,
    
    // Risk metrics
    volatility30D,
    volatility90D,
    sharpeRatio,
    beta,
    valueatrisk95,
    expectedShortfall,
    
    // ESG data
    esgScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
    environmentalScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
    socialScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
    governanceScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
    controversyLevel: faker.number.int({ min: 0, max: 5 }),
    
    // Trade & settlement data
    tradeDate: lastTradeDate.toISOString().split('T')[0],
    settlementDate: new Date(lastTradeDate.getTime() + faker.number.int({ min: 1, max: 3 }) * 86400000).toISOString().split('T')[0],
    settlementType,
    tradePrice: faker.number.float({ min: 95, max: 105, precision: 0.01 }),
    
    // Tax & accounting
    taxLotId: `TL${faker.string.numeric(8)}`,
    taxLotDate: randomDate(new Date(new Date().getFullYear() - 5, 0, 1), new Date()).toISOString().split('T')[0],
    taxStatus: faker.helpers.arrayElement(['Taxable', 'Tax-Exempt', 'Tax-Deferred']),
    costBasisMethod: faker.helpers.arrayElement(['FIFO', 'LIFO', 'Average Cost', 'Specific Identification']),
    accountingMethod: faker.helpers.arrayElement(['Mark-to-Market', 'Amortized Cost']),
    
    // Additional metrics
    krd1: faker.number.float({ min: 0, max: 1, precision: 0.001 }),
    krd2: faker.number.float({ min: 0, max: 2, precision: 0.001 }),
    krd3: faker.number.float({ min: 0, max: 2.5, precision: 0.001 }),
    krd4: faker.number.float({ min: 0, max: 2, precision: 0.001 }),
    krd5: faker.number.float({ min: 0, max: 1.5, precision: 0.001 }),
    optionAdjustedDuration: faker.number.float({ min: duration * 0.8, max: duration * 1.1, precision: 0.01 }),
    modifiedConvexity: faker.number.float({ min: convexity * 0.9, max: convexity * 1.1, precision: 0.01 }),
    effectiveConvexity: faker.number.float({ min: convexity * 0.9, max: convexity * 1.1, precision: 0.01 }),
    macaulayDuration: duration * (1 + ytm / 100),
    
    // Operational metadata
    dataSource: faker.helpers.arrayElement(['Bloomberg', 'Refinitiv', 'FactSet', 'ICE', 'Internal']),
    pricingSource: faker.helpers.arrayElement(['Bloomberg BVAL', 'ICE Data Services', 'Markit', 'Refinitiv', 'Dealer Quote']),
    lastUpdateTime: new Date().toISOString(),
    confirmationStatus: faker.helpers.arrayElement(['Confirmed', 'Pending', 'Disputed']),
    custodian: faker.helpers.arrayElement(['State Street', 'BNY Mellon', 'JPMorgan', 'Northern Trust', 'Citi']),
    
    // Generated field for additional entropy
    customField1: faker.number.float({ min: -100, max: 100, precision: 0.01 }),
    customField2: faker.number.float({ min: -100, max: 100, precision: 0.01 }),
    customField3: faker.number.float({ min: -100, max: 100, precision: 0.01 }),
    customField4: faker.string.alphanumeric(10),
    customField5: faker.string.alphanumeric(10),
    
    // Portfolio management data
    pmAttribution: faker.number.float({ min: -3, max: 3, precision: 0.01 }),
    alpha: faker.number.float({ min: -2, max: 2, precision: 0.01 }),
    tacticalOverlay: faker.helpers.arrayElement([null, 'Overweight', 'Underweight', 'Neutral']),
    strategyView: faker.helpers.arrayElement(['Positive', 'Negative', 'Neutral', 'Strong Positive', 'Strong Negative']),
  };
};

// Main function to generate data
export const generateFixedIncomeData = (numRows = 10000) => {
  const positions = [];
  
  for (let i = 1; i <= numRows; i++) {
    positions.push(generatePosition(i));
  }
  
  return positions;
};

// Export JSON to file (in browser environment)
export const downloadFixedIncomeData = (numRows = 10000) => {
  const data = generateFixedIncomeData(numRows);
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fixed_income_positions.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return data;
};
