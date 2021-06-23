type ATuple = [number, string];
type AArray = number[];
type ARecord = Record<string | number, 1>;
type AObject = { a: string; b: number };

type ATKey = keyof ATuple; // number | keyof ATuple
type AAKey = keyof AArray; // number | keyof AArray
type ARKey = keyof ARecord; // string | number
type AOKey = keyof AObject; // keyof AObject -> 'a' | 'b'

type ATPro = ATuple[number]; // string | number
type AAPro = AArray[number]; // number
type ARPro = ARecord[string]; // 1
type AOPro = AObject['a' | 'b']; // string | number
