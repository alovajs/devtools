import { describe, expect, it } from 'vitest'
import { makeIdentifier } from '@/core/loader/standardLoader/helper'

describe('makeIdentifier', () => {
  // 测试camelCase风格
  describe('camelCase style', () => {
    it('should convert simple string to camelCase', () => {
      expect(makeIdentifier('hello world', 'camelCase')).toBe('helloWorld')
    })

    it('should handle strings with special characters', () => {
      expect(makeIdentifier('user-name@example', 'camelCase')).toBe('userNameExample')
    })

    it('should handle already camelCased strings', () => {
      expect(makeIdentifier('camelCaseString', 'camelCase')).toBe('camelCaseString')
    })

    it('should handle uppercase strings', () => {
      expect(makeIdentifier('HELLO_WORLD', 'camelCase')).toBe('helloWorld')
    })

    it('should handle strings with numbers', () => {
      expect(makeIdentifier('hello123world', 'camelCase')).toBe('hello123World')
    })

    it('should prefix with underscore if starting with number', () => {
      expect(makeIdentifier('123hello', 'camelCase')).toBe('_123hello')
    })

    it('should add suffix for reserved words', () => {
      expect(makeIdentifier('class', 'camelCase')).toBe('class_')
    })

    it('should handle empty string', () => {
      expect(makeIdentifier('', 'camelCase')).toBe('')
    })
  })

  // 测试snakeCase风格
  describe('snakeCase style', () => {
    it('should convert simple string to snake_case', () => {
      expect(makeIdentifier('hello world', 'snakeCase')).toBe('hello_world')
    })

    it('should handle strings with special characters', () => {
      expect(makeIdentifier('user-name@example', 'snakeCase')).toBe('user_name_example')
    })

    it('should handle camelCased strings', () => {
      expect(makeIdentifier('camelCaseString', 'snakeCase')).toBe('camel_case_string')
    })

    it('should handle uppercase strings', () => {
      expect(makeIdentifier('HELLO_WORLD', 'snakeCase')).toBe('hello_world')
    })

    it('should handle strings with numbers', () => {
      expect(makeIdentifier('hello123world', 'snakeCase')).toBe('hello123_world')
    })

    it('should prefix with underscore if starting with number', () => {
      expect(makeIdentifier('123hello', 'snakeCase')).toBe('_123hello')
    })

    it('should add suffix for reserved words', () => {
      expect(makeIdentifier('class', 'snakeCase')).toBe('class_')
    })

    it('should handle empty string', () => {
      expect(makeIdentifier('', 'snakeCase')).toBe('')
    })
  })

  // 测试边界情况
  describe('edge cases', () => {
    it('should handle strings with only special characters', () => {
      expect(makeIdentifier('!@#$%^&*()', 'camelCase')).toBe('$')
    })

    it('should handle strings with mixed case and special characters', () => {
      expect(makeIdentifier('User_Profile-123', 'camelCase')).toBe('userProfile123')
    })

    it('should handle strings with underscores', () => {
      expect(makeIdentifier('user_profile_data', 'camelCase')).toBe('userProfileData')
    })

    it('should handle strings with multiple consecutive special characters', () => {
      expect(makeIdentifier('user--name', 'snakeCase')).toBe('user_name')
    })

    it('should handle strings with multiple uppercase letters', () => {
      expect(makeIdentifier('APIResponse', 'camelCase')).toBe('apiResponse')
    })

    it('should handle strings with multiple uppercase letters in snake_case', () => {
      expect(makeIdentifier('APIResponse', 'snakeCase')).toBe('api_response')
    })
  })
})
