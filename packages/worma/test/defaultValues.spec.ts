import { defaultValueLoader } from '@/core/loader'
import { createStrReg } from './util'

describe('generate default values for types and interfaces', () => {
  it('should generate default value for simple type', async () => {
    const sourceCode = 'string'
    const result = await defaultValueLoader.transform(sourceCode)
    expect(result).toBe('""')
  })

  it('should generate default value for union type', async () => {
    const sourceCode = `
      {
        typeEnum:
          | 'CERT_TYPE'
          | 'COLLECTION_TYPE'
          | 'MONITOR_TASK_TYPE'
      }
    `
    const result = await defaultValueLoader.transform(sourceCode)
    expect(result).toMatch(
      createStrReg(`{
          typeEnum: 'CERT_TYPE'
        }`),
    )
  })

  it('should generate default value for object type', async () => {
    const sourceCode = `{
      name: string
      age: number
      active: boolean
      [key: string]: any
    }`
    const result = await defaultValueLoader.transform(sourceCode)
    expect(result).toMatch(
      createStrReg(`{
  name: "",
  age: 0,
  active: false
}`),
    )
  })
  it('should handle intersection types', async () => {
    const sourceCode = `
      {
        combined:
          & { prop1: string }
          & { prop2: number }
      }
    `
    const result = await defaultValueLoader.transform(sourceCode)
    expect(result).toMatch(
      createStrReg(`{
  combined: {
    prop1: "" ,
    prop2: 0
  }
}`),
    )
  })

  it('should handle nested types', async () => {
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
    }`
    const result = await defaultValueLoader.transform(sourceCode)
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
}`),
    )
  })
})
