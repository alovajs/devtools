import { describe, expect, it } from 'vitest'
import { toCase } from '../src/utils/to-case'

describe('to-case', () => {
  describe('when transformer is not provided', () => {
    it('should return original name when transformer is undefined', () => {
      expect(toCase('testFile')).toBe('testFile')
      expect(toCase('globals.d.ts')).toBe('globals.d.ts')
      expect(toCase('api-definitions')).toBe('api-definitions')
    })

    it('should return original name when transformer is null', () => {
      expect(toCase('testFile', null as any)).toBe('testFile')
    })

    it('should return original name when transformer is explicitly undefined', () => {
      expect(toCase('testFile', undefined)).toBe('testFile')
    })
  })

  describe('when using custom function transformer', () => {
    it('should use custom function to transform name', () => {
      const customTransformer = (name: string) => name.toUpperCase()
      expect(toCase('testFile', customTransformer)).toBe('TESTFILE')
      expect(toCase('globals.d.ts', customTransformer)).toBe('GLOBALS.D.TS')
    })

    it('should support complex custom transformation logic', () => {
      const customTransformer = (name: string) => `prefix_${name}_suffix`
      expect(toCase('testFile', customTransformer)).toBe('prefix_testFile_suffix')
    })
  })

  describe('camelCase transformation', () => {
    it('should transform simple words to camelCase', () => {
      expect(toCase('test', 'camelCase')).toBe('test')
      expect(toCase('testFile', 'camelCase')).toBe('testFile')
      expect(toCase('TestFile', 'camelCase')).toBe('testFile')
    })

    it('should transform multiple words to camelCase', () => {
      expect(toCase('test-file', 'camelCase')).toBe('testFile')
      expect(toCase('test_file', 'camelCase')).toBe('testFile')
      expect(toCase('test file', 'camelCase')).toBe('testFile')
      expect(toCase('test-file-name', 'camelCase')).toBe('testFileName')
    })

    it('should handle filenames with extensions', () => {
      expect(toCase('globals.d.ts', 'camelCase')).toBe('globals.d.ts')
      expect(toCase('test-file.js', 'camelCase')).toBe('testFile.js')
      expect(toCase('api-definitions.d.ts', 'camelCase')).toBe('apiDefinitions.d.ts')
    })

    it('should handle numbers and special characters', () => {
      expect(toCase('test123File', 'camelCase')).toBe('test123File')
      expect(toCase('test-123-file', 'camelCase')).toBe('test123File')
      expect(toCase('test@#$file', 'camelCase')).toBe('testFile')
    })

    it('should handle edge cases', () => {
      expect(toCase('', 'camelCase')).toBe('')
      expect(toCase('a', 'camelCase')).toBe('a')
      expect(toCase('A', 'camelCase')).toBe('a')
      expect(toCase('ABC', 'camelCase')).toBe('abc')
    })
  })

  describe('pascalCase transformation', () => {
    it('should transform simple words to PascalCase', () => {
      expect(toCase('test', 'pascalCase')).toBe('Test')
      expect(toCase('testFile', 'pascalCase')).toBe('TestFile')
      expect(toCase('TestFile', 'pascalCase')).toBe('TestFile')
    })

    it('should transform multiple words to PascalCase', () => {
      expect(toCase('test-file', 'pascalCase')).toBe('TestFile')
      expect(toCase('test_file', 'pascalCase')).toBe('TestFile')
      expect(toCase('test file', 'pascalCase')).toBe('TestFile')
      expect(toCase('test-file-name', 'pascalCase')).toBe('TestFileName')
    })

    it('should handle filenames with extensions', () => {
      expect(toCase('globals.d.ts', 'pascalCase')).toBe('Globals.d.ts')
      expect(toCase('test-file.js', 'pascalCase')).toBe('TestFile.js')
      expect(toCase('api-definitions.d.ts', 'pascalCase')).toBe('ApiDefinitions.d.ts')
    })

    it('should handle numbers and special characters', () => {
      expect(toCase('test123File', 'pascalCase')).toBe('Test123File')
      expect(toCase('test-123-file', 'pascalCase')).toBe('Test123File')
      expect(toCase('test@#$file', 'pascalCase')).toBe('TestFile')
    })

    it('should handle edge cases', () => {
      expect(toCase('', 'pascalCase')).toBe('')
      expect(toCase('a', 'pascalCase')).toBe('A')
      expect(toCase('A', 'pascalCase')).toBe('A')
      expect(toCase('ABC', 'pascalCase')).toBe('Abc')
    })
  })

  describe('kebabCase transformation', () => {
    it('should transform simple words to kebab-case', () => {
      expect(toCase('test', 'kebabCase')).toBe('test')
      expect(toCase('testFile', 'kebabCase')).toBe('test-file')
      expect(toCase('TestFile', 'kebabCase')).toBe('test-file')
    })

    it('should transform multiple words to kebab-case', () => {
      expect(toCase('test-file', 'kebabCase')).toBe('test-file')
      expect(toCase('test_file', 'kebabCase')).toBe('test-file')
      expect(toCase('test file', 'kebabCase')).toBe('test-file')
      expect(toCase('test-file-name', 'kebabCase')).toBe('test-file-name')
    })

    it('should handle filenames with extensions', () => {
      expect(toCase('globals.d.ts', 'kebabCase')).toBe('globals.d.ts')
      expect(toCase('testFile.js', 'kebabCase')).toBe('test-file.js')
      expect(toCase('ApiDefinitions.d.ts', 'kebabCase')).toBe('api-definitions.d.ts')
    })

    it('should handle numbers and special characters', () => {
      expect(toCase('test123File', 'kebabCase')).toBe('test123-file')
      expect(toCase('test-123-file', 'kebabCase')).toBe('test-123-file')
      expect(toCase('test@#$file', 'kebabCase')).toBe('test-file')
    })

    it('should handle edge cases', () => {
      expect(toCase('', 'kebabCase')).toBe('')
      expect(toCase('a', 'kebabCase')).toBe('a')
      expect(toCase('A', 'kebabCase')).toBe('a')
      expect(toCase('ABC', 'kebabCase')).toBe('abc')
    })
  })

  describe('snakeCase transformation', () => {
    it('should transform simple words to snake_case', () => {
      expect(toCase('test', 'snakeCase')).toBe('test')
      expect(toCase('testFile', 'snakeCase')).toBe('test_file')
      expect(toCase('TestFile', 'snakeCase')).toBe('test_file')
    })

    it('should transform multiple words to snake_case', () => {
      expect(toCase('test-file', 'snakeCase')).toBe('test_file')
      expect(toCase('test_file', 'snakeCase')).toBe('test_file')
      expect(toCase('test file', 'snakeCase')).toBe('test_file')
      expect(toCase('test-file-name', 'snakeCase')).toBe('test_file_name')
    })

    it('should handle filenames with extensions', () => {
      expect(toCase('globals.d.ts', 'snakeCase')).toBe('globals.d.ts')
      expect(toCase('testFile.js', 'snakeCase')).toBe('test_file.js')
      expect(toCase('ApiDefinitions.d.ts', 'snakeCase')).toBe('api_definitions.d.ts')
    })

    it('should handle numbers and special characters', () => {
      expect(toCase('test123File', 'snakeCase')).toBe('test123_file')
      expect(toCase('test-123-file', 'snakeCase')).toBe('test_123_file')
      expect(toCase('test@#$file', 'snakeCase')).toBe('test_file')
    })

    it('should handle edge cases', () => {
      expect(toCase('', 'snakeCase')).toBe('')
      expect(toCase('a', 'snakeCase')).toBe('a')
      expect(toCase('A', 'snakeCase')).toBe('a')
      expect(toCase('ABC', 'snakeCase')).toBe('abc')
    })
  })

  describe('default case', () => {
    it('should return original name when using unknown transformer', () => {
      expect(toCase('testFile', 'unknownCase' as any)).toBe('testFile')
      expect(toCase('globals.d.ts', 'invalidCase' as any)).toBe('globals.d.ts')
    })
  })

  describe('complex scenarios', () => {
    it('should handle complex camelCase names', () => {
      expect(toCase('XMLHttpRequest', 'camelCase')).toBe('xmlhttpRequest')
      expect(toCase('XMLHttpRequest', 'pascalCase')).toBe('XmlhttpRequest')
      expect(toCase('XMLHttpRequest', 'kebabCase')).toBe('xmlhttp-request')
      expect(toCase('XMLHttpRequest', 'snakeCase')).toBe('xmlhttp_request')
    })

    it('should handle consecutive numbers and letters', () => {
      expect(toCase('API2Version', 'camelCase')).toBe('api2Version')
      expect(toCase('API2Version', 'pascalCase')).toBe('Api2Version')
      expect(toCase('API2Version', 'kebabCase')).toBe('api2-version')
      expect(toCase('API2Version', 'snakeCase')).toBe('api2_version')
    })

    it('should handle multiple file extensions', () => {
      expect(toCase('test.spec.ts', 'camelCase')).toBe('test.spec.ts')
      expect(toCase('TestFile.spec.ts', 'kebabCase')).toBe('test-file.spec.ts')
      expect(toCase('api-definitions.d.ts', 'pascalCase')).toBe('ApiDefinitions.d.ts')
    })

    it('should handle extension-only files', () => {
      expect(toCase('.gitignore', 'camelCase')).toBe('.gitignore')
      expect(toCase('.env.local', 'kebabCase')).toBe('.env.local')
    })

    it('should handle empty strings and special character only strings', () => {
      expect(toCase('', 'camelCase')).toBe('')
      expect(toCase('...', 'camelCase')).toBe('...')
      expect(toCase('---', 'kebabCase')).toBe('')
      expect(toCase('___', 'snakeCase')).toBe('')
    })
  })
})
