export enum ErrorCode {
  // Configuration errors (1xxx)
  CONFIG_INVALID = 1000,
  CONFIG_MISSING = 1001,
  CONFIG_VALIDATION_FAILED = 1002,

  // Parser errors (2xxx)
  PARSE_FAILED = 2000,
  INVALID_OPENAPI_FORMAT = 2001,
  SCHEMA_VALIDATION_FAILED = 2002,

  // Generator errors (3xxx)
  GENERATION_FAILED = 3000,
  TEMPLATE_NOT_FOUND = 3001,
  OUTPUT_PATH_ERROR = 3002,

  // Plugin errors (4xxx)
  PLUGIN_LOAD_FAILED = 4000,
  PLUGIN_EXECUTION_FAILED = 4001,

  // File system errors (5xxx)
  FILE_READ_ERROR = 5000,
  FILE_WRITE_ERROR = 5001,
  FILE_PERMISSION_ERROR = 5002,

  // Network errors (6xxx)
  NETWORK_ERROR = 6000,
  API_REQUEST_FAILED = 6001,

  // Unknown errors (9xxx)
  UNKNOWN_ERROR = 9000
}

export default {
  ErrorCode
};
