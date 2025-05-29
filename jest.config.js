module.exports = {
    // Entorno de ejecución
    testEnvironment: 'node',
    
    // Timeout para tests (30 segundos)
    testTimeout: 30000,
    
    // Mostrar información detallada
    verbose: true,
    
    // Ejecutar tests en secuencia para evitar conflictos
    maxWorkers: 1,
    
    // Configuración para evitar memory leaks y procesos colgados
    detectOpenHandles: true,
    forceExit: true,
    
    // Variables de entorno para tests (se carga ANTES de todo)
    setupFiles: ['<rootDir>/tests/env.setup.js'],
    
    // Patrón de archivos de test
    testMatch: [
      '<rootDir>/tests/**/*.test.js'
    ],
    
    // Ignorar archivos
    testPathIgnorePatterns: [
      '/node_modules/',
      '/build/',
      '/dist/',
      '/coverage/'
    ],
    
    // Configuración de coverage (deshabilitado por ahora)
    collectCoverage: false,
    
    // Limpiar mocks
    clearMocks: true,
    restoreMocks: true
  };