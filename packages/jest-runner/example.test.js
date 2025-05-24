// Example test file to demonstrate Jest runner functionality

describe('Math operations', () => {
    test('should add numbers correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('should subtract numbers correctly', () => {
        expect(5 - 3).toBe(2);
    });

    describe('nested operations', () => {
        test('should multiply', () => {
            expect(3 * 4).toBe(12);
        });
        
        test.skip('should divide', () => {
            expect(10 / 2).toBe(5);
        });
    });
});

test('standalone test', () => {
    expect(true).toBe(true);
});

describe('String operations', () => {
    test.only('should concatenate strings', () => {
        expect('Hello' + ' ' + 'World').toBe('Hello World');
    });
    
    it('should convert to uppercase', () => {
        expect('hello'.toUpperCase()).toBe('HELLO');
    });
});