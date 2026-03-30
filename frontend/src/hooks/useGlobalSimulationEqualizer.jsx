import { useState, useEffect, createContext, useContext } from 'react';

// Context para compartir valores del ecualizador globalmente
const GlobalSimulationEqualizerContext = createContext();

// Hook para usar el contexto
export const useGlobalSimulationEqualizer = () => {
  const context = useContext(GlobalSimulationEqualizerContext);
  if (!context) {
    throw new Error('useGlobalSimulationEqualizer must be used within a GlobalSimulationEqualizerProvider');
  }
  return context;
};

// Provider Component
export const GlobalSimulationEqualizerProvider = ({ children }) => {
  // Valores base del ecualizador (los mismos que en SimulationEqualizer)
  const [equalizerValues, setEqualizerValues] = useState({
    dataPercentage: 50,      // 50% of available data
    queryFrequency: 25,      // 25 queries per hour
    queryIntensity: 60,      // 60% complexity
    simulationDuration: 60,  // 60 minutes
    concurrentQueries: 10,   // 10 parallel queries
    cacheHitRate: 70        // 70% cache hit rate
  });

  // Función para calcular multiplicadores basados en los valores del ecualizador
  const calculateMultipliers = () => {
    const safeDiv = (a, b) => b === 0 ? 1 : a / b;
    const safeMult = (...values) => values.reduce((acc, val) => acc * (isNaN(val) ? 1 : val), 1);
    
    return {
      // Cost multiplier based on data volume and query intensity
      costMultiplier: Math.max(0.1, safeMult(
        equalizerValues.dataPercentage / 100,
        equalizerValues.queryIntensity / 100,
        equalizerValues.queryFrequency / 50,
        equalizerValues.concurrentQueries / 20,
        1 - (equalizerValues.cacheHitRate / 100) * 0.5
      )),

      // Performance multiplier (inverse of cost for some metrics)
      performanceMultiplier: Math.max(0.1, safeMult(
        equalizerValues.cacheHitRate / 100,
        safeDiv(1, equalizerValues.queryIntensity / 100),
        safeDiv(1, equalizerValues.concurrentQueries / 20)
      )),

      // Data processing multiplier
      dataMultiplier: Math.max(0.1, safeMult(
        equalizerValues.dataPercentage / 100,
        equalizerValues.simulationDuration / 120
      )),

      // Query complexity multiplier
      complexityMultiplier: Math.max(0.1, safeMult(
        equalizerValues.queryIntensity / 100,
        equalizerValues.queryFrequency / 25,
        equalizerValues.concurrentQueries / 10
      ))
    };
  };

  // Función para aplicar modificaciones a los valores de las tarjetas REALES
  const applyEqualizerToCard = (originalCard) => {
    // Si no hay datos reales del simulador, retornar null (no crear datos falsos)
    if (!originalCard) {
      console.warn("⚠️ No REAL simulator data found - simulator may not be running or data not loaded yet");
      return null;
    }

    const multipliers = calculateMultipliers();
    
    // Log para debug de datos reales
    console.log("🔄 Applying equalizer to REAL simulator data:", {
      simulatorValue: originalCard.value,
      simulatorChange: originalCard.change,
      multipliers,
      hasComputeData: !!originalCard.computeData?.length,
      hasStorageData: !!originalCard.storageData?.length,
      hasEnergyData: !!originalCard.energyData?.length,
      hasDepreciationData: !!originalCard.depreciationData?.length
    });
    
    return {
      ...originalCard,
      // Modify the main value based on cost multiplier
      value: (originalCard.value || 0) * multipliers.costMultiplier,
      
      // Modify change percentage based on performance
      change: (originalCard.change || 0) * multipliers.performanceMultiplier,
      
      // Modify compute data based on complexity - handle both arrays of numbers and objects
      computeData: originalCard.computeData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.complexityMultiplier
          : { ...item, value: (item.value || 0) * multipliers.complexityMultiplier }
      ) || [],
      
      // Modify storage data based on data multiplier - handle both arrays of numbers and objects
      storageData: originalCard.storageData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.dataMultiplier
          : { ...item, value: (item.value || 0) * multipliers.dataMultiplier }
      ) || [],
      
      // Handle ALL simulator-specific fields
      
      // OnPrem & Lakehouse: energyData
      energyData: originalCard.energyData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.costMultiplier
          : { ...item, value: (item.value || 0) * multipliers.costMultiplier }
      ) || [],
      
      // OnPrem & Lakehouse: depreciationData
      depreciationData: originalCard.depreciationData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.costMultiplier
          : { ...item, value: (item.value || 0) * multipliers.costMultiplier }
      ) || [],
      
      // AWS: transferData
      transferData: originalCard.transferData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.dataMultiplier
          : { ...item, value: (item.value || 0) * multipliers.dataMultiplier }
      ) || [],
      
      // Databricks: egressData
      egressData: originalCard.egressData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.dataMultiplier
          : { ...item, value: (item.value || 0) * multipliers.dataMultiplier }
      ) || [],
      
      // Hybrid: s3Data, sqlData
      s3Data: originalCard.s3Data?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.dataMultiplier
          : { ...item, value: (item.value || 0) * multipliers.dataMultiplier }
      ) || [],
      
      sqlData: originalCard.sqlData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.complexityMultiplier
          : { ...item, value: (item.value || 0) * multipliers.complexityMultiplier }
      ) || [],
      
      // Lakehouse: lambdaData, s3Data, athenaData
      lambdaData: originalCard.lambdaData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.complexityMultiplier
          : { ...item, value: (item.value || 0) * multipliers.complexityMultiplier }
      ) || [],
      
      athenaData: originalCard.athenaData?.map(item => 
        typeof item === 'number' 
          ? item * multipliers.complexityMultiplier
          : { ...item, value: (item.value || 0) * multipliers.complexityMultiplier }
      ) || []
    };
  };

  // Función para actualizar un valor específico del ecualizador
  const updateEqualizerValue = (key, value) => {
    setEqualizerValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Value object to provide to context
  const contextValue = {
    equalizerValues,
    setEqualizerValues,
    updateEqualizerValue,
    calculateMultipliers,
    applyEqualizerToCard,
    
    // Real-time stats for display
    isEqualizerActive: true,
    currentMultipliers: calculateMultipliers()
  };

  return (
    <GlobalSimulationEqualizerContext.Provider value={contextValue}>
      {children}
    </GlobalSimulationEqualizerContext.Provider>
  );
};

export default GlobalSimulationEqualizerProvider;