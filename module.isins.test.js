const populateISINs  = require('./module.isins');
const isinData = require('./module.isinData'); // Import the ISIN data module

dummyFn = (message)=>{
  // this was supposed to send message to cliennt, via telegram. not possible for testing
}

describe('populateISINs', () => {
  it('should attach ISINs to each object in the JSON based on tradingsymbol', () => {
    const inputJson = [
      { price: 915.7, total_quantity: 5, tradingsymbol: 'ABB', type: 'BUY' },
      { price: 886.4, total_quantity: 5, tradingsymbol: 'AEGISLOG', type: 'BUY' },
      { price: 2720.55, total_quantity: 2, tradingsymbol: 'UNKNOWN', type: 'BUY' }
    ];

    const expectedOutput =  [                                                                                                                                                                                
        {
          price: 915.7,
          total_quantity: 5,
          tradingsymbol: 'ABB',
          type: 'BUY',
          isin: 'INE117A01022'
        },
        {
          price: 886.4,
          total_quantity: 5,
          tradingsymbol: 'AEGISLOG',
          type: 'BUY',
          isin: 'INE208C01025'
        },
        {
          price: 2720.55,
          total_quantity: 2,
          tradingsymbol: 'UNKNOWN',
          type: 'BUY'
        }
      ]

    const result = populateISINs(inputJson, dummyFn);
    
    expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedOutput));
  });

  it('should handle an empty input JSON gracefully', () => {
    const inputJson = [];
    const expectedOutput = [];
    const result = populateISINs(inputJson);
    expect(result).toEqual(expectedOutput);
  });

  it('should not mutate the original input JSON', () => {
    const inputJson = [
      { price: 915.7, total_quantity: 5, tradingsymbol: 'ABB', type: 'BUY' }
    ];

    const inputJsonCopy = JSON.parse(JSON.stringify(inputJson)); // Deep copy for comparison
    populateISINs(inputJson);
    console.log(JSON.stringify(inputJson)===JSON.stringify(inputJsonCopy));
    
    expect(JSON.stringify(inputJsonCopy)).toEqual(JSON.stringify(inputJson));
  });
});
