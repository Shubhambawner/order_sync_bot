const extractOrderInfo = require('./module.gemini');

describe('extractOrderInfo', () => {
  it('should parse a valid raw string into the correct JSON structure', async () => {
    const input = `BUY 915.7 5 LICI
BUY 886.4 5 TATAMOTORS
BUY 2720.55 2 RELIANCE`;

    const expectedOutput = [
      {
        price: 915.7,
        total_quantity: 5,
        tradingsymbol: 'LICI',
        type: 'BUY'
      },
      {
        price: 886.4,
        total_quantity: 5,
        tradingsymbol: 'TATAMOTORS',
        type: 'BUY'
      },
      {
        price: 2720.55,
        total_quantity: 2,
        tradingsymbol: 'RELIANCE',
        type: 'BUY'
      }
    ];

    const result = await extractOrderInfo(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should return an empty array when given an empty string', async () => {
    const input = '';
    const expectedOutput = [];
    const result = await extractOrderInfo(input);
    expect(result).toEqual(expectedOutput);
  });

  // it('should handle malformed data gracefully', async () => {
  //   const input = `BUY BAD-DATA HERE`;
  //   await expect(extractOrderInfo(input)).rejects.toThrow('Invalid order data');
  // });

  it('should handle mixed valid and invalid lines', async () => {
    const input = `BUY 915.7 5 LICI
INVALID LINE
SELL 886.4 2 RELIANCE`;
    const expectedOutput = [
      {
        price: 915.7,
        total_quantity: 5,
        tradingsymbol: 'LICI',
        type: 'BUY'
      },
      {
        price: 886.4,
        total_quantity: 2,
        tradingsymbol: 'RELIANCE',
        type: 'SELL'
      }
    ];

    const result = await extractOrderInfo(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should parse both BUY and SELL orders correctly', async () => {
    const input = `BUY 100.5 10 ABC
SELL 200.7 5 XYZ`;
    const expectedOutput = [
      {
        price: 100.5,
        total_quantity: 10,
        tradingsymbol: 'ABC',
        type: 'BUY'
      },
      {
        price: 200.7,
        total_quantity: 5,
        tradingsymbol: 'XYZ',
        type: 'SELL'
      }
    ];

    const result = await extractOrderInfo(input);
    expect(result).toEqual(expectedOutput);
  });
});
