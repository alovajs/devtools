import { generateDefaultValues } from '@/helper/typeStr';
import { createStrReg } from './util';

describe('generate default values for types and interfaces', () => {
  it('should generate default value for simple type', () => {
    const sourceCode = 'string';
    const result = generateDefaultValues(sourceCode);
    expect(result).toBe('""');
  });

  it('should generate default value for union type', () => {
    const sourceCode = `
      {
        typeEnum:
          | 'CERT_TYPE'
          | 'COLLECTION_TYPE'
          | 'MONITOR_TASK_TYPE'
      }
    `;
    const result = generateDefaultValues(sourceCode);
    expect(result).toMatch(
      createStrReg(`{
          typeEnum: 'CERT_TYPE'
        }`)
    );
  });

  it('should generate default value for object type', () => {
    const sourceCode = `{
      name: string
      age: number
      active: boolean
    }`;
    const result = generateDefaultValues(sourceCode);
    expect(result).toMatch(
      createStrReg(`{
  name: "",
  age: 0,
  active: false
}`)
    );
  });
  it('should handle intersection types', () => {
    const sourceCode = `
      {
        combined:
          & { prop1: string }
          & { prop2: number }
      }
    `;
    const result = generateDefaultValues(sourceCode);
    expect(result).toMatch(
      createStrReg(`{
  combined: {
    prop1: "" ,
    prop2: 0
  }
}`)
    );
  });

  it('should handle nested types', () => {
    const sourceCode = `{
      info: {
        personal: {
          name: string;
          age: number;
          test: string[];
        };
        contact: {
          email: string;
          phone?: string;
        };
      }
    }`;
    const result = generateDefaultValues(sourceCode);
    expect(result).toMatch(
      createStrReg(`{
  info: {
    personal: {
      name: "",
      age: 0,
      test: []
    },
    contact: {
      email: ""
    }
  }
}`)
    );
  });
});
